from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils.crypto import get_random_string
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.validators import RegexValidator
from decimal import Decimal
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

  referred_by = models.CharField(max_length=8, db_index=True, null=True, blank=True, verbose_name="Referred By (User ID)")

  is_active = models.BooleanField(default=True)
  is_staff = models.BooleanField(default=False)
  is_superuser = models.BooleanField(default=False)

  beneficiary_name = models.CharField(max_length=255, blank=True, null=True)
  beneficiary_ic = models.CharField(max_length=12, blank=True, null=True, validators=[RegexValidator(r'^\d{12}$', 'IC must be 12 digits')])
  beneficiary_relationship = models.CharField(max_length=255, blank=True, null=True)
  beneficiary_phone = models.CharField(max_length=15, blank=True, null=True, validators=[RegexValidator(r'^\+?601\d{9,11}$', 'Enter a valid phone number')])
  beneficiary_email = models.EmailField(blank=True, null=True)

  # Verification documents
  ic_document = models.ImageField(
    upload_to='verification_documents/',
    blank=True,
    null=True,
    verbose_name="IC/Driving License"
  )
  verification_status = models.CharField(
    max_length=20,
    choices=[
      ('REQUIRES_ACTION', 'Requires Action'),
      ('UNDER_REVIEW', 'Under Review'),
      ('APPROVED', 'Approved'),
      ('REJECTED', 'Rejected')
    ],
    default='REQUIRES_ACTION',
    verbose_name="Verification Status"
  )

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
    return User.objects.filter(referred_by=self.id)
  
  def get_indirect_network(self):
    """
    - Retrieves indirect line for this user
    """
    downline = []
    current_level_users = list(self.get_direct_network())

    depth = 0
    # Process up to 2 levels (depth 0 is the current user, depth 1 is direct, depth 2 is indirect.
    while current_level_users and depth < 2:
      downline.append(current_level_users)
      next_level_users = User.objects.filter(referred_by__in=[user.id for user in current_level_users])
      current_level_users = list(next_level_users)
      depth += 1
    return downline
  
  USERNAME_FIELD = 'username'
    
  class Meta:
    verbose_name = "User"
    verbose_name_plural = "Users"
    ordering = ['-created_at']




class AdminPoint(models.Model):
  capital_point = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'), null=True, blank=True)
  used_point = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'), null=True, blank=True)
  balance_point = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'), null=True, blank=True)
  last_updated = models.DateTimeField(auto_now=True)

  def __str__(self):
    return f'Admin Capital Point: {self.capital_point}'
  
  def save(self, *args, **kwargs):
    self.balance_point = self.capital_point - self.used_point
    super().save(*args, **kwargs)
  
  class Meta:
    verbose_name = "Admin Point"
    verbose_name_plural = "Admin Points"

class OperationalProfit(models.Model):
  daily_profit_rate = models.DecimalField(max_digits=7, decimal_places=4, default=Decimal('0.0000'), help_text='Manually update daily profit rate (e.g., enter 5.0 for 5.0%)')
  weekly_profit_rate = models.DecimalField(max_digits=7, decimal_places=4, default=Decimal('0.0000'), help_text='Manually update weekly profit rate (e.g., enter 5.0 for 5.0%)')
  current_month_profit = models.DecimalField(max_digits=7, decimal_places=4, default=Decimal('0.0000'), help_text='Manually update current month profit (e.g., enter 5.0 for 5.0%)')
  active_month_profit = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)], null=True, blank=True, help_text='The month (1-12) for which profit is currently active')
  active_year_profit = models.IntegerField(help_text='The year for which profit is currently active', null=True, blank=True)

  last_updated = models.DateTimeField(auto_now=True)

  def __str__(self):
    active_period = f'{calendar.month_name[self.active_month_profit] if self.active_month_profit else "N/A"} {self.active_year_profit if self.active_year_profit else "N/A" }'
    return f'Operational Profit - Active Period: {active_period}: {self.current_month_profit}%'
  
  class Meta:
    verbose_name = "Operational Profit"
    verbose_name_plural = "Operational Profits"


