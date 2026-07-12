
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction as db_transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from .models import *
from django.http import HttpRequest
import logging
from django.db.models import Sum
from datetime import timedelta

logger = logging.getLogger(__name__)


def _distribute_affiliate_bonus_for_user(
    downline_user: User,
    daily_rate_percentage: Decimal,
    wallets_needing_affiliate_update_list: list,
    affiliate_transactions_list: list,
    all_wallets_map: dict, # Map of {user_id: wallet_instance}
    all_asset_map: dict, # Map of {user_id: asset_instance}
    all_user_bfr1yr_deposit_lock_map: dict, # Map of {user_id: deposit_lock}
    all_user_aftr1yr_deposit_lock_map: dict, # Map of {user_id: deposit_lock}
    metrics: dict,
):
    """
    Calculates and prepares affiliate bonuses for L1 and L2 uplines.
    Modifies wallet objects in-place and appends to transaction list.
    Affiliate bonus available for 1 year only for downline deposit lock.
    """

    except_ids = ['MMS01FXC', 'MMS00QVS']  # Admin/Superuser IDs will not receive affiliate bonuses
    special_ids =['MMS02O5G', 'MMS03PF6', 'MMS02GKX', 'MMS03PVL', 'MMS0216J', 'MMS03PBV', 'MMS04F8Y' ] # IDs that continue to receive affiliate bonuses even if already more than 1 year deposit lock [ MMS02O5G MMSzainudin, MMS03PF6 MMSazilah, MMS02GKX MMSamid, MMS03PVL MMSazlina, MMS0216J ⁠MMSzaemy, MMS03PBV ⁠MMSamima, MMS04F8Y MMShafizh ]


    # Level 1 Upline
    if downline_user.referred_by:
        upline_l1_id = downline_user.referred_by
        # upline_l1_user object should ideally be fetched efficiently if needed,
        # but we primarily need their wallet from the map.
        upline_l1_wallet = all_wallets_map.get(upline_l1_id)
        upline_l1_asset = all_asset_map.get(upline_l1_id)
        downline_deposit_lock_bfr1yr = all_user_bfr1yr_deposit_lock_map.get(downline_user.id) or DepositLock.objects.none()
        downline_deposit_lock_aftr1yr = all_user_aftr1yr_deposit_lock_map.get(downline_user.id) or DepositLock.objects.none()

        total_downline_deposit_lock_amount = Decimal('0.00')
        total_downline_deposit_lock_amount_special = Decimal('0.00')
        all_total_downline_deposit_lock_amount = Decimal('0.00')
        if upline_l1_wallet and upline_l1_wallet.user.is_active and upline_l1_asset and upline_l1_asset.amount > Decimal('0.00') and upline_l1_id not in except_ids: # Check if L1 user is active and has place asset and not in except_ids
            l1_bonus_percentage = Decimal('0.05')  # 5%

            # Calculate total downline deposit lock amount before 1 year for L1 bonus eligibility
            if downline_deposit_lock_bfr1yr.exists():
                amount_6mlocked = downline_deposit_lock_bfr1yr.aggregate(total=Sum('amount_6m_locked'))['total'] or Decimal('0.00')
                amount_6munlocked = downline_deposit_lock_bfr1yr.aggregate(total=Sum('amount_6m_unlocked'))['total'] or Decimal('0.00')
                amount_1ylocked = downline_deposit_lock_bfr1yr.aggregate(total=Sum('amount_1y_locked'))['total'] or Decimal('0.00')
                amount_1yunlocked = downline_deposit_lock_bfr1yr.aggregate(total=Sum('amount_1y_unlocked'))['total'] or Decimal('0.00')
                amount_freeze = downline_deposit_lock_bfr1yr.aggregate(total=Sum('freeze_amount'))['total'] or Decimal('0.00')
                total_downline_deposit_lock_amount = ((amount_6mlocked + amount_1ylocked + amount_freeze) -  (amount_6munlocked + amount_1yunlocked)).quantize(Decimal('0.01'))

            if downline_deposit_lock_aftr1yr.exists() and upline_l1_id in special_ids:
                amount_6mlocked = downline_deposit_lock_aftr1yr.aggregate(total=Sum('amount_6m_locked'))['total'] or Decimal('0.00')
                amount_6munlocked = downline_deposit_lock_aftr1yr.aggregate(total=Sum('amount_6m_unlocked'))['total'] or Decimal('0.00')
                amount_1ylocked = downline_deposit_lock_aftr1yr.aggregate(total=Sum('amount_1y_locked'))['total'] or Decimal('0.00')
                amount_1yunlocked = downline_deposit_lock_aftr1yr.aggregate(total=Sum('amount_1y_unlocked'))['total'] or Decimal('0.00')
                amount_freeze = downline_deposit_lock_aftr1yr.aggregate(total=Sum('freeze_amount'))['total'] or Decimal('0.00')
                total_downline_deposit_lock_amount_special = ((amount_6mlocked + amount_1ylocked + amount_freeze) -  (amount_6munlocked + amount_1yunlocked)).quantize(Decimal('0.01'))

            all_total_downline_deposit_lock_amount = total_downline_deposit_lock_amount + total_downline_deposit_lock_amount_special
            l1_bonus_amount = (all_total_downline_deposit_lock_amount * (daily_rate_percentage / Decimal('100.00')) * l1_bonus_percentage).quantize(Decimal('0.01'))

            if l1_bonus_amount > Decimal('0.00'):
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
                    downline_deposit_lock_bfr1yr_2 = all_user_bfr1yr_deposit_lock_map.get(downline_user.id) or DepositLock.objects.none()
                    downline_deposit_lock_aftr1yr_2 = all_user_aftr1yr_deposit_lock_map.get(downline_user.id) or DepositLock.objects.none()

                    total_downline_deposit_lock_amount_2 = Decimal('0.00')
                    total_downline_deposit_lock_amount_2_special = Decimal('0.00')
                    all_total_downline_deposit_lock_amount_2 = Decimal('0.00')
                    if upline_l2_wallet and upline_l2_wallet.user.is_active and upline_l1_asset and upline_l2_asset.amount > Decimal('0.00') and upline_l2_id not in except_ids: # Check if L2 user is active and has place asset and not in except_ids

                        # Calculate total downline deposit lock amount before 1 year for L2 bonus eligibility
                        if downline_deposit_lock_bfr1yr_2.exists():
                            amount_6mlocked = downline_deposit_lock_bfr1yr_2.aggregate(total=Sum('amount_6m_locked'))['total'] or Decimal('0.00')
                            amount_6munlocked = downline_deposit_lock_bfr1yr_2.aggregate(total=Sum('amount_6m_unlocked'))['total'] or Decimal('0.00')
                            amount_1ylocked = downline_deposit_lock_bfr1yr_2.aggregate(total=Sum('amount_1y_locked'))['total'] or Decimal('0.00')
                            amount_1yunlocked = downline_deposit_lock_bfr1yr_2.aggregate(total=Sum('amount_1y_unlocked'))['total'] or Decimal('0.00')
                            amount_freeze = downline_deposit_lock_bfr1yr_2.aggregate(total=Sum('freeze_amount'))['total'] or Decimal('0.00')
                            total_downline_deposit_lock_amount_2 = ((amount_6mlocked + amount_1ylocked + amount_freeze) -  (amount_6munlocked + amount_1yunlocked)).quantize(Decimal('0.01'))

                        # Calculate total downline deposit lock amount after 1 year for special bonus eligibility
                        if downline_deposit_lock_aftr1yr_2.exists() and upline_l2_id in special_ids:
                            amount_6mlocked = downline_deposit_lock_aftr1yr_2.aggregate(total=Sum('amount_6m_locked'))['total'] or Decimal('0.00')
                            amount_6munlocked = downline_deposit_lock_aftr1yr_2.aggregate(total=Sum('amount_6m_unlocked'))['total'] or Decimal('0.00')
                            amount_1ylocked = downline_deposit_lock_aftr1yr_2.aggregate(total=Sum('amount_1y_locked'))['total'] or Decimal('0.00')
                            amount_1yunlocked = downline_deposit_lock_aftr1yr_2.aggregate(total=Sum('amount_1y_unlocked'))['total'] or Decimal('0.00')
                            amount_freeze = downline_deposit_lock_aftr1yr_2.aggregate(total=Sum('freeze_amount'))['total'] or Decimal('0.00')
                            total_downline_deposit_lock_amount_2_special = ((amount_6mlocked + amount_1ylocked + amount_freeze) - (amount_6munlocked + amount_1yunlocked)).quantize(Decimal('0.01'))

                        l2_bonus_percentage = Decimal('0.02')  # 2%
                        # L2 bonus is also based on the original downline's earned profit
                        all_total_downline_deposit_lock_amount_2 = total_downline_deposit_lock_amount_2 + total_downline_deposit_lock_amount_2_special
                        l2_bonus_amount = (all_total_downline_deposit_lock_amount_2 * (daily_rate_percentage / Decimal('100.00')) * l2_bonus_percentage).quantize(Decimal('0.01'))

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


