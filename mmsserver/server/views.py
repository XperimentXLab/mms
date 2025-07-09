from .models import *
from .serializers import *
from .utils import *
from django.conf import settings
import requests
from rest_framework.authentication import authenticate
from rest_framework.decorators import api_view, permission_classes, APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db.models import Sum
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes #force_str
#from django.core.mail import send_mail
#from django.template.loader import render_to_string 

import logging

logger = logging.getLogger(__name__)


class TokenVerifyView(APIView):
  authentication_classes = [JWTAuthentication]
  permission_classes = [IsAuthenticated]

  def get(self, request):
    """Simple endpoint to verify token validity"""
    return Response({'status': 'valid'}, status=200)
  

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
  refresh_token = request.data.get('refresh') or request.headers.get('Authorization', '').replace('Bearer ', '')

  if not refresh_token:
    return Response({'error': 'Refresh token not provided'}, status=401)

  try:
    refresh = RefreshToken(refresh_token)
    refresh.verify()
    return Response({'access': str(refresh.access_token)})
  except TokenError as e:
    return Response({'error': f'Invalid or expired refresh token: {e}'}, status=401)
  

############################################


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
  user = request.user
  try:
    serializer = UserSerializer(user)
    return Response(serializer.data, status=200)
  except Exception as e:
    return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_username(request):
  user = request.user
  try:
    user = User.objects.get(id=user.id)
    username = user.username
    return Response(username, status=200)
  except User.DoesNotExist:
    return Response({'error': 'User not found'}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
  username = request.data.get('username')
  first_name = request.data.get('first_name')
  last_name = request.data.get('last_name')

  if not (first_name and last_name):
    return Response({'error': 'First name and last name are required'}, status=400)

  if ' ' in username:
    return Response({'error': 'Username cannot have spaces'})
    
  try:
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
      user = serializer.save()
      return Response({'message':f'{user.username} successfully registered'}, status=201)
    else:
      return Response({'error': serializer.errors}, status=400)
    
  except KeyError as e:
    return Response({'error': str(e)}, 400)
  except ValidationError as e:
    return Response({'error': str(e)}, 401)
  except Exception as e:
    logger.error(f"Unexpected error during user registration: {e}")
    return Response({'error': 'An unexpected error occurred. Please contact administrator'}, status=500)

#login
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
  username = request.data.get('username')
  password = request.data.get('password')
  user = authenticate(request, username=username, password=password)

  if user:
    """
    data = request.data
    recaptcha_token = data.get('recaptchaToken')
    if not recaptcha_token:
      return Response({'error': 'reCAPTCHA token is missing'}, status=400)
    secret_key = settings.RECAPTCHA_SECRET_KEY
    url = f"https://www.google.com/recaptcha/api/siteverify?secret={secret_key}&response={recaptcha_token}"
    responseCaptcha = requests.post(url)
    resultCaptcha = responseCaptcha.json()

    if responseCaptcha.status_code != 200:
      return Response({'error': 'Error communicating with reCAPTCHA service'}, status=500)

    if not resultCaptcha.get("success"):
      return Response({'error': 'CAPTCHA verification failed'}, status=400)
    """
    refresh = RefreshToken.for_user(user)
    return Response({
      'access': str(refresh.access_token),
      'refresh': str(refresh),
    })
  else:
    logger.error(f"Error logging in for {username}")
    return Response({'error': 'Invalid credentials'}, status=400)
  

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
  response = Response({'message': 'Logout successful'})
  response.delete_cookie('access_token', path='/')
  response.delete_cookie('refresh_token', path='/')
  return response

  
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_password(request):
  user = request.user
  old_password = request.data.get('old_password')
  new_password = request.data.get('new_password')
  confirm_password = request.data.get('confirm_password')

  if not all ([old_password, new_password, confirm_password]):
    return Response({'error': 'All fields are required'}, status=400)

  if new_password != confirm_password:
    return Response({'error': 'New passwords do not match'}, status=400)
  
  if not user.check_password(old_password):
    return Response({'error': 'Incorrect old password'}, status=400)

  try:
    validate_password(new_password, user=user)
  except ValidationError as e:
    return Response({'error': str(e.detail)}, status=401)
  except Exception as e:
    logger.error(f"Error during password update for {user.username}: {str(e)}")
    return Response({'error': 'An unexpected error occurred.'}, status=500)


  user.set_password(new_password)
  user.save()
  return Response({'message': f'{user.username} password successfully updated'}, status=200)


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset_email(request):
  serializer = PasswordResetSerializer(data=request.data)
  if serializer.is_valid():
    email = serializer.validated_data['email']
    try:
      user = User.objects.get(email=email)
      uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
      token = default_token_generator.make_token(user)

      frontend_url = 'https://mmsventure.io'
      reset_link = f"{frontend_url}/reset-password-confirm/{uidb64}/{token}/"
      
      subject = 'Password Reset Requested'
      reset_password_template = "password_reset_email.html"
      c = {
          "email": user.email,
          "domain": frontend_url, # or your frontend domain
          "site_name": "Test1-Project",
          "uid": uidb64,
          "user": user,
          "token": token,
          "protocol": 'https' if not settings.DEBUG else 'http',
          "reset_link": reset_link,
      }
      #message = render_to_string(reset_password_template, c)
      message = f"Hello {user.username},\n\nPlease click the link below to reset your password:\n{reset_link}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe Team"

      #Email Configuration: The request_password_reset_email view currently logs the reset link to your console/logger. For it to actually send emails, you'll need to configure Django's email settings in your settings.py file (e.g., EMAIL_BACKEND, EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, etc.). Once configured, you can uncomment the send_mail line in views.py.
      # TODO: Configure email backend in settings.py and uncomment send_mail
      # send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
      #   logger.info(f"Password reset link for {user.email}: {reset_link} (Email sending is currently simulated)")
      # print(f"DEBUG: Password reset link for {user.email}: {reset_link}") # For local testing if email is not set up

      logger.info(f"Password reset link for {user.email}: {reset_link}")
      print(f"Password reset link for {user.email}: {reset_link}")
      return Response({'message': 'If an account with this email, a password reset link will be sent.', 'reset_link': reset_link}, status=200)
    except User.DoesNotExist:
      return Response({'message': 'If an account with this email exists, a password reset link has been sent.'}, status=200)
    except Exception as e:
      logger.error(f"Error sending password reset email: {e}", exc_info=True)
      return Response({'error': 'User with this email does not exist.'}, status=404)
  return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request, uidb64, token):
  serializer = SetNewPasswordSerializer(data=request.data, context={'uidb64': uidb64, 'token': token})
  if serializer.is_valid():
    user = serializer.validated_data['user']
    user.set_password(serializer.validated_data['password'])
    user.save()
    return Response({'message': 'Password has been reset successfully.'}, status=200)
  return Response(serializer.errors, status=400)
  

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user(request):
  user = request.user
  try:
    serializer = UserSerializer(
      user, 
      data=request.data, 
      partial=True
    )
    if serializer.is_valid():
      serializer.save()
      logger.info(f'Update profile {user.username} success')
      return Response(serializer.data, status=200)
    else:
      logger.error(f'Error update user {user.username}: {str(serializer.errors)}')
      return Response(serializer.errors, status=400)
  except Exception as e:
    logger.error(str(e))
    return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_network(request):
  user = request.user

  try:
    network_level = user.get_indirect_network()
    response_data = {
        'level_1': [],
        'level_2': []
    }

    if len(network_level) >= 1:
      response_data['level_1'] = UserNetworkSerializer(network_level[0], many=True).data
    if len(network_level) >= 2:
      response_data['level_2'] = UserNetworkSerializer(network_level[1], many=True).data

    return Response(response_data, status=200)
  except User.DoesNotExist(): 
    return Response({'error': 'User does not exist'}, status=400)
  except Exception as e:
    return Response({'Error getting network': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wallet(request):
  user = request.user
  try:
    wallet, _ = Wallet.objects.get_or_create(user=user)
    serializer = WalletSerializer(wallet)
    return Response(serializer.data, status=200)
  except Exception as e:
    return Response({'error': str(e)}, status=500)
  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_asset(request):
  user = request.user
  try:
    asset, _ = Asset.objects.get_or_create(user=user)
    serializer = AssetSerializer(asset)
    return Response(serializer.data, status=200)
  except Exception as e:
    return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profit_transaction(request):
  user = request.user
  try:
    profit_tx = Transaction.objects.filter(user=user, point_type='PROFIT')
    serializer = TransactionSerializer(profit_tx, many=True)
    return Response(serializer.data, status=200)
  except Transaction.DoesNotExist:
    return Response({'error': 'Profit Transaction not found'}, status=404)
  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_commission_transaction(request):
  user = request.user
  try:
    commission_tx = Transaction.objects.filter(user=user, point_type='COMMISSION')
    serializer = TransactionSerializer(commission_tx, many=True)
    return Response(serializer.data, status=200)
  except Transaction.DoesNotExist:
    return Response({'error': 'Commission Transaction not found'}, status=404)
  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transfer_transaction(request):
  user = request.user
  try:
    transfer_tx = Transaction.objects.filter(user=user, transaction_type='TRANSFER')
    serializer = TransactionSerializer(transfer_tx, many=True)
    return Response(serializer.data, status=200)
  except Transaction.DoesNotExist:
    return Response({'error': 'Transfer Transaction not found'}, status=404)
  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_convert_transaction(request):
  user = request.user
  try:
    convert_tx = Transaction.objects.filter(user=user, transaction_type__in=['CONVERT'])
    serializer = TransactionSerializer(convert_tx, many=True)
    return Response(serializer.data, status=200)
  except Transaction.DoesNotExist:
    return Response({'error': 'Convert Transaction not found'}, status=404)
  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profit_commission_wd_transaction(request):
  user = request.user
  try:
    profit_commission_wd_tx = Transaction.objects.filter(user=user, point_type__in=['PROFIT', 'COMMISSION'], transaction_type__in=['WITHDRAWAL'])
    serializer = TransactionSerializer(profit_commission_wd_tx, many=True)
    return Response(serializer.data, status=200)
  except Transaction.DoesNotExist:
    return Response({'error': 'Profit/Commission Withdrawal Transaction not found'}, status=404)
  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_asset_transaction(request):
  user = request.user
  try:
    asset_tx = Transaction.objects.filter(user=user, transaction_type__in=['ASSET_WITHDRAWAL', 'ASSET_PLACEMENT', 'WELCOME_BONUS'])
    serializer = TransactionSerializer(asset_tx, many=True)
    return Response(serializer.data, status=200)
  except Transaction.DoesNotExist:
    return Response({'error': 'Asset Transaction not found'}, status=404)

  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_deposit_lock(request):
  user = request.user
  try:
    deposit_lock = DepositLock.objects.filter(deposit__user=user, deposit__request_status__in=['APPROVED'])
    serializer = DepositLockSerializer(deposit_lock, many=True)
    return Response(serializer.data, status=200)
  except DepositLock.DoesNotExist:
    return Response({'error': 'Deposit lock not found'}, status=404)
  

## Wallet ##
  
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def transfer_master(request):
  sender = request.user
  receiver_username = request.data.get('receiver') # This should be the username of the receiver
  amount = request.data.get('amount')
  # Fetch the receiver User object
  try:
      receiver_user = User.objects.get(username=receiver_username)
  except User.DoesNotExist:
      return Response({'error': 'Receiver username does not exist'}, status=404)

  description = request.data.get('description', f'Transfer to {receiver_user.username}, {receiver_user.id}: {amount}')
  reference = request.data.get('reference', '')

  if not receiver_username or not amount:
    return Response({'error': 'Receiver ID and amount are required'}, status=400)
  try:
    amount = Decimal(amount)
  except:
    return Response({'error': 'Amount must be in number'}, status=400)

  try:
    sender_wallet, receiver_wallet = WalletService.transfer_master_point(
      sender,
      receiver_user,
      amount,
      description,
      reference
    )
    serializer = WalletSerializer([sender_wallet, receiver_wallet], many=True)
    return Response(serializer.data, status=200)
  except ValidationError as e:
    return Response({'error': str(e.detail)}, status=401)
  except Exception as e:
    return Response({'error': str(e)}, status=500)
  
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_asset(request):
  user = request.user
  amount = request.data.get('amount', '0.00')
  description = request.data.get('description', f'Asset Placement: {amount}')
  reference = request.data.get('reference', '')

  if not amount:
    return Response({'error': 'Amount is required'}, status=400)
  try:
    amount = Decimal(amount)
  except:
    return Response({'error': 'Amount must be in number'}, status=400)

  try:
    wallet, asset = WalletService.place_asset(
      user,
      amount,
      description,
      reference
    )
    serializer_wallet = WalletSerializer(wallet)
    serializer_asset = AssetSerializer(asset)
    return Response({
      'wallet': serializer_wallet.data,
      'asset': serializer_asset.data
    }, status=200)
  except ValidationError as e:
    return Response({'error': str(e.detail)}, status=401)
  except Exception as e:
    return Response({'error': str(e)}, status=500)
  

## Profit ##
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw_profit(request):
  user = request.user
  amount = request.data.get('amount', '0.00')
  reference = request.data.get('reference', f'Profit Withdrawal: {amount}')

  if not amount:
    return Response({'error': 'Amount is required'}, status=400)
  try:
    amount = Decimal(amount)
  except:
    return Response({'error': 'Amount must be in number'}, status=400)

  try:
    wallet, withdrawal_request  = ProfitService.request_withdrawal(
      user,
      amount,
      reference
    )
    serializer_wallet = WalletSerializer(wallet)
    serializer_withdrawal_request = WithdrawalRequestSerializer(withdrawal_request)
    return Response({
      'wallet': serializer_wallet.data,
      'withdrawal_request': serializer_withdrawal_request.data
    }, status=200)
  except ValidationError as e:
    return Response({'error': str(e.detail)}, status=401)
  except Exception as e:
    return Response({'error': str(e)}, status=500)
  
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def convert_profit_to_master(request):
  user = request.user
  amount = request.data.get('amount', '0.00')
  reference = request.data.get('reference', '')

  if not amount:
    return Response({'error': 'Amount is required'}, status=400)
  try:
    amount = Decimal(amount)
  except:
    return Response({'error': 'Amount must be in number'}, status=400)

  try:
    result = ProfitService.convert_to_master_point(
      user,
      amount,
      reference
    )
    serializer = WalletSerializer(result)
    return Response(serializer.data, status=200)
  except ValidationError as e:
    return Response({'error': str(e.detail)}, status=401)
  except Exception as e:
    return Response({'error': str(e)}, status=500)
  

## Commision ##
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw_commission(request):
  user = request.user
  amount = request.data.get('amount', '0.00')
  reference = request.data.get('reference', '')

  if not amount:
    return Response({'error': 'Amount is required'}, status=400)
  try:
    amount = Decimal(amount)
  except:
    return Response({'error': 'Amount must be in number'}, status=400)

  try:
    wallet, withdrawal_request = CommissionService.request_withdrawal(
      user,
      amount,
      reference
    )
    serializer_wallet = WalletSerializer(wallet)
    serializer_withdrawal_request = WithdrawalRequestSerializer(withdrawal_request)
    return Response({
      'wallet': serializer_wallet.data,
      'withdrawal_request': serializer_withdrawal_request.data
    }, status=200)
  except ValidationError as e:
    return Response({'error': str(e.detail)}, status=401)
  except Exception as e:
    return Response({'error': str(e)}, status=500)
  
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def convert_commission_to_master(request):
  user = request.user
  amount = request.data.get('amount', '0.00')
  reference = request.data.get('reference', '')

  if not amount:
    return Response({'error': 'Amount is required'}, status=400)
  try:
    amount = Decimal(amount)
  except: 
    return Response({'error': 'Amount must be in number'}, status=400)

  try:
    result = CommissionService.convert_to_master_point(
      user,
      amount,
      reference
    )
    serializer = WalletSerializer(result)
    return Response(serializer.data, status=200)
  except ValidationError as e:
    return Response({'error': str(e.detail)}, status=401)


## Asset ##
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw_asset(request):
  user = request.user
  amount = request.data.get('amount', '0.00')
  description = request.data.get('description', f'Asset Withdrawal: {amount}')
  reference = request.data.get('reference', '')

  if not amount:
    return Response({'error': 'Amount is required'}, status=400)
  try:
    amount = Decimal(amount)
  except:
    return Response({'error': 'Amount must be in number'}, status=400)

  try:
    result = AssetService.withdraw_asset(
      user,
      amount,
      description,
      reference
    )
    serializer = AssetSerializer(result)
    return Response(serializer.data, status=200)
  except ValidationError as e:
    return Response({'error': str(e.detail)}, status=401)
  except Exception as e:
    return Response({'error': str(e)}, status=500)
  

## Home ##
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_daily_total_profit(request):
  user = request.user
  try:
    today = timezone.localdate()
    transaction = Transaction.objects.filter(user=user, transaction_type__in=['DISTRIBUTION',
    'AFFILIATE_BONUS', 'INTRODUCER_BONUS'],
    created_at__date=today).values("transaction_type").annotate(
      total_amount=Sum("amount")
    )
    return Response(transaction, status=200)
  except Exception as e:
    return Response({'error': str(e)}, status=500)
  

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def promo_code(request):
  user = request.user
  code = request.data.get('code')

  try:
    if PromoCode.objects.filter(code=code).exists():
      return Response({'error': 'Promo code already used'}, status=400)
    if len(code) == 10 :
      serializer = PromoCodeSerializer(data=request.data)
      print(request.data)
      if serializer.is_valid():
        serializer.save(user=user)
        return Response(serializer.data, status=201)
      else: 
        return Response(serializer.errors, status=401)
    else:
      return Response({'error': 'Invalid promo code'}, status=400)
      
  except Exception as e:
    return Response({'error': str(e)}, status=500)