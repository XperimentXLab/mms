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
from django.db.models import Sum, Q
from django.db.models.functions import TruncDate
from rest_framework.pagination import PageNumberPagination
from datetime import datetime
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes #force_str
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Content, From, To
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
    logger.error(f"Invalid or expired refresh token: {e}")
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
    logger.error(f"Error retrieving user {user.username}: {str(e)}")
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
      logger.error(f"Error registering user {username}: {serializer.errors}")
      return Response({'error': serializer.errors}, status=400)
    
  except KeyError as e:
    logger.error(f"Missing required field during user registration: {e}")
    return Response({'error': str(e)}, 400)
  except ValidationError as e:
    logger.error(f"Validation error during user registration: {e}")
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
    error_msg = (
      e.args[0] if isinstance(e.args, (list, tuple)) else str(e)
    )
    return Response({'error': error_msg}, status=401)
    
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
      subject_ = 'Password Reset Requested'

      try:
        message = Mail(
          from_email=From('noreply@mmsventure.io', 'MMS Venture'),
          to_emails=To(email),
          subject=subject_,
        )

        # Create Content object
        # content = Content("text/plain", message_)
        # message.add_content(content)
        message.template_id = settings.TEMPLATE_ID
        message.dynamic_template_data = {
          'reset_link': reset_link
        }

        sg = SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        sg.send(message)
      except Exception as e:
        print(f'Error sending email: {e}')
        return Response({'error': 'Error sending email'}, status=500)

      logger.info(f"Password reset link for {user.email}: {reset_link}")
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
  logger.error(f"Error resetting password for user with uid {uidb64}: {serializer.errors}")
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
    logger.error(f'Error update user {user.username}: {str(e)}')
    return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_network(request):
  user = request.user

  try:
    network_level = user.get_indirect_network()
    all_network_users = []
    for level in network_level:
      all_network_users.extend(level)

    network_total = Asset.objects.filter(user__in=all_network_users).count()
    network_level_asset = Asset.objects.filter(user__in=all_network_users).aggregate(total_asset=Sum('amount'))

    response_data = {
      'level_1': [],
      'level_2': [],
      'level_3': [],
      'level_4': [],
      'level_5': [],
      'total_asset': network_level_asset['total_asset'] or 0,
      'total_user': network_total,
    }

    if len(network_level) >= 1:
      response_data['level_1'] = UserNetworkSerializer(network_level[0], many=True).data
    if len(network_level) >= 2:
      response_data['level_2'] = UserNetworkSerializer(network_level[1], many=True).data
    if len(network_level) >= 3:
      response_data['level_3'] = UserNetworkSerializer(network_level[2], many=True).data
    if len(network_level) >= 4:
      response_data['level_4'] = UserNetworkSerializer(network_level[3], many=True).data
    if len(network_level) >= 5:
      response_data['level_5'] = UserNetworkSerializer(network_level[4], many=True).data

    return Response(response_data, status=200)
  except User.DoesNotExist: 
    return Response({'error': 'User does not exist'}, status=400)
  except Exception as e:
    logger.error(f"Error retrieving user network for {user.username}: {str(e)}")
    return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wallet(request):
  user = request.user
  try:
    wallet, _ = Wallet.objects.get_or_create(user=user)
    serializer = WalletSerializer(wallet)
    return Response(serializer.data, status=200)
  except Exception as e:
    logger.error(f"Error retrieving wallet for {user.username}: {str(e)}")
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
    logger.error(f"Error retrieving asset for {user.username}: {str(e)}")
    return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profit_transaction(request):
  user = request.user
  try:
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    search = request.GET.get('search', '')
    status = request.GET.get('status')
    month = request.GET.get('month')
    year = request.GET.get('year')

    query = Q(user=user, point_type='PROFIT')
    if start_date:
      if end_date:
        query &= date_filter_q('created_at', start_date, end_date)
      else:
        query &= date_filter_q('created_at', start_date)
    if month and year:
      query &= Q(created_at__year=year, created_at__month=month)
    if search:
      query &= Q(description__icontains=search)
    if status:
      query &= Q(status=status)

    profit_tx = Transaction.objects.filter(query).order_by('-created_at')
    # 📄 Pagination
    paginator = PageNumberPagination()
    paginator.page_size = int(request.GET.get('page_size', 30))
    paginated_profit_tx = paginator.paginate_queryset(profit_tx, request)
    
    serializer = TransactionSerializer(paginated_profit_tx, many=True)
    return paginator.get_paginated_response(serializer.data)
  except Transaction.DoesNotExist:
    return Response({'error': 'Profit Transaction not found'}, status=404)
  except Exception as e:
    logger.error(f"Error retrieving profit transaction for {user.username}: {str(e)}")
    return Response({'error': str(e)}, status=500)
  

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_commission_transaction(request):
  user = request.user
  try:
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    month = request.GET.get('month')
    year = request.GET.get('year')

    query = Q(user=user, point_type='COMMISSION', transaction_type__in=['AFFILIATE_BONUS', 'INTRODUCER_BONUS', 'MIGRATION'])
    if start_date and end_date:
      query &= Q(created_at__date__range=[start_date, end_date])
    if month and year:
      query &= Q(created_at__year=year, created_at__month=month)

    commission_tx = Transaction.objects.filter(query).order_by('-created_at')

    # 📄 Pagination
    paginator = PageNumberPagination()
    paginator.page_size = int(request.GET.get('page_size', 30))
    paginated_commission_tx = paginator.paginate_queryset(commission_tx, request)
    
    serializer = TransactionSerializer(paginated_commission_tx, many=True)
    return paginator.get_paginated_response(serializer.data)
  except Transaction.DoesNotExist:
    return Response({'error': 'Commission Transaction not found'}, status=404)
  except Exception as e:
    logger.error(f"Error retrieving commission transaction for {user.username}: {str(e)}")
    return Response({'error': str(e)}, status=500)
  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_accumulate_commission_tx(request):
  user = request.user
  try:
    month = request.GET.get('month')
    year = request.GET.get('year')
    # Base queryset
    qs = Transaction.objects.filter(point_type='COMMISSION', user=user, transaction_type__in=['AFFILIATE_BONUS', 'INTRODUCER_BONUS', 'MIGRATION'])

    # Optional filtering by month and year
    if month and year:
      qs = qs.filter(created_at__month=month, created_at__year=year)

    daily_commission_tx = (
      qs
      .annotate(day=TruncDate('created_at'))  # Extract just the date part
      .values('day')  # Group by day
      .annotate(total=Sum('amount'))  # Sum amounts per day
      .order_by('-day')
    )

    return Response(list(daily_commission_tx), status=200)
  except Exception as e:
    logger.error(f"Error retrieving accumulated commission transaction for {user.username}: {str(e)}")
    return Response({'error': str(e)}, status=404)
  

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transfer_transaction(request):
  user = request.user
  try:
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    search = request.GET.get('search', '')
    status = request.GET.get('status')
    month = request.GET.get('month')
    year = request.GET.get('year')

    query = Q(user=user, transaction_type='TRANSFER')
    if start_date:
      if end_date:
        query &= date_filter_q('created_at', start_date, end_date)
      else:
        query &= date_filter_q('created_at', start_date)
    if month and year:
      query &= Q(created_at__year=year, created_at__month=month)
    if search:
      query &= Q(description__icontains=search)
    if status:
      query &= Q(status=status)

    transfer_tx = Transaction.objects.filter(query).order_by('-created_at')
    # 📄 Pagination
    paginator = PageNumberPagination()
    paginator.page_size = int(request.GET.get('page_size', 30))
    paginated_transfer_tx = paginator.paginate_queryset(transfer_tx, request)

    serializer = TransactionSerializer(paginated_transfer_tx, many=True)
    return paginator.get_paginated_response(serializer.data)
  except Transaction.DoesNotExist:
    return Response({'error': 'Transfer Transaction not found'}, status=404)
  except Exception as e:
    logger.error(f"Error retrieving transfer transaction for {user.username}: {str(e)}")
    return Response({'error': str(e)}, status=500)
  

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_convert_transaction(request):
  user = request.user
  try:
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    search = request.GET.get('search', '')
    status = request.GET.get('status')
    month = request.GET.get('month')
    year = request.GET.get('year')

    query = Q(user=user, transaction_type='CONVERT')
    if start_date:
      if end_date:
        query &= date_filter_q('created_at', start_date, end_date)
      else:
        query &= date_filter_q('created_at', start_date)
    if month and year:
      query &= Q(created_at__year=year, created_at__month=month)
    if search:
      query &= Q(description__icontains=search)
    if status:
      query &= Q(status=status)

    convert_tx = Transaction.objects.filter(query).order_by('-created_at')
    # 📄 Pagination
    paginator = PageNumberPagination()
    paginator.page_size = int(request.GET.get('page_size', 30))
    paginated_convert_tx = paginator.paginate_queryset(convert_tx, request)

    serializer = TransactionSerializer(paginated_convert_tx, many=True)
    return paginator.get_paginated_response(serializer.data)
  except Transaction.DoesNotExist:
    return Response({'error': 'Convert Transaction not found'}, status=404)
  except Exception as e:
    logger.error(f"Error retrieving convert transaction for {user.username}: {str(e)}")
    return Response({'error': str(e)}, status=500)
  
  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profit_commission_wd_transaction(request):
  user = request.user
  try:
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    search = request.GET.get('search', '')
    status = request.GET.get('status')
    month = request.GET.get('month')
    year = request.GET.get('year')

    query = Q(user=user, point_type__in=['PROFIT', 'COMMISSION'], transaction_type__in=['WITHDRAWAL'])
    if start_date:
      if end_date:
        query &= date_filter_q('created_at', start_date, end_date)
      else:
        query &= date_filter_q('created_at', start_date)
    if month and year:
      query &= Q(created_at__year=year, created_at__month=month)
    if search:
      query &= Q(description__icontains=search)
    if status:
      query &= Q(status=status)

    profit_commission_wd_tx = Transaction.objects.filter(query).order_by('-created_at')
    # 📄 Pagination
    paginator = PageNumberPagination()
    paginator.page_size = int(request.GET.get('page_size', 30))
    paginated_profit_commission_wd_tx = paginator.paginate_queryset(profit_commission_wd_tx, request)

    serializer = TransactionSerializer(paginated_profit_commission_wd_tx, many=True)
    return paginator.get_paginated_response(serializer.data)

  except Transaction.DoesNotExist:
    return Response({'error': 'Profit/Commission Withdrawal Transaction not found'}, status=404)
  except Exception as e:
    logger.error(f"Error retrieving profit/commission withdrawal transaction for {user.username}: {str(e)}")
    return Response({'error': str(e)}, status=500)
  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_asset_transaction(request):
  user = request.user
  try:
    
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    search = request.GET.get('search', '')
    status = request.GET.get('status')
    month = request.GET.get('month')
    year = request.GET.get('year')

    query = Q(user=user, transaction_type__in=['ASSET_WITHDRAWAL', 'ASSET_PLACEMENT', 'WELCOME_BONUS'])
    if start_date:
      if end_date:
        query &= date_filter_q('created_at', start_date, end_date)
      else:
        query &= date_filter_q('created_at', start_date)
    if month and year:
      query &= Q(created_at__year=year, created_at__month=month)
    if search:
      query &= Q(description__icontains=search)
    if status:
      query &= Q(status=status)

    asset_tx = Transaction.objects.filter(query).order_by('-created_at')
    # 📄 Pagination
    paginator = PageNumberPagination()
    paginator.page_size = int(request.GET.get('page_size', 30))
    paginated_asset_tx = paginator.paginate_queryset(asset_tx, request)

    serializer = TransactionSerializer(paginated_asset_tx, many=True)
    return paginator.get_paginated_response(serializer.data)
  except Transaction.DoesNotExist:
    return Response({'error': 'Asset Transaction not found'}, status=404)
  except Exception as e:
    logger.error(f"Error retrieving asset transaction for {user.username}: {str(e)}")
    return Response({'error': str(e)}, status=500)

  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_deposit_lock(request):
  user = request.user
  try:

    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    search = request.GET.get('search', '')
    status = request.GET.get('status')
    month = request.GET.get('month')
    year = request.GET.get('year')

    query = Q(deposit__user=user, deposit__request_status__in=['APPROVED'])
    if start_date:
      if end_date:
        query &= date_filter_q('created_at', start_date, end_date)
      else:
        query &= date_filter_q('created_at', start_date)
    if month and year:
      query &= Q(created_at__year=year, created_at__month=month)
    if search:
      query &= Q(description__icontains=search)
    if status:
      query &= Q(status=status)

    deposit_lock = DepositLock.objects.filter(query).order_by('-created_at')
    # 📄 Pagination
    paginator = PageNumberPagination()
    paginator.page_size = int(request.GET.get('page_size', 30))
    paginated_deposit_lock = paginator.paginate_queryset(deposit_lock, request)

    serializer = DepositLockSerializer(paginated_deposit_lock, many=True)
    return paginator.get_paginated_response(serializer.data)
  except DepositLock.DoesNotExist:
    return Response({'error': 'Deposit lock not found'}, status=404)
  except Exception as e:
    logger.error(f"Error retrieving deposit lock for {user.username}: {str(e)}")
    return Response({'error': str(e)}, status=500)
  

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
    return Response({'error': 'Receiver username and amount are required'}, status=400)
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
    error_msg = (
      e.args[0] if isinstance(e.args, (list, tuple)) else str(e)
    )
    return Response({'error': error_msg}, status=401)
    
  except Exception as e:
    logger.error(f"Error retrieving transfer transaction for {sender} to {receiver_user}: {str(e)}")
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
    error_msg = (
      e.args[0] if isinstance(e.args, (list, tuple)) else str(e)
    )
    return Response({'error': error_msg}, status=401)
    
  except Exception as e:
    logger.error(f"Error placing asset for {user.username}: {str(e)}")
    return Response({'error': str(e)}, status=500)
  