def sharing_profit(daily_profit_rate):

    super_user = User.objects.get(is_superuser=True)
    super_user_wallet = Wallet.objects.get(user=super_user)

    admin_asset = Asset.objects.filter(user_id__in=['MMS00QVS', 'MMS01FXC', 'MMS0216J',  'MMS02O5G', 'MMS02GKX']).aggregate(total=models.Sum('amount'))['total'] or 0
    print(f'admin as: {admin_asset}')
    all_asset_above_10k = Asset.objects.filter(amount__gte=10000).aggregate(total=models.Sum('amount'))['total'] or 0

    asset_above_10k = Decimal(all_asset_above_10k) - Decimal(admin_asset)
    asset_below_10k = Asset.objects.filter(amount__lt=10000).aggregate(total=models.Sum('amount'))['total'] or 0

    mms03_asset = Asset.objects.filter(user_id__in=['MMS03PF6', 'MMS03PBV', 'MMS03PVL', 'MMS03B7L', 'MMS03O3N']).aggregate(total=models.Sum('amount'))['total'] or 0

    with db_transaction.atomic():
        logger.info(f'Sharing Profit {daily_profit_rate}%')
        sharing_mms03 = mms03_asset * Decimal(daily_profit_rate) * Decimal('0.0002') # 0.02%
        sharing_above_10k = asset_above_10k * Decimal(daily_profit_rate) * Decimal('0.0018') # 0.18%
        sharing_below_10k = asset_below_10k * Decimal(daily_profit_rate) * Decimal('0.0028') # 0.28%

        total_sharing = sharing_above_10k + sharing_below_10k + sharing_mms03
        super_user_wallet.profit_point_balance += total_sharing
        super_user_wallet.save()

        current_time = timezone.now()

        Transaction.objects.create(
            user=super_user,
            wallet=super_user_wallet,
            transaction_type='SHARING_PROFIT',
            point_type='PROFIT',
            amount=total_sharing,
            description=f'Sharing Profit {total_sharing:.2f} on {current_time.strftime("%Y-%m-%d")}',
            reference=f'SHARING_PROFIT_{total_sharing:.2f}_{current_time.strftime("%Y%m%d")}'
        )

        logger.info(f'Sharing profit completed {total_sharing:.2f}')


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
        today = timezone.localdate()
        day = today.day
        month = today.month
        year = today.year
        
        operational_profit = OperationalProfit.objects.get(active_day_profit=day, active_month_profit=month, active_year_profit=year)
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
            asset__amount__gt=0  # Use 'asset' (the related_name)
        ).select_related('wallet').prefetch_related('asset')
        all_wallets_map = {user.id: user.wallet for user in eligible_users if hasattr(user, 'wallet')}
        all_asset_map = {user.id: user.asset for user in eligible_users if hasattr(user, 'asset')}

        today = timezone.localdate()
        one_year_ago = today - timedelta(days=365)

        # All user DEPOSIT LOCK before 1 year ---------------------------------------------------------
        all_user_bfr1yr_deposit_lock_map = {
            user.id: DepositLock.objects.filter(
                deposit__user=user,
                deposit__created_at__gte=one_year_ago,
            )
            for user in eligible_users
        }

        # All user DEPOSIT LOCK after 1 year ---------------------------------------------------------
        all_user_aftr1yr_deposit_lock_map = {
            user.id: DepositLock.objects.filter(
                deposit__user=user,
                deposit__created_at__lt=one_year_ago,
            )
            for user in eligible_users
        }


        wallets_to_update_profit_balance_list = []
        user_profit_transactions_to_create = []
        
        wallets_to_update_affiliate_balance_list = []
        affiliate_bonus_transactions_to_create = []

        processed_wallets_count = 0

        # Iterate over the values of the map (the wallet objects)
        for wallet_instance in all_wallets_map.values():
            user_wallet = wallet_instance.user
            asset_obj = Asset.objects.filter(user=user_wallet).first()
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
                user_share_ratio = Decimal('0.65') #"65/35"
            else:
                user_share_ratio = Decimal('0.75') #"75/25"

            user_profit_amount = (raw_profit * user_share_ratio).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

            # Update User's profit_point_balance
            if user_profit_amount > Decimal('0.00'):
                wallet_instance.profit_point_balance += user_profit_amount
                wallets_to_update_profit_balance_list.append(wallet_instance)

                metrics['users_with_profit'] += 1
                metrics['total_profit_distributed'] += user_profit_amount

                current_time = timezone.now()
                user_profit_transactions_to_create.append(
                    Transaction(
                        user=user_wallet,
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
                    downline_user=user_wallet,
                    daily_rate_percentage=daily_rate_percentage,
                    wallets_needing_affiliate_update_list=wallets_to_update_affiliate_balance_list,
                    affiliate_transactions_list=affiliate_bonus_transactions_to_create,
                    all_wallets_map=all_wallets_map,
                    all_asset_map=all_asset_map,
                    all_user_bfr1yr_deposit_lock_map=all_user_bfr1yr_deposit_lock_map,
                    all_user_aftr1yr_deposit_lock_map=all_user_aftr1yr_deposit_lock_map,
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

            sharing_profit(daily_rate_percentage)
        
        print(f"Manual profit and affiliate distribution completed. Processed {processed_wallets_count} direct profit recipients.")
        print(f"Metrics: {metrics}")
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
    

# --------------------- REVOKE PROFIT DISTRIBUTION ---------------------------------------

def revoke_profit_distribution(target_date=None):
    """
    Reverses ALL profit and affiliate bonus distributions for a given date.
    Does NOT delete original transactions — creates offsetting negative
    transactions instead, so the ledger stays fully auditable.

    Safe to call only if funds haven't been withdrawn/converted yet.
    """
    if target_date is None:
        target_date = timezone.localdate()

    metrics = {
        'profit_reversed_count': 0,
        'affiliate_reversed_count': 0,
        'sharing_profit_reversed_count': 0,
        'total_amount_reversed': Decimal('0.00'),
        'skipped_already_reversed': 0,
        'skipped_negative_balance_risk': [],
    }

    with db_transaction.atomic():
        # Pull every distribution-related transaction created that day
        original_txns = Transaction.objects.filter(
            transaction_type__in=['DISTRIBUTION', 'AFFILIATE_BONUS', 'SHARING_PROFIT'],
            created_at__date=target_date,
        ).select_related('wallet', 'user')

        if not original_txns.exists():
            return {"status": "skipped", "message": f"No distributions found for {target_date}."}

        # Idempotency guard: find reversals already created for this date's txns
        already_reversed_refs = set(
            Transaction.objects.filter(
                reference__startswith='REVOKE_',
                created_at__date__gte=target_date,  # reversal could run later than target_date
            ).values_list('reference', flat=True)
        )

        wallets_to_update = {}  # {wallet_id: wallet_instance}
        reversal_txns_to_create = []
        current_time = timezone.now()

        for txn in original_txns:
            revoke_ref = f"REVOKE_{txn.id}"
            if revoke_ref in already_reversed_refs:
                metrics['skipped_already_reversed'] += 1
                continue

            wallet = txn.wallet
            if not wallet:
                continue

            # Determine which balance field this transaction touched
            if txn.point_type == 'PROFIT':
                balance_field = 'profit_point_balance'
            elif txn.point_type == 'COMMISSION':
                balance_field = 'affiliate_point_balance'
            else:
                continue  # not a distribution-affecting point type, skip

            current_balance = getattr(wallet, balance_field)
            if current_balance - txn.amount < Decimal('0.00'):
                # Balance already moved (e.g. converted) — don't blindly go negative
                metrics['skipped_negative_balance_risk'].append(txn.id)
                continue

            # Use a cached wallet instance so repeated reversals for the
            # same wallet accumulate correctly before bulk_update
            wallet_key = wallet.pk
            if wallet_key not in wallets_to_update:
                wallets_to_update[wallet_key] = wallet
            cached_wallet = wallets_to_update[wallet_key]
            setattr(cached_wallet, balance_field, getattr(cached_wallet, balance_field) - txn.amount)

            reversal_txns_to_create.append(
                Transaction(
                    user=txn.user,
                    wallet=wallet,
                    transaction_type=txn.transaction_type,
                    point_type=txn.point_type,
                    amount=-txn.amount,  # negative = reversal
                    description=f"REVOKED: {txn.description} (original txn id={txn.id})",
                    reference=revoke_ref,
                )
            )

            metrics['total_amount_reversed'] += txn.amount
            if txn.transaction_type == 'DISTRIBUTION':
                metrics['profit_reversed_count'] += 1
            elif txn.transaction_type == 'AFFILIATE_BONUS':
                metrics['affiliate_reversed_count'] += 1
            elif txn.transaction_type == 'SHARING_PROFIT':
                metrics['sharing_profit_reversed_count'] += 1

        # Apply wallet balance updates
        if wallets_to_update:
            for w in wallets_to_update.values():
                w.updated_at = current_time
            Wallet.objects.bulk_update(
                list(wallets_to_update.values()),
                ['profit_point_balance', 'affiliate_point_balance', 'updated_at']
            )

        if reversal_txns_to_create:
            Transaction.objects.bulk_create(reversal_txns_to_create)

        logger.info(
            f"Revoked distributions for {target_date}: "
            f"{len(reversal_txns_to_create)} reversal transactions, "
            f"{len(wallets_to_update)} wallets updated."
        )

    return {
        "message": f"Reversed distributions for {target_date}.",
        "metrics": metrics,
    }


def remove_welcome_bonus_100():
    """
    Remove welcome_bonus 100 from profit_point_balance and asset for users who:
    - have a free-campro asset
    - never made an asset placement (no deposit at all)
    - received the welcome bonus 1+ year ago
    Neutralizes the associated free-campro DepositLock (kept, not deleted, for
    withdrawal-verification / audit trail integrity).
    This is a one-time operation for a specific business case.
    """
    one_year_ago = timezone.now() - timedelta(days=365)

    welcome_bonus_users_1y_old = Transaction.objects.filter( # Transaction record who received welcome bonus 1 year ago
        transaction_type='WELCOME_BONUS',
        created_at__lte=one_year_ago,
    ).values_list('user_id', flat=True)

    expired_100_users = Asset.objects.filter( # Users who have free-campro asset and received welcome bonus 1 year ago but never made an asset placement
        is_free_campro=True,
        user_id__in=welcome_bonus_users_1y_old
    ).exclude(
        user_id__in=Transaction.objects.filter(
            transaction_type='ASSET_PLACEMENT', point_type='MASTER'
        ).values_list('user_id', flat=True)
    ).values_list('user_id', flat=True).distinct()

    deposit_locks = DepositLock.objects.filter( # DepositLock records for those users, to neutralize the free-campro lock
        is_free_campro=True,
        deposit_id__in=Transaction.objects.filter(
            transaction_type='WELCOME_BONUS', user_id__in=expired_100_users
        ).values_list('id', flat=True)
    )

    with db_transaction.atomic():
        assets = Asset.objects.filter(user_id__in=expired_100_users, is_free_campro=True)
        wallets = Wallet.objects.filter(user_id__in=expired_100_users)

        if not assets.exists() and not deposit_locks.exists():
            return {"message": "No eligible users found for WELCOME BONUS 100 removal."}

        for wallet in wallets:
            before_balance = wallet.profit_point_balance
            if before_balance > Decimal('0.00'):
                wallet.profit_point_balance = Decimal('0.00')
                #wallet.save()

                #Transaction.objects.create(
                #    user=wallet.user,
                #    wallet=wallet,
                #    transaction_type='EXPIRATION',
                #    point_type='PROFIT',
                #    amount=-before_balance,
                #    description="Expiration: WELCOME BONUS 100 USDT profit removed",
                #    reference=f"EXPIRATION_WELCOME_BONUS_{wallet.user_id}_{timezone.now().strftime('%Y%m%d%H%M%S')}"
                #)

        for deposit_lock in deposit_locks:
            deposit_lock.amount_1y_locked = Decimal('0.00')
            #deposit_lock.save()

        for asset in assets:
            if asset.amount >= Decimal('100.00'):
                asset.amount -= Decimal('100.00')
                #asset.save()

                #Transaction.objects.create(
                #    user=asset.user,
                #    asset=asset,
                #    transaction_type='EXPIRATION',
                #    point_type='ASSET',
                #    amount=-Decimal('100.00'),
                #    description="Expiration: WELCOME BONUS 100 USDT #removed",
                #    reference=f"EXPIRATION_WELCOME_BONUS_{asset.#user_id}_{timezone.now().strftime('%Y%m%d%H%M%S')}#"
                #)

    return {"message": f"THIS IS A TEST -- Expired WELCOME BONUS 100 USDT removed from eligible users. {assets.count()} ASSETS updated, {wallets.count()} WALLETS updated, {deposit_locks.count()} DEPOSIT LOCKS neutralized."}


# ----------------------------------------------------------------------------------------

class UserService:
    @staticmethod
    def setup_user(user_id, master_amount, profit_amount, affiliate_amount):
        user = User.objects.get(id=user_id)
        wallet, _ = Wallet.objects.get_or_create(user=user)
        
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
    

def are_in_same_network(sender, receiver, max_depth=99): #need review
    """Check if sender and receiver are connected in either direction"""

    if sender.is_superuser:
        return True

    except_ids = ['MMS01FXC', 'MMS00QVS']

    downline_sender = sender.get_indirect_network(max_depth=max_depth)
    downline_receiver = receiver.get_indirect_network(max_depth=max_depth)

    flat_sender = {u.id for level in downline_sender for u in level if u.id not in except_ids}
    flat_receiver = {u.id for level in downline_receiver for u in level if u.id not in except_ids}

    return receiver.id in flat_sender or sender.id in flat_receiver

import re

def extract_level(user_or_username):
    """Extract numeric level from user ID"""
    if isinstance(user_or_username, User):
        user_id = user_or_username.id
    else:
        try:
            user = User.objects.get(username=user_or_username)
            user_id = user.id
        except User.DoesNotExist:
            print(f"User '{user_or_username}' not found.")
            return None
    match = re.match(r'^MMS(\d{2})', user_id)
    return int(match.group(1)) if match else None

def are_in_same_level(sender, receiver):
    """Check if sender and receiver are in the same hierarchical level."""
    level_sender = extract_level(sender)
    level_receiver = extract_level(receiver)
    return level_sender is not None and level_sender == level_receiver

class WalletService:
    @staticmethod
    def transfer_master_point(sender, receiver, amount, description="", reference=""):
        """Transfer Master Point between users"""

        if amount <= 0:
            raise ValidationError("Amount is needed")
        
        if not are_in_same_network(sender, receiver):
            raise ValidationError("Transfer unsuccessful. Not allowed to transfer to this user.")
        
        if are_in_same_level(sender, receiver):
            raise ValidationError("Transfer unsuccessful. Users are in the same level")

        sender_wallet = Wallet.objects.get(user=sender)
        if sender_wallet.master_point_balance < amount:
            raise ValidationError("Insufficient Register Point balance")
        
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
        if amount < 50:
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
                request_status='APPROVED',
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
    def withdraw_asset(user, amount, description="", depositlock_id=None):
        """
        Withdraw asset to Profit - Freeze asset amount, unlock only on approval
        Withdrawal every 14 days, max 1k per withdraw
        """

        # Withdrawal allowed only on Sundays and every 14 days since the lead_date (Sunday 2026-07-05)
        today = timezone.localdate()
        lead_date = date(2026, 7, 5)
        next_allowed_date = lead_date + timedelta(days=14)
        days_since_lead = (today - lead_date).days
        if days_since_lead < 0 or days_since_lead % 14 != 0:
            # find the next valid date for a helpful error message
            if days_since_lead < 0:
                next_allowed_date = lead_date
            else:
                cycles_passed = days_since_lead // 14
                next_allowed_date = lead_date + timedelta(days=(cycles_passed + 1) * 14)
            raise ValidationError(
                f"Next withdrawal is allowed on {next_allowed_date.strftime('%Y-%m-%d')}."
            )
        
        if amount < 0: 
            raise ValidationError("Please enter a valid withdrawal amount")

        if amount % 5 != 0:
            raise ValidationError("Amount must be a multiple of 5")
        
        if amount > 1000:
            raise ValidationError("Maximum withdrawal amount is 1000")

        asset = Asset.objects.get(user=user)
        if asset.amount < amount:
            raise ValidationError("Insufficient Asset balance")
        
        lock = DepositLock.objects.get(id=depositlock_id)

        total_withdrawable = lock.withdrawable_now - lock.freeze_amount       
        if amount > total_withdrawable:
            raise ValidationError(
            f"Only {total_withdrawable} is withdrawable"
        )
        lock.freeze_amount += Decimal(amount)
        lock.save()
       
        Transaction.objects.create(
            user=user,
            asset=asset,
            transaction_type='ASSET_WITHDRAWAL',
            point_type='ASSET',
            amount=amount,
            description=description,
            request_status='PENDING',
            reference=str(lock.id),
        )

        # Update asset balance
        asset.amount -= amount
        asset.save()
        
        return asset
    
    @staticmethod
    def process_withdrawal_request(transaction_id, action):
        """Approves or rejects a PENDING withdrawal."""

        with db_transaction.atomic():
            trx = Transaction.objects.select_for_update().get(
                id=transaction_id,
            )
            amount = trx.amount
            lock = DepositLock.objects.get(id=int(trx.reference))
            
            if action == 'Approve':

                available = lock.withdrawable_now
                remaining_to_deduct = amount
                while remaining_to_deduct > 0:
                    deduct_amount = min(available, remaining_to_deduct)
                    if remaining_to_deduct <= 0:
                        break
                    if deduct_amount > 0:
                        age = timezone.now() - lock.deposit.created_at
                        if age >= timedelta(days=365):
                            lock.amount_1y_unlocked += deduct_amount
                        elif age >= timedelta(days=180):
                            lock.amount_6m_unlocked += deduct_amount
                        lock.save()
                        remaining_to_deduct -= deduct_amount

                wallet = Wallet.objects.get(user=trx.user)
                wallet.profit_point_balance += Decimal(amount)
                wallet.save()

                # Mark as approved
                trx.request_status = 'APPROVED'
                trx.save()

            elif action == 'Reject':

                # Restore asset balance (unfreeze the amount)
                asset = trx.asset
                asset.amount += trx.amount
                asset.save()

                trx.request_status = 'REJECTED'
                trx.save()

            lock.freeze_amount -= Decimal(amount)
            lock.save()
            return trx
        

class ConversionLimitService:
    @staticmethod
    def check_daily_conversion_limit(user, amount_to_add):
        """Check combined daily conversion limit for both Profit and Commission"""
        start_of_day = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)

        # Get total conversions from both sources
        daily_total = Transaction.objects.filter(
            user=user,
            transaction_type='CONVERT',
            target_point_type='MASTER',
            created_at__gte=start_of_day,
            created_at__lt=end_of_day
        ).exclude(
            point_type='MASTER'  # Exclude any MASTER-to-MASTER conversions if they exist
        ).aggregate(total=Sum('converted_amount'))['total'] or 0

        daily_limit = Decimal(daily_total) + Decimal(amount_to_add)
        if daily_limit > Decimal('50'):
            available = Decimal('50') - Decimal(daily_total)
            raise ValidationError(
                f"You can convert {available} more Master Points today "
            )
            

class ProfitService:

    @staticmethod
    def request_withdrawal(user, amount, reference=""):
        """Request Profit Point withdrawal (min 50 USDT, 2% fee)"""

        user_ = User.objects.get(id=user.id)
        user_wallet_address = user_.wallet_address
        if user_wallet_address is None:
            raise ValidationError("Please set your wallet address in the profile page.")

        if amount < 50:
            raise ValidationError("Minimum withdrawal amount is 50 USDT")

        if amount % 10 != 0:
            raise ValidationError("Amount must be a multiple of 10")
        
        today = timezone.localdate()
        if not WithdrawalWindow.objects.filter(date=today, is_active=True).exists():
            raise ValidationError("Profit Point withdrawal is only allowed on specific days.")
        
        wallet = Wallet.objects.get(user=user)
        if wallet.profit_point_balance < amount:
            raise ValidationError("Insufficient Profit Point balance")

        txn_this_month = Transaction.objects.filter(
            user=user,
            transaction_type='WITHDRAWAL',
            point_type='PROFIT',
            created_at__month=timezone.now().month,
            created_at__year=timezone.now().year
        ).exists()
        if txn_this_month:
            raise ValidationError("You can only request one Profit Point withdrawal per month")
        
        
        fee_rate = Decimal('0.02') #Fee Rate 2%
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
                reference=reference
            )
            
            withdrawal_request.transaction = txn
            withdrawal_request.save()
        
        return withdrawal_request, wallet

    @staticmethod
    def process_withdrawal_request(request_id, action, reference=""):
        """Approve or reject a withdrawal request"""

        super_user = User.objects.get(is_superuser=True)
        super_user_wallet = Wallet.objects.get(user=super_user)

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

                fee_rate = Decimal('0.02') #Fee Rate 2%
                fee = txn.amount * fee_rate

                super_user_wallet.profit_point_balance += fee
                super_user_wallet.save()
                
                txn.save()

                Transaction.objects.create(
                    user=super_user,
                    wallet=super_user_wallet,
                    transaction_type='WITHDRAWAL_FEE',
                    point_type='PROFIT',
                    amount=fee,
                    description=f"Withdrawal Fee of {txn.user}: {fee}",
                    request_status='APPROVED',
                    reference=reference
                )
                
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
        """Convert Profit Point to Master Point"""

        if amount != int(amount):
            raise ValidationError("Amount need to be whole number")

        # Combined daily limit check
        ConversionLimitService.check_daily_conversion_limit(user, amount)

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
    def request_withdrawal(user, amount, reference=""):
        """Request Commission Point withdrawal (min 50 USDT, 2% fee)"""

        amount = Decimal(amount)

        if amount < 50:
            raise ValidationError("Minimum withdrawal amount is 50 USDT")
        
        if amount % 10 != 0:
            raise ValidationError("Amount must be a multiple of 10")
        
        today = timezone.localdate()
        if not WithdrawalWindow.objects.filter(date=today, is_active=True).exists():
            raise ValidationError("Commission Point withdrawal is only allowed on specific days.")
        
        wallet = Wallet.objects.get(user=user)
        
        affiliate_balance = Decimal(wallet.affiliate_point_balance)
        introducer_balance = Decimal(wallet.introducer_point_balance)
        
        commission_point = affiliate_balance + introducer_balance
        if commission_point < amount:
            raise ValidationError("Insufficient Commission Point balance")
        
        fee_rate = Decimal('0.02') #Fee Rate 2% 
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
            balance_deduct = amount - affiliate_balance
            if affiliate_balance >= amount:
                wallet.affiliate_point_balance -= amount
            else:
                wallet.affiliate_point_balance = Decimal('0.00')
                wallet.introducer_point_balance -= balance_deduct
            wallet.save()
            
            # Create pending transaction
            txn = Transaction.objects.create(
                user=user,
                wallet=wallet,
                transaction_type='WITHDRAWAL',
                point_type='COMMISSION',
                amount=amount,
                description=f"Commission withdrawal to be received: {actual_amount}",
                request_status='PENDING',
                reference=reference
            )
            
            withdrawal_request.transaction = txn
            withdrawal_request.save()
        
        return withdrawal_request, wallet
    
    @staticmethod
    def process_withdrawal_request(request_id, action, reference=""):
        """Approve or reject a withdrawal request"""

        super_user = User.objects.get(is_superuser=True)
        super_user_wallet = Wallet.objects.get(user=super_user)

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

                fee_rate = Decimal('0.02') #Fee Rate 2%
                fee = txn.amount * fee_rate

                super_user_wallet.profit_point_balance += fee
                super_user_wallet.save()
                
                txn.save()

                Transaction.objects.create(
                    user=super_user,
                    wallet=super_user_wallet,
                    transaction_type='WITHDRAWAL_FEE',
                    point_type='PROFIT',
                    amount=fee,
                    description=f"Withdrawal Fee for {txn.user}: {fee}",
                    request_status='APPROVED',
                    reference=reference
                )

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
                txn.description = f"Withdrawal request {refund_amount} has been refunded"
                txn.save()

        return txn       


    @staticmethod
    def convert_to_master_point(user, amount, reference=""):
        """Convert Commission Point to Master Point"""
        wallet = Wallet.objects.get(user=user)
        commission_point = wallet.affiliate_point_balance + wallet.introducer_point_balance

        if amount != int(amount):
            raise ValidationError("Amount need to be whole number")
        
        if commission_point < amount:
            raise ValidationError("Insufficient Commission Point balance")
        
        # Combined daily limit check
        ConversionLimitService.check_daily_conversion_limit(user, amount)

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


