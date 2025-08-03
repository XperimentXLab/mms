from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils.crypto import get_random_string
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.validators import RegexValidator
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
import calendar
import string

import logging

logger = logging.getLogger(__name__)

class User(AbstractUser):

  id = models.CharField(max_length=8, primary_key=True)
  username = models.CharField(max_length=255, unique=True)
  ic = models.CharField(max_length=12, unique=True, validators=[RegexValidator(r'^\d{12}$', 'IC must be 12 digits')])
  email = models.EmailField(unique=True)
  wallet_address = models.CharField(max_length=255, blank=True, null=True, verbose_name="Wallet Address (BEP20)")

  address_line = models.CharField(max_length=255, blank=True, null=True)
  address_city = models.CharField(max_length=255, blank=True, null=True)
  address_state = models.CharField(max_length=255, blank=True, null=True)
  address_postcode = models.CharField(max_length=255, blank=True, null=True)
  address_country = models.CharField(max_length=100, blank=True, null=True, verbose_name='Country')

  phone_no = models.CharField(max_length=15, blank=True, null=True, validators=[RegexValidator(r'^(?:\+?60|0)1\d{7,11}$',
  'Enter a valid mobile number')])
  referred_by = models.CharField(max_length=8, db_index=True, null=True, blank=True, verbose_name="Referred By (User ID)")

  is_active = models.BooleanField(default=True)
  is_staff = models.BooleanField(default=False)
  is_superuser = models.BooleanField(default=False)
  is_campro = models.BooleanField(default=False)
  is_trader = models.BooleanField(default=False)

  beneficiary_name = models.CharField(max_length=255, blank=True, null=True)
  beneficiary_ic = models.CharField(max_length=12, blank=True, null=True, validators=[RegexValidator(r'^\d{12}$', 'IC must be 12 digits')])
  beneficiary_relationship = models.CharField(max_length=255, blank=True, null=True)
  beneficiary_phone = models.CharField(max_length=15, blank=True, null=True, validators=[RegexValidator(r'^(?:\+?60|0)1\d{7,11}$',
  'Enter a valid mobile number')])
  beneficiary_email = models.EmailField(blank=True, null=True)

  # Verification documents
  ic_document_url = models.URLField(blank=True, null=True)
  verification_status = models.CharField(
    max_length=40,
    choices=[
      ('REQUIRES_ACTION', 'Requires Action'),
      ('UNDER_REVIEW', 'Under Review'),
      ('APPROVED', 'Approved'),
      ('REJECTED', 'Rejected')
    ],
    default='REQUIRES_ACTION',
    verbose_name="Verification Status"
  )
  reject_reason = models.TextField(blank=True, null=True, verbose_name="Reject Reason")


  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)
  
  def unique_id_generator(self, referred_by_id=None):
    """
    Generates a unique user ID based on referral hierarchy:
    - MMS00XXX for root/superuser (level 0)
    - MMS01XXX to MMS09XXX for levels 1-9
    - MMS10XXX to MMS99XXX for levels 10-99
    """
    while True:
      if referred_by_id is None or referred_by_id == "":
        # Root user/superuser case - level 0
        prefix = "MMS00"
      else:
        try:
          if len(referred_by_id) == 8 and referred_by_id.startswith('MMS'):
            level_str = referred_by_id[3:5]
              
            if level_str.isdigit():
              current_level = int(level_str)
              next_level = current_level + 1
              
              if next_level > 99:
                logger.warning(f'Maximum referral level (99) reached')
                next_level = 99  # Cap at maximum level
              
              # Format the level with leading zero for 1-9
              level_display = f"{next_level:02d}"
              prefix = f"MMS{level_display}"
            else:
              logger.warning(f'Invalid level in referrer ID: {referred_by_id}')
              raise ValidationError(f'Invalid level in referrer ID: {referred_by_id}')
          else:
            logger.warning(f'Invalid referrer ID format: {referred_by_id}')
            raise ValidationError(f'Invalid referrer ID format: {referred_by_id}')
        except Exception as e:
          logger.error(f"Error processing referrer ID: {e}")
          raise ValidationError(f"Error processing referrer ID: {e}")

      # Generate random suffix (3 alphanumeric characters)
      random_suffix = get_random_string(length=3, allowed_chars=string.ascii_uppercase + string.digits)
      code = f'{prefix}{random_suffix}'

      # Ensure the ID is unique
      if not self.__class__.objects.filter(id=code).exists():
        return code
        
  def save(self, *args, **kwargs):
    # Generate ID only when creating a new user and id is not already set
    if not self.id:
      self.id = self.unique_id_generator(referred_by_id=self.referred_by)
    super().save(*args, **kwargs)

  def __str__(self):
    return f'{self.username}: {self.id}'
  
  def get_all_network(self, include_self=False):
    if self.is_superuser:
      queryset = User.objects.all()
      if not include_self:
        queryset = queryset.exclude(pk=self.pk)
      return queryset
  
  def get_direct_network(self):
    direct_network = User.objects.filter(referred_by=self.id)
    return direct_network
  
  def get_indirect_network(self, max_depth=5):
    """
    - Retrieves indirect line for this user
    """
    downline = []
    current_level_users = list(self.get_direct_network())

    depth = 1
    # depth 0 is the current user, depth 1 is direct, depth 2 is indirect
    while current_level_users and depth <= max_depth:
      downline.append(current_level_users)
      next_level_users = User.objects.filter(referred_by__in=[user.id for user in current_level_users])
      current_level_users = list(next_level_users)
      depth += 1

    return downline
  
  USERNAME_FIELD = 'username'
    
  class Meta:
    verbose_name = "User"
    verbose_name_plural = "Users"
    ordering = ['-created_at', 'referred_by', 'verification_status']


