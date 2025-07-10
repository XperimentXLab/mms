
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction as db_transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from .models import *
from django.http import HttpRequest
import logging
from django.db.models import Sum

logger = logging.getLogger(__name__)


def _distribute_affiliate_bonus_for_user(
    downline_user: User,
    daily_rate_percentage: Decimal,
    wallets_needing_affiliate_update_list: list,
    affiliate_transactions_list: list,
    all_wallets_map: dict, # Map of {user_id: wallet_instance}
    all_asset_map: dict, # Map of {user_id: asset_instance}
    metrics: dict,
):
    """
    Calculates and prepares affiliate bonuses for L1 and L2 uplines.
    Modifies wallet objects in-place and appends to transaction list.
    """

    # Level 1 Upline
    if downline_user.referred_by:
        upline_l1_id = downline_user.referred_by
        # upline_l1_user object should ideally be fetched efficiently if needed,
        # but we primarily need their wallet from the map.
        upline_l1_wallet = all_wallets_map.get(upline_l1_id)
        upline_l1_asset = all_asset_map.get(upline_l1_id)
        downline_asset = all_asset_map.get(downline_user.id)

        if upline_l1_wallet and upline_l1_wallet.user.is_active and upline_l1_asset and upline_l1_asset.amount > Decimal('0.00'): # Check if L1 user is active and has place asset
            l1_bonus_percentage = Decimal('0.05')  # 5%
            l1_bonus_amount = (downline_asset.amount * (daily_rate_percentage / Decimal('100.00')) * l1_bonus_percentage).quantize(Decimal('0.01'))

            if l1_bonus_amount > Decimal('0.00'):
                original_affiliate_balance_l1 = upline_l1_wallet.affiliate_point_balance
                upline_l1_wallet.affiliate_point_balance += l1_bonus_amount

                metrics['l1_bonuses_paid'] += 1
                
                # Add wallet to update list (set will handle uniqueness later)
                wallets_needing_affiliate_update_list.append(upline_l1_wallet)

                current_time = timezone.now()
                affiliate_transactions_list.append(
                    Transaction(
                        user=upline_l1_wallet.user,
                        wallet=upline_l1_wallet,
                        transaction_type='AFFILIATE_BONUS', # Using new specific type
                        point_type='COMMISSION',
                        amount=l1_bonus_amount,
                        description=(
                            f"L1 Affiliate bonus (5%) from {downline_user.username}'s profit."
                        ),
                        reference=f"AffL1_{downline_user.id}_{current_time.strftime('%Y%m%d')}"
                    )
                )

                # Level 2 Upline (based on L1's referrer)
                if upline_l1_wallet.user.referred_by:
                    upline_l2_id = upline_l1_wallet.user.referred_by
                    # Avoid L2 being the original downline user or same as L1
                    if upline_l2_id == downline_user.id or upline_l2_id == upline_l1_id:
                        logger.warning(f"Skipping L2 affiliate bonus for {upline_l2_id} due to potential referral loop with {downline_user.id} or {upline_l1_id}.")
                        return # Stop further L2 processing for this branch

                    upline_l2_wallet = all_wallets_map.get(upline_l2_id)
                    upline_l2_asset = all_asset_map.get(upline_l2_id)

                    if upline_l2_wallet and upline_l2_wallet.user.is_active and upline_l1_asset and upline_l2_asset.amount > Decimal('0.00'): # Check if L2 user is active and has place asset
                        l2_bonus_percentage = Decimal('0.02')  # 2%
                        # L2 bonus is also based on the original downline's earned profit
                        l2_bonus_amount = (downline_asset.amount * (daily_rate_percentage / Decimal('100.00')) * l2_bonus_percentage).quantize(Decimal('0.01'))

                        if l2_bonus_amount > Decimal('0.00'):
                            original_affiliate_balance_l2 = upline_l2_wallet.affiliate_point_balance
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
                                    description=(
                                        f"L2 Affiliate bonus (2%) from {downline_user.username}'s profit (via {upline_l1_wallet.user.username})."
                                    ),
                                    reference=f"AffL2_{downline_user.id}_{current_time.strftime('%Y%m%d')}"
                                )
                            )
                    elif upline_l2_wallet and not upline_l2_wallet.user.is_active:
                         logger.info(f"L2 upline {upline_l2_id} for {downline_user.username} (via {upline_l1_wallet.user.username}) is inactive. No L2 affiliate bonus.")
                    elif not upline_l2_wallet:
                         logger.warning(f"Wallet not found for L2 upline {upline_l2_id}. Skipping L2 affiliate bonus for {downline_user.username}.")

        elif upline_l1_wallet and not upline_l1_wallet.user.is_active:
            logger.info(f"L1 upline {upline_l1_id} for {downline_user.username} is inactive. No L1/L2 affiliate bonus.")
        elif not upline_l1_wallet:
            logger.warning(f"Wallet not found for L1 upline {upline_l1_id}. Skipping L1/L2 affiliate bonus for {downline_user.username}.")


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
            raise Exception("OperationalProfit record not found. Cannot distribute profit.")
        
        daily_rate_percentage = Decimal(operational_profit.daily_profit_rate)
        if daily_rate_percentage is None or daily_rate_percentage <= Decimal('0.00'):
            logger.info(f"Profit rate ({daily_rate_percentage}%) is zero or not set. No profit distributed.")
            return {"status": "skipped", "message": "Profit rate is zero or not set."}

        logger.info(f"Starting manual profit distribution with rate: {daily_rate_percentage}%.")

        # Pre-fetch all active user wallets for efficiency
        # We operate on these wallet objects directly.
        eligible_users = User.objects.filter(
            is_active=True,
            wallet__isnull=False,
            assets__amount__gt=0  # Use 'assets' (the related_name)
        ).select_related('wallet').prefetch_related('assets')
        all_wallets_map = {user.id: user.wallet for user in eligible_users if hasattr(user, 'wallet')}
        all_asset_map = {user.id: user.assets.filter(amount__gt=Decimal('0.00')).first() for user in eligible_users}


        wallets_to_update_profit_balance_list = []
        user_profit_transactions_to_create = []
        
        wallets_to_update_affiliate_balance_list = []
        affiliate_bonus_transactions_to_create = []

        processed_wallets_count = 0

        # Iterate over the values of the map (the wallet objects)
        for wallet_instance in all_wallets_map.values():
            downline_user = wallet_instance.user
            asset_obj = Asset.objects.filter(user=downline_user).first()
            if not asset_obj or asset_obj.amount is None:
                continue
            asset_balance = Decimal(asset_obj.amount)
            
            if asset_balance <= Decimal('0.00'):
                metrics['skipped_users'] += 1
                continue

            raw_profit = (asset_balance * (daily_rate_percentage / Decimal('100.00'))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            if raw_profit <= Decimal('0.00'):
                continue

            if asset_balance < Decimal('10000.00'):
                user_share_ratio = Decimal('0.70') #"70/30"
            else:
                user_share_ratio = Decimal('0.80') #"80/20"

            user_profit_amount = (raw_profit * user_share_ratio).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

            # Update Downline User's profit_point_balance
            if user_profit_amount > Decimal('0.00'):
                original_profit_balance = wallet_instance.profit_point_balance
                wallet_instance.profit_point_balance += user_profit_amount
                wallets_to_update_profit_balance_list.append(wallet_instance)

                metrics['users_with_profit'] += 1
                metrics['total_profit_distributed'] += user_profit_amount

                current_time = timezone.now()
                user_profit_transactions_to_create.append(
                    Transaction(
                        user=downline_user,
                        wallet=wallet_instance,
                        transaction_type='DISTRIBUTION',
                        point_type='PROFIT',
                        amount=user_profit_amount,
                        description=(
                            f"Profit distribution ({daily_rate_percentage}% on Asset {asset_balance:.2f}). "
                        ),
                        reference=f"ProfitDist_{current_time.strftime('%Y%m%d')}"
                    )
                )
                
                # ---- DISTRIBUTE AFFILIATE BONUSES ----
                _distribute_affiliate_bonus_for_user(
                    downline_user=downline_user,
                    daily_rate_percentage=daily_rate_percentage,
                    wallets_needing_affiliate_update_list=wallets_to_update_affiliate_balance_list,
                    affiliate_transactions_list=affiliate_bonus_transactions_to_create,
                    all_wallets_map=all_wallets_map,
                    all_asset_map=all_asset_map,
                    metrics=metrics
                )
            
            processed_wallets_count += 1
        
        # Perform database updates atomically
        with db_transaction.atomic():
            current_time = timezone.now()

            # Wallets for profit_point_balance update (these are unique as they came from map values)
            if wallets_to_update_profit_balance_list:
                for w_instance in wallets_to_update_profit_balance_list:
                    w_instance.updated_at = current_time
                Wallet.objects.bulk_update(wallets_to_update_profit_balance_list, ['profit_point_balance', 'updated_at'])
                logger.info(f"Updated profit_point_balance for {len(wallets_to_update_profit_balance_list)} wallets.")

            # Wallets for affiliate_point_balance update (need to ensure uniqueness before bulk update)
            if wallets_to_update_affiliate_balance_list:
                # Use set to get unique wallet objects, then convert back to list
                # This ensures each wallet is updated once with its final accumulated affiliate bonus.
                unique_wallets_for_affiliate_update = {w.pk: w for w in wallets_to_update_affiliate_balance_list}.values()
                for w_instance in unique_wallets_for_affiliate_update:
                    w_instance.updated_at = current_time
                Wallet.objects.bulk_update(unique_wallets_for_affiliate_update, ['affiliate_point_balance', 'updated_at'])
                logger.info(f"Updated affiliate_point_balance for {len(unique_wallets_for_affiliate_update)} wallets.")

            # Create transactions
            if user_profit_transactions_to_create:
                Transaction.objects.bulk_create(user_profit_transactions_to_create)
            if affiliate_bonus_transactions_to_create:
                Transaction.objects.bulk_create(affiliate_bonus_transactions_to_create)
            
            logger.info(f"Created {len(user_profit_transactions_to_create)} profit transactions and {len(affiliate_bonus_transactions_to_create)} affiliate bonus transactions.")
        
        logger.info(f"Manual profit and affiliate distribution completed. Processed {processed_wallets_count} direct profit recipients.")
        return {
            "message": "Profit and affiliate bonuses distributed successfully.",
            'metrics': metrics,
            "profit_wallets_updated": len(wallets_to_update_profit_balance_list),
            "affiliate_wallets_updated": len(set(wallets_to_update_affiliate_balance_list)), # Count unique
            "profit_tx_created": len(user_profit_transactions_to_create),
            "affiliate_tx_created": len(affiliate_bonus_transactions_to_create),
        }

    except OperationalProfit.DoesNotExist:
        logger.error("OperationalProfit record not found.")
        raise Exception("OperationalProfit record not found.")
    except Exception as e:
        logger.error(f"Error during manual profit/affiliate distribution: {e}", exc_info=True)
        raise Exception(f"An error occurred: {e}")

class UserService:
    @staticmethod
    def setup_user(user_id, master_amount, profit_amount, affiliate_amount):
        user = User.objects.get(id=user_id)
        wallet, created = Wallet.objects.get_or_create(user=user)
        
        with db_transaction.atomic():
            wallet.master_point_balance += Decimal(master_amount)
            wallet.profit_point_balance += Decimal(profit_amount)
            wallet.affiliate_point_balance += Decimal(affiliate_amount)
            wallet.save()

            Transaction.objects.create(
                user=user,
                wallet=wallet,
                transaction_type='MIGRATION',
                point_type='PROFIT',
                amount=profit_amount,
                description="Migration of profit",
            )

            Transaction.objects.create(
                user=user,
                wallet=wallet,
                transaction_type='MIGRATION',
                point_type='COMMISSION',
                amount=affiliate_amount,
                description="Migration of affiliate bonus"
            )

            Transaction.objects.create(
                user=user,
                wallet=wallet,
                transaction_type='MIGRATION',
                point_type='MASTER',
                amount=master_amount,
                description="Migration of master point",
            )

        return wallet 


class WalletService:
    @staticmethod
    def transfer_master_point(sender, receiver, amount, description="", reference=""):
        """Transfer Master Point between users"""

        if amount <= 0:
            raise ValidationError("Amount is needed")

        sender_wallet = Wallet.objects.get(user=sender)
        if sender_wallet.master_point_balance < amount:
            raise ValidationError("Insufficient Master Point balance")
        
        with db_transaction.atomic():
            sender_wallet.master_point_balance -= Decimal(amount)
            sender_wallet.save()
            
            receiver_wallet = Wallet.objects.get(user=receiver)
            receiver_wallet.master_point_balance += Decimal(amount)
            receiver_wallet.save()
            
            # Create transactions for both sender and receiver
            Transaction.objects.create(
                user=sender,
                wallet=sender_wallet,
                transaction_type='TRANSFER',
                point_type='MASTER',
                amount=amount,
                description=description, 
                reference=reference
            )
            
            Transaction.objects.create(
                user=receiver,
                wallet=receiver_wallet,
                transaction_type='TRANSFER',
                point_type='MASTER',
                amount=amount,
                description=f"Transfer from {sender.username}: {description}",
                reference=f"TRANSFER-{sender.id}"
            )
        return sender_wallet, receiver_wallet

    @staticmethod 
    def place_asset(user, amount, description="", reference=""):
        """Place asset from Master Point"""

        amount = Decimal(amount)
        if amount <= 50:
            raise ValidationError("Minimum placement amount is 50 USDT")

        if amount % 10 != 0:
            raise ValidationError("Amount must be a multiple of 10")

        wallet = Wallet.objects.get(user=user)
        if wallet.master_point_balance < amount:
            raise ValidationError("Insufficient Master Point balance")
        
        with db_transaction.atomic():

            user_ = User.objects.select_for_update().get(id=user.id)
            if user_.verification_status != 'APPROVED':
                raise ValidationError("User is not verified.")

            amount = Decimal(amount)
            wallet.master_point_balance -= amount
            wallet.save()
            
            asset = Asset.objects.get(user=user)

            current_time = timezone.now()
            deposit_trx = Transaction.objects.create(
                user=user,
                wallet=wallet,
                asset=asset,
                transaction_type='ASSET_PLACEMENT',
                point_type='MASTER',
                amount=amount,
                created_at=current_time,
                description=description,
                request_status='PENDING',
                reference=reference
            )

            DepositLock.objects.create(
                deposit=deposit_trx,
                amount_6m_locked=amount / Decimal('2'),  # 50 (for 6m)
                amount_1y_locked=amount / Decimal('2'),  # 50 (for 1y)
                )
        
        current_time = timezone.now()
                    
        return wallet, asset

    @staticmethod
    def process_place_asset(transaction_id, action):
        """Approves or rejects a PENDING withdrawal."""
        with db_transaction.atomic():
            trx = Transaction.objects.select_for_update().get(
                id=transaction_id,
            )
            
            wallet = trx.wallet
            asset = trx.asset
            user = trx.user
            amount = trx.amount if trx.amount is not None else Decimal('0.00')


            if action == 'Approve':
                asset.amount += Decimal(amount)
                asset.save()
                trx.request_status = 'APPROVED'
                trx.save()

                ## Introducer Bonus ##
                if user.referred_by:
                    try:
                        introducer = User.objects.get(id=user.referred_by)
                        introducer_wallet = Wallet.objects.get(user=introducer)
                        introducer_asset = Asset.objects.get(user=introducer)
                        asset_amount = introducer_asset.amount
                        # Determine bonus rate

                        if asset_amount == 0:
                            bonus_rate = Decimal('0.00')
                        elif asset_amount < 1000:
                            bonus_rate = Decimal('0.02')
                        elif 1000 <= asset_amount < 10000:
                            bonus_rate = Decimal('0.025')
                        elif asset_amount >= 10000:
                            bonus_rate = Decimal('0.03')
                        bonus_amount = (bonus_rate * Decimal(amount)).quantize(Decimal('0.01'))
                        introducer_wallet.introducer_point_balance += bonus_amount
                        introducer_wallet.save()
                        Transaction.objects.create(
                            user=introducer,
                            wallet=introducer_wallet,
                            transaction_type='INTRODUCER_BONUS',
                            point_type='COMMISSION',
                            amount=bonus_amount,
                            description=f"Introducer bonus from {user.username} asset placement ({amount})",
                            reference=f"INTRODUCER_BONUS from {user.id}"
                        )
                    except User.DoesNotExist:
                        pass # Referrer not found, skip bonus

            elif action == 'Reject':
                wallet.master_point_balance += Decimal(amount)
                wallet.save()
                trx.request_status = 'REJECTED'
                trx.save()
            return trx
        

class AssetService:
    @classmethod
    def grant_free_campro(cls, user_id):
        """Grants 100 free CAMPRO to a user (locked for 1 year)."""

        user = User.objects.get(id=user_id)
        if user.is_campro:  # Prevent duplicate grants
            raise ValidationError("User already received welcome bonus.")
        
        with db_transaction.atomic():
            # 1. Add 100 to user's Asset
            asset, created = Asset.objects.get_or_create(user=user)
            asset.amount += Decimal('100.00')
            asset.is_free_campro = True  # Mark as received
            asset.save()

            # 2. Create a Transaction record (for audit)
            trx = Transaction.objects.create(
                user=user,
                asset=asset,
                transaction_type='WELCOME_BONUS',
                point_type='ASSET',
                amount=Decimal('100.00'),
                description="Welcome Bonus", #locked for 1 year
                reference=""
            )

            # 3. Create a DepositLock with 1-year restriction
            DepositLock.objects.create(
                deposit=trx,
                is_free_campro=True,  # <-- Mark as free CAMPRO (special lock)
                amount_6m_locked=Decimal('0.00'),  # Initially locked
                amount_1y_locked=Decimal('100.00'),   # Initially locked
                amount_6m_unlocked=Decimal('0.00'),  # No 6-month withdrawal
                amount_1y_unlocked=Decimal('0.00')   # Initially locked
            )

            # 4. Update user's flag
            user.is_campro = True
            user.save()

            return trx

    @staticmethod
    def withdraw_asset(user, amount, description="", reference=""):
        """Withdraw asset to Profit"""
        
        if amount < 50:
            raise ValidationError("Minimum withdrawal amount is 50 USDT")

        if amount % 10 != 0:
            raise ValidationError("Amount must be a multiple of 10")

        asset = Asset.objects.get(user=user)
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
    def process_withdrawal_request(transaction_id, action, reference=""):
        """Approves or rejects a PENDING withdrawal."""

        if reference is None:
            raise ValidationError('Reference is required.')

        with db_transaction.atomic():
            trx = Transaction.objects.select_for_update().get(
                id=transaction_id,
            )
            
            if action == 'Approve':
                # Deduct from locks and balance
                locks = DepositLock.objects.filter(
                    deposit__user=trx.user
                ).order_by('deposit__created_at')

                remaining_to_deduct = trx.amount
                for lock in locks:
                    if remaining_to_deduct <= 0:
                        break

                    available = lock.withdrawable_now
                    deduct_amount = min(available, remaining_to_deduct)
                    
                    if deduct_amount > 0:
                        age = timezone.now() - lock.deposit.created_at
                        if age >= timedelta(days=365):
                            lock.amount_1y_unlocked += deduct_amount
                        elif age >= timedelta(days=180):
                            lock.amount_6m_unlocked += deduct_amount
                        lock.save()
                        remaining_to_deduct -= deduct_amount

                if remaining_to_deduct > 0:
                    raise ValidationError("Insufficient unlocked funds (race condition)")

                # Update asset balance
                asset = trx.asset
                asset.amount -= trx.amount
                asset.save()

                wallet = Wallet.objects.get(user=trx.user)
                wallet.profit_point_balance += Decimal(trx.amount)
                wallet.save()

                # Mark as approved
                trx.reference = reference
                trx.request_status = 'APPROVED'
                trx.save()

            elif action == 'Reject':
                trx.reference = reference
                trx.request_status = 'REJECTED'
                trx.save()

            return trx
            

class ProfitService:

    @staticmethod
    def request_withdrawal(user, amount):
        """Request Profit Point withdrawal (min 50 USDT, 3% fee)"""

        user_ = User.objects.get(id=user.id)
        user_wallet_address = user_.wallet_address
        if user_wallet_address is None:
            raise ValidationError("Please set your wallet address in the profile page.")

        if amount < 50:
            raise ValidationError("Minimum withdrawal amount is 50 USDT")

        if amount % 10 != 0:
            raise ValidationError("Amount must be a multiple of 10")
        
        wallet = Wallet.objects.get(user=user)
        if wallet.profit_point_balance < amount:
            raise ValidationError("Insufficient Profit Point balance")
        
        fee_rate = Decimal('0.03') #Fee Rate 3%
        fee = amount * fee_rate
        wallet.profit_point_balance -= amount
        wallet.save()
        actual_amount = amount - fee
        
        with db_transaction.atomic():
            # Create withdrawal request
            withdrawal_request = WithdrawalRequest.objects.create(
                wallet=wallet,
                point_type='PROFIT',
                amount=amount,
                actual_amount=actual_amount,
                fee=fee,
                fee_rate=fee_rate,
            )
            
            # Create pending transaction
            txn = Transaction.objects.create(
                user=user,
                wallet=wallet,
                transaction_type='WITHDRAWAL',
                point_type='PROFIT',
                amount=amount,
                description=f"Profit withdrawal to be received: {actual_amount}",
                request_status='PENDING',
            )
            
            withdrawal_request.transaction = txn
            withdrawal_request.save()
        
        return withdrawal_request, wallet

    @staticmethod
    def process_withdrawal_request(request_id, action, reference=""):
        """Approve or reject a withdrawal request"""

        if reference is None:
            raise ValidationError('Reference is required.')
        
        with db_transaction.atomic():

            withdrawal_request = WithdrawalRequest.objects.select_for_update().get(id=request_id)
            txn = withdrawal_request.transaction
            if txn.request_status != 'PENDING':
                raise ValidationError("This request has already been processed")
            
            wallet = withdrawal_request.wallet

            if action == 'Approve':
                # Update request status
                txn.reference = reference
                txn.request_status = 'APPROVED'
                withdrawal_request.processed_at = timezone.now()
                withdrawal_request.save()

                fee_rate = Decimal('0.03') #Fee Rate 3%
                fee = txn.amount * fee_rate
                actual_amount = txn.amount - fee
                
                # Update transaction description
                txn.description = f"Profit withdrawal to be received: {actual_amount}"
                txn.save()
                
            elif action == 'Reject':
                # Refund the amount back to wallet
                wallet.profit_point_balance += withdrawal_request.amount
                wallet.save()
                
                # Update request status
                txn.reference = reference
                txn.request_status = 'REJECTED'
                withdrawal_request.processed_at = timezone.now()
                withdrawal_request.save()
                
                # Update transaction description
                txn.description = f"Withdrawal request {txn.amount} has been refunded"
                txn.save()
        
        return txn

    @staticmethod
    def convert_to_master_point(user, amount, reference=""):
        """Convert Profit Point to Master Point (must be multiple of 10)"""

        if amount % 10 != 0:
            raise ValidationError("Amount must be a multiple of 10")
        
        wallet = Wallet.objects.get(user=user)
        if wallet.profit_point_balance < amount:
            raise ValidationError("Insufficient Profit Point balance")
        
        with db_transaction.atomic():
            wallet.profit_point_balance -= Decimal(amount)
            wallet.master_point_balance += Decimal(amount)
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
    def request_withdrawal(user, amount):
        """Request Commission Point withdrawal (min 50 USDT, 3% fee)"""

        if amount < 50:
            raise ValidationError("Minimum withdrawal amount is 50 USDT")
        
        wallet = Wallet.objects.get(user=user)
        commission_point = wallet.affiliate_point_balance + wallet.introducer_point_balance
        if commission_point < amount:
            raise ValidationError("Insufficient Commission Point balance")
        
        fee_rate = Decimal('0.03') #Fee Rate 3% 
        fee = amount * fee_rate
        actual_amount = amount - fee
        
        with db_transaction.atomic():
            # Create withdrawal request
            withdrawal_request = WithdrawalRequest.objects.create(
                wallet=wallet,
                point_type='COMMISSION',
                amount=amount,
                actual_amount=actual_amount,
                fee=fee,
                fee_rate=fee_rate,
            )
            
            # Reserve the amount by deducting from balance
            affiliate_balance = wallet.affiliate_point_balance
            balance_deduct = amount - affiliate_balance
            if affiliate_balance >= amount:
                wallet.affiliate_point_balance -= Decimal(amount)
            else:
                wallet.affiliate_point_balance = Decimal('0.00')
                wallet.introducer_point_balance -= Decimal(balance_deduct)
            wallet.save()
            
            # Create pending transaction
            txn = Transaction.objects.create(
                user=user,
                wallet=wallet,
                transaction_type='WITHDRAWAL',
                point_type='COMMISSION',
                amount=amount,
                description=f"Withdrawal request (Pending): {amount}",
                request_status='PENDING',
            )
            
            withdrawal_request.transaction = txn
            withdrawal_request.save()
        
        return withdrawal_request, wallet
    
    @staticmethod
    def process_withdrawal_request(request_id, action, reference=""):
        """Approve or reject a withdrawal request"""

        if reference is None:
            raise ValidationError('Reference is required.')

        with db_transaction.atomic():

            withdrawal_request = WithdrawalRequest.objects.select_for_update().get(id=request_id)
            txn = withdrawal_request.transaction
            if txn.request_status != 'PENDING':
                raise ValidationError("This request has already been processed")
            
            wallet = withdrawal_request.wallet

            if action == 'Approve':
                # Update request status
                
                txn.request_status = 'APPROVED'
                withdrawal_request.processed_at = timezone.now()
                withdrawal_request.save()
                
                # Update transaction description
                txn.reference = reference
                txn = withdrawal_request.transaction
                txn.description = f"Withdrawal request {txn.amount} (Approved)"
                txn.save()

            elif action == 'Reject':
                # Refund the amount back to wallet
                refund_amount = withdrawal_request.amount
                affiliate_balance = wallet.affiliate_point_balance
                ori_affiliate_deduct = min(refund_amount, affiliate_balance)
                ori_bounus_deduct = refund_amount - ori_affiliate_deduct

                wallet.affiliate_point_balance += ori_affiliate_deduct
                wallet.introducer_point_balance += ori_bounus_deduct
                wallet.save()
                
                # Update request status
                txn.request_status = 'REJECTED'
                withdrawal_request.processed_at = timezone.now()
                withdrawal_request.save()
                
                # Update transaction description
                txn.reference = reference
                txn = withdrawal_request.transaction
                txn.description = f"Withdrawal request #{withdrawal_request.id} (Rejected - Refunded)"
                txn.save()

        return txn       


    @staticmethod
    def convert_to_master_point(user, amount, reference=""):
        """Convert Commission Point to Master Point (must be multiple of 10)"""
        wallet = Wallet.objects.get(user=user)
        commission_point = wallet.affiliate_point_balance + wallet.introducer_point_balance

        if amount % 10 != 0:
            raise ValidationError("Amount must be a multiple of 10")
        
        if commission_point < amount:
            raise ValidationError("Insufficient Commission Point balance")
        
        # Daily limit check
        start_of_day = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)

        daily_total = Transaction.objects.filter(
            user=user,
            transaction_type='CONVERT',
            point_type='COMMISSION',
            target_point_type='MASTER',
            created_at__gte=start_of_day,
            created_at__lt=end_of_day
        ).aggregate(total=Sum('converted_amount'))['total'] or 0

        if daily_total + amount > 50:
            raise ValidationError(f"Daily conversion limit exceeded. You can convert {50 - daily_total} more today.")

        with db_transaction.atomic():
            affiliate_point = wallet.affiliate_point_balance
            convert_balance = amount - affiliate_point
            if affiliate_point >= amount:
                wallet.affiliate_point_balance -= Decimal(amount)
            else:
                wallet.affiliate_point_balance = Decimal('0.00')
                if wallet.introducer_point_balance < convert_balance:
                    raise ValidationError("Insufficient Commission Point balance(bonus insufficient)")
                wallet.introducer_point_balance -= convert_balance
                
            wallet.master_point_balance += Decimal(amount)
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