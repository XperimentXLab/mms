from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction as db_transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db.models import Sum, F
from django.http import HttpRequest
from datetime import timedelta
import logging
from .models import *

logger = logging.getLogger(__name__)


def _distribute_affiliate_bonus_for_user(
    downline_user: User,
    daily_rate_percentage: Decimal,
    wallets_needing_affiliate_update_list: list,
    affiliate_transactions_list: list,
    all_wallets_map: dict,  # Map of {user_id: wallet_instance}
    all_asset_map: dict,  # Map of {user_id: asset_instance}
    metrics: dict,
):
    """
    Calculates and prepares affiliate bonuses for L1 and L2 uplines.
    Modifies wallet objects in-place and appends to transaction list.
    """
    if not downline_user or not all_wallets_map or not all_asset_map:
        return

    downline_asset = all_asset_map.get(downline_user.id)
    if not downline_asset or downline_asset.amount <= Decimal('0.00'):
        return  # Skip if downline has no asset

    # Level 1 Upline
    if downline_user.referred_by:
        upline_l1_id = downline_user.referred_by
        upline_l1_wallet = all_wallets_map.get(upline_l1_id)
        upline_l1_asset = all_asset_map.get(upline_l1_id)

        if (upline_l1_wallet and upline_l1_wallet.user.is_active and 
            upline_l1_asset and upline_l1_asset.amount > Decimal('0.00')):
            
            l1_bonus_percentage = Decimal('0.05')  # 5%
            daily_profit = (downline_asset.amount * (daily_rate_percentage / Decimal('100.00'))).quantize(Decimal('0.0001'))
            l1_bonus_amount = (daily_profit * l1_bonus_percentage).quantize(Decimal('0.01'))

            if l1_bonus_amount > Decimal('0.00'):
                upline_l1_wallet.affiliate_point_balance += l1_bonus_amount
                metrics['l1_bonuses_paid'] += 1
                
                wallets_needing_affiliate_update_list.append(upline_l1_wallet)

                current_time = timezone.now()
                affiliate_transactions_list.append(
                    Transaction(
                        user=upline_l1_wallet.user,
                        wallet=upline_l1_wallet,
                        transaction_type='AFFILIATE_BONUS',
                        point_type='COMMISSION',
                        amount=l1_bonus_amount,
                        description=f"L1 Affiliate bonus (5%) from {downline_user.username}'s profit.",
                        reference=f"AffL1_{downline_user.id}_{current_time.strftime('%Y%m%d')}"
                    )
                )

                # Level 2 Upline (based on L1's referrer)
                if upline_l1_wallet.user.referred_by:
                    upline_l2_id = upline_l1_wallet.user.referred_by
                    if upline_l2_id == downline_user.id or upline_l2_id == upline_l1_id:
                        logger.warning(f"Skipping L2 affiliate bonus for {upline_l2_id} due to potential referral loop")
                        return

                    upline_l2_wallet = all_wallets_map.get(upline_l2_id)
                    upline_l2_asset = all_asset_map.get(upline_l2_id)

                    if (upline_l2_wallet and upline_l2_wallet.user.is_active and 
                        upline_l2_asset and upline_l2_asset.amount > Decimal('0.00')):
                        
                        l2_bonus_percentage = Decimal('0.02')  # 2%
                        l2_bonus_amount = (daily_profit * l2_bonus_percentage).quantize(Decimal('0.01'))

                        if l2_bonus_amount > Decimal('0.00'):
                            upline_l2_wallet.affiliate_point_balance += l2_bonus_amount
                            metrics['l2_bonuses_paid'] += 1
                            
                            wallets_needing_affiliate_update_list.append(upline_l2_wallet)

                            current_time = timezone.now()
                            affiliate_transactions_list.append(
                                Transaction(
                                    user=upline_l2_wallet.user,
                                    wallet=upline_l2_wallet,
                                    transaction_type='AFFILIATE_BONUS',
                                    point_type='COMMISSION',
                                    amount=l2_bonus_amount,
                                    description=f"L2 Affiliate bonus (2%) from {downline_user.username}'s profit (via {upline_l1_wallet.user.username}).",
                                    reference=f"AffL2_{downline_user.id}_{current_time.strftime('%Y%m%d')}"
                                )
                            )
                    elif upline_l2_wallet and not upline_l2_wallet.user.is_active:
                        logger.info(f"L2 upline {upline_l2_id} is inactive. No L2 affiliate bonus.")
                    elif not upline_l2_wallet:
                        logger.warning(f"Wallet not found for L2 upline {upline_l2_id}")

        elif upline_l1_wallet and not upline_l1_wallet.user.is_active:
            logger.info(f"L1 upline {upline_l1_id} is inactive. No L1/L2 affiliate bonus.")
        elif not upline_l1_wallet:
            logger.warning(f"Wallet not found for L1 upline {upline_l1_id}")