class UserJWT(models.Model):
    user = models.ForeignKey(
      User,
      on_delete=models.CASCADE,
      related_name='jwts'
    )
    access_token = models.TextField()
    refresh_token = models.TextField()
    device_fingerprint = models.CharField(max_length=64)
    ip_address = models.GenericIPAddressField()
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()

    class Meta:
      indexes = [
        models.Index(fields=['user', 'device_fingerprint']),
        models.Index(fields=['access_token']),
        models.Index(fields=['expires_at']),
      ]

    def is_expired(self):
        return timezone.now() > self.expires_at


class OperationalProfit(models.Model):
  daily_profit_rate = models.DecimalField(max_digits=7, decimal_places=2, default=Decimal('0.00'), help_text='Manually update daily profit rate (e.g., enter 5.0 for 5.0%)')
  weekly_profit_rate = models.DecimalField(max_digits=7, decimal_places=2, default=Decimal('0.00'), help_text='Manually update weekly profit rate (e.g., enter 5.0 for 5.0%)')
  current_month_profit = models.DecimalField(max_digits=7, decimal_places=2, default=Decimal('0.00'), help_text='Manually update current month profit (e.g., enter 5.0 for 5.0%)')
  active_day_profit = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(31)], null=True, blank=True, help_text='The day (1-31) for which profit is currently active')
  active_month_profit = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)], null=True, blank=True, help_text='The month (1-12) for which profit is currently active')
  active_year_profit = models.IntegerField(help_text='The year for which profit is currently active', null=True, blank=True)

  last_updated = models.DateTimeField(auto_now=True)

  def __str__(self):
    active_period = f'{calendar.month_name[self.active_month_profit] if self.active_month_profit else "N/A"} {self.active_year_profit if self.active_year_profit else "N/A" }'
    return f'Operational Profit - Active Period: {active_period}: {self.current_month_profit}%'
  
  class Meta:
    unique_together = ('active_day_profit', 'active_month_profit', 'active_year_profit')
    ordering = ['active_day_profit', '-active_year_profit', '-active_month_profit']
    verbose_name = "Operational Profit"
    verbose_name_plural = "Operational Profits"


class MonthlyFinalizedProfit(models.Model):
  year = models.IntegerField(db_index=True, help_text="The year of the finalized profit (e.g., 2024).")
  month = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)], db_index=True, help_text="The month of the finalized profit (1 for January, 12 for December)."
  )
  finalized_profit_rate = models.DecimalField(
    max_digits=7, decimal_places=2, default=Decimal('0.00'),
    help_text="The percentage profit rate applied for this month (e.g., 5.0 for 5.0%)."
  )

  finalized_at = models.DateTimeField(
    auto_now_add=True, 
    help_text="Timestamp when this monthly profit was recorded/finalized."
  )

  class Meta:
    unique_together = ('year', 'month')
    ordering = ['-year', 'month']
    verbose_name = "Monthly Finalized Profit"
    verbose_name_plural = "Monthly Finalized Profits"

  def __str__(self):
    try:
      month_name = calendar.month_name[self.month]
    except IndexError: 
      month_name = f"Month {self.month}"
    return f"{month_name} {self.year}: {self.finalized_profit_rate}%)"

  @classmethod
  def get_total_yearly_profit(cls, year):
    """
    Calculates the sum of all finalized monthly profit rates for a given year.
    Returns a Decimal value representing the total percentage.
    """
    total_rate = cls.objects.filter(year=year).aggregate(
      total_profit_rate=models.Sum('finalized_profit_rate')
    )['total_profit_rate']
    return total_rate if total_rate is not None else Decimal('0.00')