# utils/timezone_helpers.py

import pytz
from datetime import datetime, date, time
from django.utils import timezone
from django.db.models import Q

DEFAULT_TIMEZONE = 'Asia/Kuala_Lumpur'

def get_timezone(tz_name=None):
    return pytz.timezone(tz_name or DEFAULT_TIMEZONE)

def date_filter_q(field_name, start_date_input, end_date_input=None, tz_name=None):
    """
    Returns a Q object to filter a DateTimeField by local calendar date(s) in given timezone.
    Accepts:
      - str in 'YYYY-MM-DD' format
      - datetime.date
      - datetime.datetime (will use its date part)

    Usage:
        date_filter_q('created_at', '2025-04-01')
        date_filter_q('created_at', some_datetime_obj)
        date_filter_q('created_at', some_date_obj, '2025-04-05')
    """
    tz = get_timezone(tz_name)

    # Normalize start_date_input to date
    if isinstance(start_date_input, str):
        try:
            start_dt = datetime.strptime(start_date_input, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError(f"Invalid date string: {start_date_input}. Expected format: YYYY-MM-DD")
    elif isinstance(start_date_input, datetime):
        start_dt = start_date_input.date()  # Extract date part
    elif isinstance(start_date_input, date):
        start_dt = start_date_input
    else:
        raise TypeError(f"start_date_input must be str, datetime, or date. Got {type(start_date_input)}")

    # Normalize end_date_input to date (if provided)
    if end_date_input:
        if isinstance(end_date_input, str):
            try:
                end_dt = datetime.strptime(end_date_input, '%Y-%m-%d').date()
            except ValueError:
                raise ValueError(f"Invalid end date string: {end_date_input}. Expected format: YYYY-MM-DD")
        elif isinstance(end_date_input, datetime):
            end_dt = end_date_input.date()
        elif isinstance(end_date_input, date):
            end_dt = end_date_input
        else:
            raise TypeError(f"end_date_input must be str, datetime, or date. Got {type(end_date_input)}")
    else:
        end_dt = None

    # Build local datetime range
    if end_dt:
        start_local = tz.localize(datetime.combine(start_dt, time.min))
        end_local = tz.localize(datetime.combine(end_dt, time.max))
    else:
        start_local = tz.localize(datetime.combine(start_dt, time.min))
        end_local = tz.localize(datetime.combine(start_dt, time.max))

    # Convert to UTC for querying
    start_utc = start_local.astimezone(pytz.UTC)
    end_utc = end_local.astimezone(pytz.UTC)

    return Q(
        **{
            f"{field_name}__gte": start_utc,
            f"{field_name}__lte": end_utc
        }
    )