class MonthlyFinalizedProfit(models.Model):
  year = models.IntegerField(db_index=True, help_text="The year of the finalized profit (e.g., 2024).")
  month = models.IntegerField(
    validators=[MinValueValidator(1), MaxValueValidator(12)], 
    db_index=True, 
    help_text="The month of the finalized profit (1 for January, 12 for December)."
  )
  finalized_profit_rate = models.DecimalField(
    max_digits=7, decimal_places=4,
    help_text="The percentage profit rate applied for this month (e.g., 5.0 for 5.0%)."
  )

  finalized_at = models.DateTimeField(
    auto_now_add=True, 
    help_text="Timestamp when this monthly profit was recorded/finalized."
  )

  class Meta:
    unique_together = ('year', 'month')
    ordering = ['-year', '-month']
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
  master_point_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
  profit_point_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
  affiliate_point_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
  
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)
  
  def __str__(self):
    return f"{self.user.username}'s Wallet"
  
  class Meta:
    verbose_name = "Wallet"
    verbose_name_plural = "Wallets"



class Transaction(models.Model):
  TRANSACTION_TYPES = (
    ('DEPOSIT', 'Deposit'),
    ('WITHDRAWAL', 'Withdrawal'),
    ('TRANSFER', 'Transfer'),
    ('BONUS', 'Bonus'),
  )
    
  POINT_TYPES = (
    ('MASTER', 'Master Point'),
    ('PROFIT', 'Profit Point'),
    ('AFFILIATE', 'Affiliate Point'),
  )
    
  user = models.ForeignKey(User, null=True, on_delete=models.CASCADE, related_name='transactions')
  wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
  transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
  point_type = models.CharField(max_length=20, choices=POINT_TYPES)
  amount = models.DecimalField(max_digits=15, decimal_places=2)
  description = models.TextField(blank=True)
  reference = models.CharField(max_length=100, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  
  # For Transfers
  target_point_type = models.CharField(max_length=20, choices=POINT_TYPES, blank=True, null=True)
  converted_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
  
  def __str__(self):
    return f"{self.user.username} - {self.get_transaction_type_display()} - {self.get_point_type_display()} - {self.amount}"
  
  class Meta:
    ordering = ['-created_at']
    verbose_name = "Transaction"
    verbose_name_plural = "Transactions"


class WithdrawalRequest(models.Model):
  wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='withdrawal_requests')
  point_type = models.CharField(max_length=20, choices=Transaction.POINT_TYPES)
  amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(50)])
  request_status = models.CharField(max_length=20, choices=RequestStatus.choices, default=RequestStatus.PENDING, verbose_name="Request Status")
  transaction = models.OneToOneField(Transaction, on_delete=models.SET_NULL, null=True, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  processed_at = models.DateTimeField(null=True, blank=True)
  
  def __str__(self):
    return f"Withdrawal Request - {self.get_point_type_display()} - {self.amount}"
  
  class Meta:
    ordering = ['-created_at']
    verbose_name = "Withdrawal Request"
    verbose_name_plural = "Withdrawal Requests"


class TransferRequest(models.Model):
  wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transfer_requests')
  request_status = models.CharField(max_length=20, choices=RequestStatus.choices, default=RequestStatus.PENDING, verbose_name="Request Status")
  source_point_type = models.CharField(max_length=20, choices=Transaction.POINT_TYPES)
  target_point_type = models.CharField(max_length=20, choices=Transaction.POINT_TYPES)
  amount = models.DecimalField(
    max_digits=15, 
    decimal_places=2, 
    validators=[MinValueValidator(50)],
    help_text="Amount must be in multiples of 50"
  )
  transaction = models.OneToOneField(Transaction, on_delete=models.SET_NULL, null=True, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  
  def __str__(self):
    return f"Transfer - {self.get_source_point_type_display()} to {self.get_target_point_type_display()} - {self.amount}"
  
  class Meta:
    ordering = ['-created_at']
    verbose_name = "Transfer Request"
    verbose_name_plural = "Transfer Requests"

  #integrate "Asset" related functionalities into Django application, focusing on how the Wallet model in models.py can support these. Based on requirements, "Asset Placement" seems to be a specific way of funding the master_point_balance, while "Asset Withdrawal" and "Asset Statement" are operations and views related to the wallet's funds.
