from rest_framework import serializers
from .models import *
import re

class UserSerializer(serializers.ModelSerializer):
  verification_status_display = serializers.SerializerMethodField()
  class Meta:
    address_country = serializers.StringRelatedField()
    model = User
    fields = '__all__'
    extra_kwargs = {
      'password': {'write_only': True},
      'id': {'read_only': True},
      'referred_by': {'required': False, 'allow_null': True, 'allow_blank': True},
      'ic_document': {'required': False},
      'verification_status': {'required': False},
      'verification_status_display': {'read_only': True},
    }

  def validate_email(self, value):
    if User.objects.filter(email=value).exists():
      raise serializers.ValidationError('Email already in use')
    return value
  
  def validate_ic(self, value):
    if User.objects.filter(ic=value).exists():
      raise serializers.ValidationError('IC already in use')
    return value
  
  def validate_username(self, value):
    if User.objects.filter(username=value).exists():
      raise serializers.ValidationError('Username already in use')
    return value
  
  def validate_wallet_address(self, value):
    if User.objects.filter(wallet_address=value).exists():
      raise serializers.ValidationError('Wallet address already in use')
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
      raise serializers.ValidationError(f'Invalid referrer format: {value}. Must be 8 characters starting with MMS.')
    if not User.objects.filter(id=value).exists():
      raise serializers.ValidationError(f'Referrer with ID {value} does not exist.')
    return value
  
  def validate_ic_document(self, value):
    if not value.name.lower().endswith(('.jpg', '.jpeg', '.png', '.pdf')):
      raise serializers.ValidationError("Upload a valid image format (jpg, jpeg, png, pdf).")
    return value

  def get_verification_status_display(self, obj):
    return obj.get_verification_status_display()

  def create(self, validated_data):
    user = User.objects.create_user(**validated_data)
    return user

class UserNetworkSerializer(serializers.ModelSerializer):
  class Meta:
    model = User
    fields = ['id', 'username','referred_by', 'address_country']
    extra_kwargs = {
      'id': {'read_only': True},
      'username': {'read_only': True},
      'referred_by': {'read_only': True},
      'address_country': {'read_only': True},
    }
  