# Verify IC, Depo master, Place Asset, WD profit
class RequestStatus(models.Choices):
  PENDING = 'Pending'
  APPROVED = 'Approved'
  REJECTED = 'Rejected'
  

class Wallet(models.Model):
  user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
  
  # Point balances
  master_point_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
  profit_point_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
  #Commision Point
  affiliate_point_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
  introducer_point_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
  
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  @classmethod
  def get_or_create_wallet(cls, user):
      """Lazy-creates a Wallet if it doesn't exist."""
      wallet, created = cls.objects.get_or_create(
        user=user,
        defaults={
          'master_point_balance': Decimal('0.00'),
          'profit_point_balance': Decimal('0.00'),
          'affiliate_point_balance': Decimal('0.00'),
          'introducer_point_balance': Decimal('0.00')
        }
      )
      return wallet
  
  def __str__(self):
    return f"{self.user.username}'s Wallet"
  
  class Meta:
    verbose_name = "Wallet"
    verbose_name_plural = "Wallets"


class Asset(models.Model):
  user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assets')
  amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
  is_free_campro = models.BooleanField(default=False)

  @classmethod
  def get_or_create_asset(cls, user):
    asset, created = cls.objects.get_or_create(
        user=user,
        defaults={'amount': Decimal('0.00')}  # Default value for new records
    )
    return asset

  class Meta:
    verbose_name = "Asset"
    verbose_name_plural = "Assets"

  def __str__(self):
    return f"{self.user.username}'s Asset - {self.amount}"


