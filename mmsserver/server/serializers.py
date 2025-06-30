from rest_framework import serializers
from .models import *
import re
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from decimal import Decimal
from datetime import date

class UserSerializer(serializers.ModelSerializer):
  verification_status_display = serializers.SerializerMethodField()
  asset_amount = serializers.SerializerMethodField()
  password = serializers.CharField(write_only=True)

  class Meta:
    address_country = serializers.StringRelatedField()
    model = User
    fields = [
      'id',
      'username',
      'password',
      'ic',
      'email',
      'referred_by',
      'wallet_address',
      'address_line',
      'address_city',
      'address_state',
      'address_postcode',
      'address_country',
      'beneficiary_name',
      'beneficiary_ic',   
      'beneficiary_relationship',
      'beneficiary_phone',
      'beneficiary_email',
      'ic_document',
      'verification_status',
      'verification_status_display',
      'asset_amount',
      'created_at',
    ]
    extra_kwargs = {
      'password': {'write_only': True},
      'id': {'read_only': True},
      'referred_by': {'required': False, 'allow_null': True, 'allow_blank': True},
      'ic_document': {'required': False},
      'verification_status': {'required': False},
      'verification_status_display': {'read_only': True},
      'created_at': {'read_only': True},
      'asset_amount': {'read_only': True},
    }
  def get_asset_amount(self, obj):
    asset = Asset.objects.filter(user=obj).first()
    if asset:
      return asset.amount
    return None
    
  def validate_email(self, value):
    if User.objects.filter(email=value).exists():
      raise serializers.ValidationError('Email already in use')
    return value
  
  def validate_ic(self, value):
    if not (isinstance(value, str)) and len(value) == 12:
      return serializers.ValidationError('Invalid IC format')
    
    try:
      yy_str = value[0:2]
      mm_str = value[2:4]
      dd_str = value[4:6]

      year_val = int(yy_str)
      month_val = int(mm_str)
      day_val = int(dd_str)

      current_dt = date.today()
      if year_val <= (current_dt.year % 100):
        birth_year = 2000 + year_val
      else:
        birth_year = 1900 + year_val

      birth_date = date(birth_year, month_val, day_val)

      if birth_date > current_dt:
        raise serializers.ValidationError('Invalid date of birth')

      age = current_dt.year - birth_date.year - ((current_dt.month, current_dt.day) < (birth_date.month, birth_date.day))
      if age < 18:
        raise serializers.ValidationError('User must be at least 18 years old')
    except ValueError:
      raise serializers.ValidationError('Invalid IC format.')
    
    if User.objects.filter(ic=value).exists():
      raise serializers.ValidationError('IC already in use')
    return value
  
  def validate_username(self, value):
    if not (isinstance(value, str) and value.startswith('MMS')):
      raise serializers.ValidationError(f'Username must start with MMS.')
    if User.objects.filter(username=value).exists():
      raise serializers.ValidationError('Username already in use')
    return value
  
  #password need to have at least 1 uppercase 1 lowercase and a number for 8 characters
  def validate_password(self, value):
    if len(value) < 8:
      raise serializers.ValidationError('Password must be at least 8 characters long')
    if not re.search(r"[a-z]", value):
      raise serializers.ValidationError('Password must contain at least one lowercase letter')
    if not re.search(r"[A-Z]", value):
      raise serializers.ValidationError('Password must contain at least one uppercase letter')
    if not re.search(r"[0-9]", value):
      raise serializers.ValidationError('Password must contain at least one number')
    return value
  
  def validate_referred_by(self, value):
    if not (isinstance(value, str) and len(value) == 8 and value.startswith('MMS')):
      raise serializers.ValidationError(f'Invalid Referral ID format.')
    if not User.objects.filter(id=value).exists():
      raise serializers.ValidationError(f'Referral ID does not exist.')
    return value
  
  def validate_ic_document(self, value):
    if not value.name.lower().endswith(('.jpg', '.jpeg', '.png', '.pdf')):
      raise serializers.ValidationError("Upload a valid image format (jpg, jpeg, png, pdf).")
    return value

  def get_verification_status_display(self, obj):
    return obj.get_verification_status_display()

  def create(self, validated_data):
    password = validated_data.pop('password', None)
    if not password:
        raise serializers.ValidationError({'password': 'This field is required.'})
    
    user = User.objects.create_user(**validated_data, password=password)
    return user

class UserNetworkSerializer(serializers.ModelSerializer):

  asset_amount = serializers.SerializerMethodField()

  class Meta:
    model = User
    fields = ['id', 'username','referred_by', 'asset_amount']
    extra_kwargs = {
      'id': {'read_only': True},
      'username': {'read_only': True},
      'referred_by': {'read_only': True},
    }

  def get_asset_amount(self, obj):
    asset = Asset.objects.filter(user=obj).first()
    if asset:
      return asset.amount
    return None

class PasswordResetSerializer(serializers.Serializer):
  email = serializers.EmailField(required=True)

  def validate_email(self, value):
    try:
      User.objects.get(email=value)
    except User.DoesNotExist:
      raise serializers.ValidationError('User with this email does not exist')
    return value
  