## Profit ##
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw_profit(request):
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
    withdrawal_request, wallet = ProfitService.request_withdrawal(
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
    error_msg = (
      e.args[0] if isinstance(e.args, (list, tuple)) else str(e)
    )
    return Response({'error': error_msg}, status=401)
    
  except Exception as e:
    logger.error(f"Error withdrawing profit for {user.username}: {str(e)}")
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
    error_msg = (
      e.args[0] if isinstance(e.args, (list, tuple)) else str(e)
    )
    return Response({'error': error_msg}, status=401)
    
  except Exception as e:
    logger.error(f"Error converting profit to master for {user.username}: {str(e)}")
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
    withdrawal_request, wallet = CommissionService.request_withdrawal(
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
    error_msg = (
      e.args[0] if isinstance(e.args, (list, tuple)) else str(e)
    )
    return Response({'error': error_msg}, status=401)
    
  except Exception as e:
    logger.error(f"Error withdrawing commission for {user.username}: {str(e)}")
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
    error_msg = (
      e.args[0] if isinstance(e.args, (list, tuple)) else str(e)
    )
    logger.error(f"Error converting commission to master for {user.username}: {str(e)}")
    return Response({'error': error_msg}, status=401)
    


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
    error_msg = (
      e.args[0] if isinstance(e.args, (list, tuple)) else str(e)
    )
    return Response({'error': error_msg}, status=401)
    
  except Exception as e:
    logger.error(f"Error withdrawing asset for {user.username}: {str(e)}")
    return Response({'error': str(e)}, status=500)
  

## Home ##
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_daily_total_profit(request):
  user = request.user
  try:
    today = timezone.localdate()
    start_date = request.GET.get('start_date', today)
    end_date = request.GET.get('end_date', today)

    transaction = Transaction.objects.filter(user=user, transaction_type__in=['DISTRIBUTION',
    'AFFILIATE_BONUS', 'INTRODUCER_BONUS'],
    created_at__date__range=[start_date, end_date]).values("transaction_type").annotate(
      total_amount=Sum("amount")
    )
    return Response(transaction, status=200)
  except Exception as e:
    logger.error(f"Error retrieving daily total profit for {user.username}: {str(e)}")
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
    logger.error(f"Error applying promo code for {user.username}: {str(e)}")
    return Response({'error': str(e)}, status=500)