class Transaction(models.Model):
  TRANSACTION_TYPES = (
    ('WITHDRAWAL', 'Withdrawal'), # Profit, Affiliate, Introducer >>
    ('CONVERT', 'Convert'), # Profit, Affiliate, Introducer >> Master Point
    ('TRANSFER', 'Transfer'), # Master Point > User Master Point
    ('DISTRIBUTION', 'Distribution'), # Admin > Profit Point
    ('AFFILIATE_BONUS', 'Affiliate Bonus'), # Admin > Affiliate Point
    ('INTRODUCER_BONUS', 'Introducer Bonus'), # Admin > Affiliate Point
    ('ASSET_PLACEMENT', 'Asset Placement'), # Master Point >> Asset
    ('ASSET_WITHDRAWAL', 'Asset Withdrawal'), #Asset > Profit Point
    ('WELCOME_BONUS', 'Welcome Bonus'), # Admin > Asset
    ('SHARING_PROFIT', 'Sharing Profit'), # Admin > Profit Point
    ('MIGRATION', 'Migration')
  )
    
  POINT_TYPES = (
    ('MASTER', 'Master Point'),
    ('PROFIT', 'Profit'),
    ('COMMISSION', 'Commission'),
    ('ASSET', 'Asset')
  )
    
  user = models.ForeignKey(User, null=True, on_delete=models.CASCADE, related_name='transactions')
  wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions', null=True)
  asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='transactions', null=True)
  transaction_type = models.CharField(max_length=40, choices=TRANSACTION_TYPES)
  point_type = models.CharField(max_length=40, choices=POINT_TYPES)
  request_status = models.CharField(max_length=40, choices=RequestStatus.choices, verbose_name="Request Status", null=True)
  amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
  description = models.TextField(blank=True)
  reference = models.CharField(max_length=100, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  
  # For Transfers
  target_point_type = models.CharField(max_length=40, choices=POINT_TYPES, blank=True, null=True)
  converted_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
  
  def __str__(self):
    return f"{self.user.username} - {self.get_transaction_type_display()} - {self.get_point_type_display()} - {self.amount}"
  
  class Meta:
    ordering = ['-created_at', 'request_status', 'transaction_type', 'point_type','user']
    verbose_name = "Transaction"
    verbose_name_plural = "Transactions"


class WithdrawalRequest(models.Model):
  wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='withdrawal_requests')
  point_type = models.CharField(max_length=40, choices=Transaction.POINT_TYPES)
  amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(50)])
  actual_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
  fee = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
  fee_rate = models.DecimalField(max_digits=2, decimal_places=2, default=Decimal('0.00'))
  transaction = models.OneToOneField(Transaction, on_delete=models.SET_NULL, null=True, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  processed_at = models.DateTimeField(null=True, blank=True)
  
  def __str__(self):
    return f"Withdrawal Request - {self.get_point_type_display()} - {self.amount}"
  
  class Meta:
    ordering = ['-created_at']
    verbose_name = "Withdrawal Request"
    verbose_name_plural = "Withdrawal Requests"


class DepositLock(models.Model):
  deposit = models.OneToOneField(  # Links to the original deposit transaction
    Transaction,
    on_delete=models.CASCADE,
    related_name='lock_info'
  )
  amount_6m_locked = models.DecimalField(  # Tracks the 50% for 6m unlock
    max_digits=15, decimal_places=2, default=Decimal('0.00')  
  )
  amount_1y_locked = models.DecimalField(  # Tracks the 50% for 1y unlock
    max_digits=15, decimal_places=2, default=Decimal('0.00')  
  )
  amount_6m_unlocked = models.DecimalField(  # Tracks how much of the 50% is withdrawn
    max_digits=15, 
    decimal_places=2, 
    default=Decimal('0.00')
  )
  amount_1y_unlocked = models.DecimalField(  # Tracks how much of the remaining 50% is withdrawn
    max_digits=15, 
    decimal_places=2, 
    default=Decimal('0.00')
  )
  is_free_campro = models.BooleanField(default=False)
  created_at = models.DateTimeField(auto_now_add=True)

  @property
  def days_until_6m(self):
    """Returns days left until 6-month unlock."""
    current_time = timezone.now()
    delta = (self.deposit.created_at + timedelta(days=180)) - current_time
    return max(0, delta.days)

  @property
  def days_until_1y(self):
    """Returns days left until 1-year unlock."""
    current_time = timezone.now()
    delta = (self.deposit.created_at + timedelta(days=365)) - current_time
    return max(0, delta.days)

  @property
  def withdrawable_now(self):
    """Calculates currently withdrawable amount."""
    current_time = timezone.now()
    age = current_time - self.deposit.created_at

    if self.is_free_campro:  # Full lock for 1 year
        return (self.deposit.amount - self.amount_1y_unlocked) if age >= timedelta(days=365) else Decimal('0.00')

    if age >= timedelta(days=365):  # Both 6m & 1y unlocked
        return (self.amount_6m_locked - self.amount_6m_unlocked) + (self.amount_1y_locked - self.amount_1y_unlocked)
    elif age >= timedelta(days=180):  # Only 6m unlocked
        return (self.amount_6m_locked - self.amount_6m_unlocked)
    else:
        return Decimal('0.00')

  def __str__(self):
    return f"Lock for {self.deposit.amount} (Deposit: {self.deposit.created_at})"

  class Meta:
    verbose_name = "Deposit Lock"
    verbose_name_plural = "Deposit Locks"

class Performance(models.Model):
  total_deposit = models.DecimalField(max_digits=7, decimal_places=2, default=Decimal('0.00'))
  total_gain_z = models.DecimalField(max_digits=7, decimal_places=2, default=Decimal('0.00'))
  total_gain_a = models.DecimalField(max_digits=7, decimal_places=2, default=Decimal('0.00'))
  month = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)], null=True, blank=True, help_text='The month (1-12) for which profit is currently active')
  year = models.IntegerField(db_index=True, null=True, blank=True)
  last_updated = models.DateTimeField(auto_now=True)

  class Meta:
    verbose_name = "Performance"
    verbose_name_plural = "Performances"
    unique_together = ('month', 'year')
    ordering = ['-year', '-month']

  def __str__(self):
    month_name = calendar.month_name[self.month]
    return f'Performance -- Total Deposit: {self.total_deposit}, Total Gain Trading for {month_name}: {self.total_gain_z + self.total_gain_a}'
  

class PromoCode(models.Model):
  user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='promo_code')
  code = models.CharField(max_length=10, unique=True, help_text='Invalid code')

  created_at = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    return self.code
  
  class Meta:
    verbose_name = "Promo Code"
    verbose_name_plural = "Promo Codes"