class SetNewPasswordSerializer(serializers.Serializer):
  password = serializers.CharField(write_only=True, required=True)
  password2 = serializers.CharField(write_only=True, required=True, label='Confirm Password')

  # uidb64 and token are not part of the request body, but passed via URL and context

  def validate(self, attrs):
    password = attrs.get('password')
    password2 = attrs.get('password2')
    uidb64 = self.context.get('uidb64')
    token = self.context.get('token')

    if not uidb64 or not token:
      raise serializers.ValidationError('UID and Token are required in context of validation')
    
    if password != password2:
      raise serializers.ValidationError('Passwords do not match')
    
    #password need to have at least 1 uppercase 1 lowercase and a number for 8 characters
    if len(password) < 8:
      raise serializers.ValidationError('Password must be at least 8 characters long')
    if not re.search(r"[a-z]", password):
      raise serializers.ValidationError('Password must contain at least one lowercase letter')
    if not re.search(r"[A-Z]", password):
      raise serializers.ValidationError('Password must contain at least one uppercase letter')
    if not re.search(r"[0-9]", password):
      raise serializers.ValidationError('Password must contain at least one number')
    
    try:
      uid = force_str(urlsafe_base64_decode(uidb64))
      self.user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
      raise serializers.ValidationError({'token':'Invalid token or user ID:'})
    
    if not default_token_generator.check_token(self.user, token):
      raise serializers.ValidationError({'token': 'Invalid token or user ID'})
    
    attrs['user'] = self.user
    return attrs
  
class OperationalProfitSerializer(serializers.ModelSerializer):

  daily_profit_rate = serializers.DecimalField(max_digits=7, decimal_places=2, min_value=Decimal('0.00'), max_value=Decimal('3.00'), help_text='Daily profit as a percentage (e.g., 5.0 for 5.0%)')
  weekly_profit_rate = serializers.DecimalField(max_digits=7, decimal_places=2, min_value=Decimal('0.00'), max_value=Decimal('7.00'), help_text='Weekly profit as a percentage (e.g., 5.0 for 5.0%)')
  current_month_profit = serializers.DecimalField(max_digits=7, decimal_places=2, min_value=Decimal('0.00'), max_value=Decimal('15.00'), help_text='Current month profit as a percentage (e.g., 5.0 for 5.0%)')

  class Meta:
    model = OperationalProfit
    fields = [
      'id',
      'daily_profit_rate',
      'weekly_profit_rate',
      'active_month_profit', # Model validators (1-12) will be used
      'active_year_profit',
      'current_month_profit',
      'last_updated'
    ]
    read_only_fields = ['id', 'last_updated']

class MonthlyFinalizedProfitSerializer(serializers.ModelSerializer):

  finalized_profit_rate = serializers.DecimalField(max_digits=7, decimal_places=2, min_value=Decimal('0.00'), max_value=Decimal('15.00'), help_text='Finalized profit as a percentage (e.g., 5.0 for 5.0%)')

  class Meta:
    model = MonthlyFinalizedProfit
    fields = '__all__'
    read_only_fields = ['id', 'finalized_at']


class WalletSerializer(serializers.ModelSerializer):

  master_point_balance = serializers.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
  profit_point_balance = serializers.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
  affiliate_point_balance = serializers.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
  introducer_point_balance = serializers.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))

  class Meta:
    model = Wallet
    fields = '__all__'
    read_only_fields = ['id', 'created_at', 'updated_at']

class AssetSerializer(serializers.ModelSerializer):

  class Meta:
    model = Asset
    fields = '__all__'
    read_only_fields = [ 'id' ]

class TransactionSerializer(serializers.ModelSerializer):

  request_status_display = serializers.SerializerMethodField()
  username = serializers.CharField(source='user.username', read_only=True)

  class Meta:
    model = Transaction
    fields = [
      'id',
      'user',
      'username',
      'amount',
      'transaction_type',
      'point_type',
      'created_at',
      'converted_amount',
      'request_status',
      'request_status_display',
      'reference',
      'description'
    ]
    read_only_fields = [
      'id', 
      'created_at', 
      'amount', 
      'transaction_type', 
      'point_type',
      'converted_amount',
      'request_status_display'
    ]
    
  def get_request_status_display(self, obj):
    return obj.get_request_status_display()

class WithdrawalRequestSerializer(serializers.ModelSerializer):

  request_status_display = serializers.SerializerMethodField()

  class Meta:
    model = WithdrawalRequest
    fields = [
      'id',
      'user',
      'amount',
      'actual_amount',
      'fee',
      'fee_rate',
      'point_type',
      'created_at',
      'processed_at',
      'request_status',
      'request_status_display',
      'reference',
      'description'
    ]
    read_only_fields = [
      'id',
      'created_at',
      'processed_at',
      'amount',
      'actual_amount',
      'fee',
      'fee_rate',
      'point_type'
      'request_status_display',
    ]

  def get_request_status_display(self, obj):
    if obj.transaction:
        return obj.transaction.request_status
    return None

class DepositLockSerializer(serializers.ModelSerializer):

  request_status_display = serializers.SerializerMethodField()

  class Meta:
    model = DepositLock
    fields = [
      'id',
      'deposit',
      'amount_6m_unlocked',
      'amount_1y_unlocked',
      'amount_6m_locked',
      'amount_1y_locked',
      'created_at',
      'days_until_6m',
      'days_until_1y',
      'withdrawable_now',
      'request_status_display'
    ]
    read_only_fields = [
      'id',
      'deposit'
      'amount_6m_unlocked',
      'amount_1y_unlocked',
      'amount_6m_locked',
      'amount_1y_locked',
      'created_at',
      'days_until_6m',
      'days_until_1y',
      'withdrawable_now',
    ]

  def get_request_status_display(self, obj):
    if obj.transaction:
        return obj.transaction.request_status
    return None
    