def distribute_profit_manually():
    """
    Calculates and distributes profit to user wallets (profit_point_balance),
    distributes affiliate bonuses to uplines (affiliate_point_balance)
    Triggered manually by an admin.
    """
    metrics = {
        'users_with_profit': 0,
        'total_profit_distributed': Decimal('0.00'),
        'l1_bonuses_paid': 0,
        'l2_bonuses_paid': 0,
        'skipped_users': 0
    }
    
    try:
        operational_profit = OperationalProfit.objects.first()
        if not operational_profit:
            logger.error("OperationalProfit record not found.")
            raise ValidationError("OperationalProfit record not found. Cannot distribute profit.")
        
        daily_rate_percentage = Decimal(operational_profit.daily_profit_rate)
        if daily_rate_percentage <= Decimal('0.00'):
            logger.info(f"Profit rate ({daily_rate_percentage}%) is zero. No profit distributed.")
            return {"status": "skipped", "message": "Profit rate is zero."}

        logger.info(f"Starting manual profit distribution with rate: {daily_rate_percentage}%.")

        # Pre-fetch all active user wallets and assets
        eligible_users = User.objects.filter(
            is_active=True,
            wallet__isnull=False,
            assets__amount__gt=0
        ).select_related('wallet').prefetch_related('assets')
        
        all_wallets_map = {user.id: user.wallet for user in eligible_users if hasattr(user, 'wallet')}
        all_asset_map = {user.id: user.assets.filter(amount__gt=Decimal('0.00')).first() for user in eligible_users}

        wallets_to_update_profit = []
        profit_transactions = []
        wallets_to_update_affiliate = []
        affiliate_transactions = []

        for wallet_instance in all_wallets_map.values():
            user = wallet_instance.user
            asset = all_asset_map.get(user.id)
            if not asset or asset.amount <= Decimal('0.00'):
                metrics['skipped_users'] += 1
                continue

            asset_balance = Decimal(asset.amount)
            raw_profit = (asset_balance * (daily_rate_percentage / Decimal('100.00'))\
                         .quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
            
            if raw_profit <= Decimal('0.00'):
                continue

            user_share_ratio = Decimal('0.80') if asset_balance >= Decimal('10000.00') else Decimal('0.70')
            user_profit_amount = (raw_profit * user_share_ratio).quantize(Decimal('0.01'))

            if user_profit_amount > Decimal('0.00'):
                wallet_instance.profit_point_balance = F('profit_point_balance') + user_profit_amount
                wallets_to_update_profit.append(wallet_instance)

                metrics['users_with_profit'] += 1
                metrics['total_profit_distributed'] += user_profit_amount

                profit_transactions.append(
                    Transaction(
                        user=user,
                        wallet=wallet_instance,
                        transaction_type='DISTRIBUTION',
                        point_type='PROFIT',
                        amount=user_profit_amount,
                        description=f"Profit distribution ({daily_rate_percentage}% on Asset {asset_balance:.2f}).",
                        reference=f"ProfitDist_{timezone.now().strftime('%Y%m%d')}"
                    )
                )
                
                # Distribute affiliate bonuses
                _distribute_affiliate_bonus_for_user(
                    downline_user=user,
                    daily_rate_percentage=daily_rate_percentage,
                    wallets_needing_affiliate_update_list=wallets_to_update_affiliate,
                    affiliate_transactions_list=affiliate_transactions,
                    all_wallets_map=all_wallets_map,
                    all_asset_map=all_asset_map,
                    metrics=metrics
                )

            # Perform database updates atomically
            with db_transaction.atomic():

                # Update profit balances
                if wallets_to_update_profit:
                    Wallet.objects.bulk_update(
                        wallets_to_update_profit,
                        ['profit_point_balance', 'updated_at'],
                        batch_size=500
                    )
                    logger.info(f"Updated profit_point_balance for {len(wallets_to_update_profit)} wallets.")

            # Update affiliate balances (ensuring uniqueness)
            if wallets_to_update_affiliate:
                unique_affiliate_wallets = {w.pk: w for w in wallets_to_update_affiliate}.values()
                Wallet.objects.bulk_update(
                    unique_affiliate_wallets,
                    ['affiliate_point_balance', 'updated_at'],
                    batch_size=500
                )
                logger.info(f"Updated affiliate_point_balance for {len(unique_affiliate_wallets)} wallets.")

            # Create transactions
            if profit_transactions:
                Transaction.objects.bulk_create(profit_transactions, batch_size=500)
            if affiliate_transactions:
                Transaction.objects.bulk_create(affiliate_transactions, batch_size=500)
            
            logger.info(f"Created {len(profit_transactions)} profit and {len(affiliate_transactions)} affiliate transactions.")
        
        return {
            "status": "success",
            "message": "Profit and affiliate bonuses distributed successfully.",
            "metrics": metrics,
            "profit_wallets_updated": len(wallets_to_update_profit),
            "affiliate_wallets_updated": len(set(wallets_to_update_affiliate)),
            "profit_tx_created": len(profit_transactions),
            "affiliate_tx_created": len(affiliate_transactions),
        }

    except OperationalProfit.DoesNotExist:
        logger.error("OperationalProfit record not found.")
        raise ValidationError('OperationalProfit record not found.')
    except Exception as e:
        logger.error(f"Error during distribution: {e}", exc_info=True)
        raise ValidationError('Unexpected error during distribution.')


class UserService:
    @staticmethod
    def setup_user(user_id, master_amount, profit_amount, affiliate_amount):
        """Initialize user wallet with migration amounts"""
        with db_transaction.atomic():
            user = User.objects.select_for_update().get(id=user_id)
            wallet = Wallet.objects.select_for_update().get_or_create(user=user)[0]
            
            wallet.master_point_balance += Decimal(master_amount)
            wallet.profit_point_balance += Decimal(profit_amount)
            wallet.affiliate_point_balance += Decimal(affiliate_amount)
            wallet.save()

            Transaction.objects.bulk_create([
                Transaction(
                    user=user,
                    wallet=wallet,
                    transaction_type='MIGRATION',
                    point_type='PROFIT',
                    amount=profit_amount,
                    description="Migration of profit",
                ),
                Transaction(
                    user=user,
                    wallet=wallet,
                    transaction_type='MIGRATION',
                    point_type='COMMISSION',
                    amount=affiliate_amount,
                    description="Migration of affiliate bonus"
                ),
                Transaction(
                    user=user,
                    wallet=wallet,
                    transaction_type='MIGRATION',
                    point_type='MASTER',
                    amount=master_amount,
                    description="Migration of master point",
                )
            ])

            return wallet


class WalletService:
    @staticmethod
    def transfer_master_point(sender, receiver, amount, description="", reference=""):
        """Transfer Master Point between users with proper locking"""
        amount = Decimal(amount)
        if amount <= 0:
            raise ValidationError("There is no Register Point balance")
        
        with db_transaction.atomic():
            sender_wallet = Wallet.objects.select_for_update().get(user=sender)
            if sender_wallet.master_point_balance < amount:
                raise ValidationError("Insufficient Master Point balance")
            
            receiver_wallet = Wallet.objects.select_for_update().get(user=receiver)
            
            sender_wallet.master_point_balance -= amount
            receiver_wallet.master_point_balance += amount
            
            sender_wallet.save()
            receiver_wallet.save()
            
            Transaction.objects.bulk_create([
                Transaction(
                    user=sender,
                    wallet=sender_wallet,
                    transaction_type='TRANSFER',
                    point_type='MASTER',
                    amount=amount,
                    description=description,
                    reference=reference
                ),
                Transaction(
                    user=receiver,
                    wallet=receiver_wallet,
                    transaction_type='TRANSFER',
                    point_type='MASTER',
                    amount=amount,
                    description=f"Transfer from {sender.username}: {description}",
                    reference=f"TRANSFER-{sender.id}"
                )
            ])
            
            return sender_wallet, receiver_wallet

    @staticmethod 
    def place_asset(user, amount, description="", reference=""):
        """Place asset from Master Point with proper validation"""
        amount = Decimal(amount)
        if amount < 50:
            raise ValidationError("Minimum placement amount is 50 USDT")
        if amount % 10 != 0:
            raise ValidationError("Amount must be a multiple of 10")

        with db_transaction.atomic():
            user = User.objects.select_for_update().get(id=user.id)
            if user.verification_status != 'REQUIRES_ACTION':
                raise ValidationError("User is not verified.")

            wallet = Wallet.objects.select_for_update().get(user=user)
            if wallet.master_point_balance < amount:
                raise ValidationError("Insufficient Master Point balance")
            
            wallet.master_point_balance -= amount
            wallet.save()
            
            asset = Asset.objects.select_for_update().get(user=user)
            
            deposit_trx = Transaction.objects.create(
                user=user,
                wallet=wallet,
                asset=asset,
                transaction_type='ASSET_PLACEMENT',
                point_type='MASTER',
                amount=amount,
                description=description,
                request_status='PENDING',
                reference=reference
            )

            DepositLock.objects.create(
                deposit=deposit_trx,
                amount_6m_locked=amount / Decimal('2'),
                amount_1y_locked=amount / Decimal('2'),
            )
            
            return wallet, asset

    @staticmethod
    def process_place_asset(transaction_id, action):
        """Approve or reject a PENDING asset placement"""
        with db_transaction.atomic():
            trx = Transaction.objects.select_for_update().get(
                id=transaction_id,
                transaction_type='ASSET_PLACEMENT',
                request_status='PENDING'
            )
            
            wallet = trx.wallet
            asset = Asset.objects.select_for_update().get(user=trx.user)
            amount = trx.amount

            if action == 'Approve':
                asset.amount = F('amount') + amount
                asset.save()
                trx.request_status = 'APPROVED'
                trx.save()

                # Introducer Bonus
                if trx.user.referred_by:
                    try:
                        introducer = User.objects.get(id=trx.user.referred_by)
                        introducer_wallet = Wallet.objects.get(user=introducer)
                        introducer_asset = Asset.objects.get(user=introducer)
                        
                        asset_amount = introducer_asset.amount
                        if asset_amount == 0:
                            bonus_rate = Decimal('0.00')
                        elif asset_amount < 1000:
                            bonus_rate = Decimal('0.02')
                        elif 1000 <= asset_amount < 10000:
                            bonus_rate = Decimal('0.025')
                        else:
                            bonus_rate = Decimal('0.03')
                            
                        bonus_amount = (bonus_rate * amount).quantize(Decimal('0.01'))
                        introducer_wallet.introducer_point_balance = F('introducer_point_balance') + bonus_amount
                        introducer_wallet.save()
                        
                        Transaction.objects.create(
                            user=introducer,
                            wallet=introducer_wallet,
                            transaction_type='INTRODUCER_BONUS',
                            point_type='COMMISSION',
                            amount=bonus_amount,
                            description=f"Introducer bonus from {trx.user.username} asset placement ({amount})",
                            reference=f"INTRODUCER_BONUS_{trx.user.id}"
                        )
                    except User.DoesNotExist:
                        pass

            elif action == 'Reject':
                wallet.master_point_balance = F('master_point_balance') + amount
                wallet.save()
                trx.request_status = 'REJECTED'
                trx.save()
                
            return trx


class AssetService:
    @classmethod
    def grant_free_campro(cls, user_id):
        """Grants 100 free CAMPRO to a user (locked for 1 year)."""
        with db_transaction.atomic():
            user = User.objects.select_for_update().get(id=user_id)
            if user.is_campro:
                raise ValidationError("User already received welcome bonus.")
            
            asset, _ = Asset.objects.get_or_create(user=user)
            asset.amount = F('amount') + Decimal('100.00')
            asset.is_free_campro = True
            asset.save()

            trx = Transaction.objects.create(
                user=user,
                asset=asset,
                transaction_type='WELCOME_BONUS',
                point_type='ASSET',
                amount=Decimal('100.00'),
                description="Welcome Bonus (locked for 1 year)",
                reference="WELCOME_BONUS"
            )

            DepositLock.objects.create(
                deposit=trx,
                is_free_campro=True,
                amount_6m_locked=Decimal('0.00'),
                amount_1y_locked=Decimal('100.00'),
                amount_6m_unlocked=Decimal('0.00'),
                amount_1y_unlocked=Decimal('0.00')
            )

            user.is_campro = True
            user.save()
            return trx

    @staticmethod
    def withdraw_asset(user, amount, description="", reference=""):
        """Withdraw asset to Profit with proper validation"""
        amount = Decimal(amount)
        if amount < 50:
            raise ValidationError("Minimum withdrawal amount is 50 USDT")
        if amount % 10 != 0:
            raise ValidationError("Amount must be a multiple of 10")
        
        if user.verification_status != 'APPROVED':
            raise ValidationError("User is not verified.")

        with db_transaction.atomic():
            user = User.objects.select_for_update().get(id=user.id)
            if user.verification_status != 'REQUIRES_ACTION':
                raise ValidationError("User is not verified.")

            asset = Asset.objects.select_for_update().get(user=user)
            if asset.amount < amount:
                raise ValidationError("Insufficient Asset balance")
            
            locks = DepositLock.objects.filter(
                deposit__user=user,
                deposit__transaction_type='ASSET_PLACEMENT'
            ).select_related('deposit').order_by('deposit__created_at')

            total_withdrawable = sum(lock.withdrawable_now or Decimal('0.00') for lock in locks)
            if amount > total_withdrawable:
                raise ValidationError(
                    f"Only {total_withdrawable} is withdrawable (50% after 6M, 100% after 1Y)"
                )
            
            Transaction.objects.create(
                user=user,
                asset=asset,
                transaction_type='ASSET_WITHDRAWAL',
                point_type='ASSET',
                amount=amount,
                description=description,
                request_status='PENDING',
                reference=reference,
            )
            return asset
    
    @staticmethod
    def process_withdrawal_request(transaction_id, action):
        """Approve or reject a PENDING asset withdrawal"""
        with db_transaction.atomic():
            trx = Transaction.objects.select_for_update().get(
                id=transaction_id,
                transaction_type='ASSET_WITHDRAWAL',
                request_status='PENDING'
            )
            
            if action == 'Approve':
                asset = Asset.objects.select_for_update().get(user=trx.user)
                wallet = Wallet.objects.select_for_update().get(user=trx.user)
                amount = trx.amount

                # Deduct from locks
                remaining = amount
                locks = DepositLock.objects.filter(
                    deposit__user=trx.user
                ).select_for_update().order_by('deposit__created_at')

                for lock in locks:
                    if remaining <= 0:
                        break

                    available = lock.withdrawable_now
                    deduct = min(available, remaining)

                    current_time = timezone.now()
                    
                    if deduct > 0:
                        age = current_time - lock.deposit.created_at
                        if age >= timedelta(days=365):
                            lock.amount_1y_unlocked = F('amount_1y_unlocked') + deduct
                        elif age >= timedelta(days=180):
                            lock.amount_6m_unlocked = F('amount_6m_unlocked') + deduct
                        lock.save()
                        remaining -= deduct

                if remaining > 0:
                    raise ValidationError("Insufficient unlocked funds")

                # Update balances
                asset.amount = F('amount') - amount
                asset.save()
                
                wallet.profit_point_balance = F('profit_point_balance') + amount
                wallet.save()

                trx.request_status = 'APPROVED'
                trx.save()

            elif action == 'Reject':
                trx.request_status = 'REJECTED'
                trx.save()

            return trx
            

class ProfitService:
    @staticmethod
    def request_withdrawal(user, amount, reference=""):
        """Request Profit Point withdrawal with 3% fee"""
        amount = Decimal(amount)
        if amount < 50:
            raise ValidationError("Minimum withdrawal amount is 50 USDT")
        if amount % 10 != 0:
            raise ValidationError("Amount must be a multiple of 10")
        
        with db_transaction.atomic():
            user = User.objects.select_for_update().get(id=user.id)
            if user.verification_status != 'REQUIRES_ACTION':
                raise ValidationError("User is not verified.")

            wallet = Wallet.objects.select_for_update().get(user=user)
            if wallet.profit_point_balance < amount:
                raise ValidationError("Insufficient Profit Point balance")
            
            fee_rate = Decimal('0.03')
            fee = (amount * fee_rate).quantize(Decimal('0.01'))
            actual_amount = amount - fee
            
            wallet.profit_point_balance = F('profit_point_balance') - amount
            wallet.save()

            withdrawal_request = WithdrawalRequest.objects.create(
                wallet=wallet,
                point_type='PROFIT',
                amount=amount,
                actual_amount=actual_amount,
                fee=fee,
                fee_rate=fee_rate,
            )
            
            txn = Transaction.objects.create(
                user=user,
                wallet=wallet,
                transaction_type='WITHDRAWAL',
                point_type='PROFIT',
                amount=amount,
                description=f"Profit Withdrawal request #{withdrawal_request.id} (Pending): {amount}",
                request_status='PENDING',
                reference=reference
            )
            
            withdrawal_request.transaction = txn
            withdrawal_request.save()
        
            return withdrawal_request, wallet

    @staticmethod
    def process_withdrawal_request(request_id, action, reference = ""):
        """Approve or reject a withdrawal request"""
        with db_transaction.atomic():
            withdrawal_request = WithdrawalRequest.objects.select_for_update().get(id=request_id)
            txn = withdrawal_request.transaction
            
            if txn.request_status != 'PENDING':
                raise ValidationError("Request already processed")
            
            wallet = withdrawal_request.wallet
            current_time = timezone.now()
            
            if action == 'Approve':
                txn.request_status = 'APPROVED'
                txn.description = f"Withdrawal request {txn.amount} (Approved)"
                txn.reference = reference
                txn.save()
                
                withdrawal_request.processed_at = current_time
                withdrawal_request.save()
                
            elif action == 'Reject':
                wallet.profit_point_balance = F('profit_point_balance') + withdrawal_request.amount
                wallet.save()
                
                txn.request_status = 'REJECTED'
                txn.description = f"Withdrawal request {txn.amount} (Rejected - Refunded)"
                txn.reference = reference
                txn.save()
                
                withdrawal_request.processed_at = current_time
                withdrawal_request.save()
            
            return txn

    @staticmethod
    def convert_to_master_point(user, amount, reference=""):
        """Convert Profit Point to Master Point"""
        amount = Decimal(amount)
        if amount % 10 != 0:
            raise ValidationError("Amount must be a multiple of 10")
        
        with db_transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(user=user)
            if wallet.profit_point_balance < amount:
                raise ValidationError("Insufficient Profit Point balance")
            
            wallet.profit_point_balance = F('profit_point_balance') - amount
            wallet.master_point_balance = F('master_point_balance') + amount
            wallet.save()
            
            Transaction.objects.create(
                user=user,
                wallet=wallet,
                transaction_type='CONVERT',
                point_type='PROFIT',
                target_point_type='MASTER',
                amount=amount,
                converted_amount=amount,
                description=f"Convert Profit Point to Register Point: {amount}",
                reference=reference
            )
            
            return wallet


class CommissionService:
    @staticmethod
    def request_withdrawal(user, amount, reference=""):
        """Request Commission Point withdrawal with 3% fee"""
        amount = Decimal(amount)
        if amount < 50:
            raise ValidationError("Minimum withdrawal amount is 50 USDT")
        
        with db_transaction.atomic():
            user = User.objects.select_for_update().get(id=user.id)
            if user.verification_status != 'REQUIRES_ACTION':
                raise ValidationError("User is not verified.")

            wallet = Wallet.objects.select_for_update().get(user=user)
            commission_point = wallet.affiliate_point_balance + wallet.introducer_point_balance
            if commission_point < amount:
                raise ValidationError("Insufficient Commission Point balance")
            
            fee_rate = Decimal('0.03')
            fee = (amount * fee_rate).quantize(Decimal('0.01'))
            actual_amount = amount - fee
            
            # Deduct from balances
            affiliate_balance = wallet.affiliate_point_balance
            if affiliate_balance >= amount:
                wallet.affiliate_point_balance = F('affiliate_point_balance') - amount
            else:
                wallet.affiliate_point_balance = Decimal('0.00')
                wallet.introducer_point_balance = F('introducer_point_balance') - (amount - affiliate_balance)
            wallet.save()

            withdrawal_request = WithdrawalRequest.objects.create(
                wallet=wallet,
                point_type='COMMISSION',
                amount=amount,
                actual_amount=actual_amount,
                fee=fee,
                fee_rate=fee_rate,
            )
            
            txn = Transaction.objects.create(
                user=user,
                wallet=wallet,
                transaction_type='WITHDRAWAL',
                point_type='COMMISSION',
                amount=amount,
                description=f"Commission Withdrawal request #{withdrawal_request.id} (Pending): {amount}",
                request_status='PENDING',
                reference=reference
            )
            
            withdrawal_request.transaction = txn
            withdrawal_request.save()
        
            return withdrawal_request, wallet
    
    @staticmethod
    def process_withdrawal_request(request_id, action):
        """Approve or reject a withdrawal request"""
        with db_transaction.atomic():
            withdrawal_request = WithdrawalRequest.objects.select_for_update().get(id=request_id)
            txn = withdrawal_request.transaction
            
            if txn.request_status != 'PENDING':
                raise ValidationError("Request already processed")
            
            wallet = withdrawal_request.wallet
            current_time = timezone.now()
            
            if action == 'Approve':
                txn.request_status = 'APPROVED'
                txn.description = f"Withdrawal request {txn.amount} (Approved)"
                txn.save()
                
                withdrawal_request.processed_at = current_time
                withdrawal_request.save()

            elif action == 'Reject':
                # Refund amounts
                refund_amount = withdrawal_request.amount
                original_affiliate_deduct = min(refund_amount, withdrawal_request.amount - (withdrawal_request.amount - wallet.affiliate_point_balance))
                original_bonus_deduct = refund_amount - original_affiliate_deduct
                
                wallet.affiliate_point_balance = F('affiliate_point_balance') + original_affiliate_deduct
                wallet.introducer_point_balance = F('introducer_point_balance') + original_bonus_deduct
                wallet.save()
                
                txn.request_status = 'REJECTED'
                txn.description = f"Withdrawal request #{withdrawal_request.id} (Rejected - Refunded)"
                txn.save()
                
                withdrawal_request.processed_at = current_time
                withdrawal_request.save()

            return withdrawal_request        

    @staticmethod
    def convert_to_master_point(user, amount, reference=""):
        """Convert Commission Point to Master Point with daily limit"""
        amount = Decimal(amount)
        if amount % 10 != 0:
            raise ValidationError("Amount must be a multiple of 10")
        
        with db_transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(user=user)
            commission_point = wallet.affiliate_point_balance + wallet.introducer_point_balance
            if commission_point < amount:
                raise ValidationError("Insufficient Commission Point balance")
            
            # Check daily limit
            today = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            tomorrow = today + timedelta(days=1)
            
            daily_total = Transaction.objects.filter(
                user=user,
                transaction_type='CONVERT',
                point_type='COMMISSION',
                target_point_type='MASTER',
                created_at__range=(today, tomorrow),
            ).aggregate(total=Sum('converted_amount'))['total'] or 0
            
            if daily_total + amount > 50:
                raise ValidationError(f"Daily conversion limit exceeded. You can convert {50 - daily_total} more today.")

            # Deduct from balances
            affiliate_balance = wallet.affiliate_point_balance
            if affiliate_balance >= amount:
                wallet.affiliate_point_balance = F('affiliate_point_balance') - amount
            else:
                wallet.affiliate_point_balance = Decimal('0.00')
                wallet.introducer_point_balance = F('introducer_point_balance') - (amount - affiliate_balance)
                
            wallet.master_point_balance = F('master_point_balance') + amount
            wallet.save()
            
            Transaction.objects.create(
                user=user,
                wallet=wallet,
                transaction_type='CONVERT',
                point_type='COMMISSION',
                target_point_type='MASTER',
                amount=amount,
                converted_amount=amount,
                description=f"Convert Commission Point to Register Point: {amount}",
                reference=reference
            )
            
            return wallet


def get_client_ip(request: HttpRequest) -> str:
    """Get client IP address from request object"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip or '0.0.0.0'