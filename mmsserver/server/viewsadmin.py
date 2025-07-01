from .models import *
from .serializers import *
from .utils import *
from django.conf import settings
import requests
from decimal import Decimal
from rest_framework.authentication import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.contrib.auth.tokens import default_token_generator


@api_view(['POST'])
@permission_classes([AllowAny])
def login_admin(request):
  username = request.data.get('username')
  password = request.data.get('password')
  user = authenticate(request, username=username, password=password)

  try:
    if user.is_staff:
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
      response = Response({'message': 'Login successful'})
      response.set_cookie(
        key='access_token',
        value=str(refresh.access_token),
        httponly=True,
        secure=True,
        samesite='None',
        path='/'
      )
      response.set_cookie(
        key='refresh_token',
        value=str(refresh),
        httponly=True,
        secure=True,
        samesite='None',
        path='/'
      )
      return response
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    return Response({'error': f'Invalid credentials or {str(e)}' }, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_all_wallet_balances(request):
    """
    Admin-only reset all wallet point balances to zero.
    """
    user = request.user
    try:
      if user.is_staff:
        wallets = Wallet.objects.all()
        current_time = timezone.now()

        for wallet in wallets:
          wallet.master_point_balance = Decimal('0.00')
          wallet.profit_point_balance = Decimal('0.00')
          wallet.affiliate_point_balance = Decimal('0.00')
          wallet.introducer_point_balance = Decimal('0.00')
          wallet.updated_at = current_time

        with db_transaction.atomic():
            Wallet.objects.bulk_update(
              wallets,
              [
                'master_point_balance',
                'profit_point_balance',
                'affiliate_point_balance',
                'introducer_point_balance',
                'updated_at'
              ]
            )

        return Response(f"Reset successful for {wallets.count()} wallets.")
      else:
        return Response({'error': 'Permission denied'}, status=403)

    except Exception as e:
        return Response({"error": str(e)}, status=500)
      


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def manage_admin_mp(request):
  user = request.user 
      
  try:
    if user.is_staff:
      if request.method == 'GET':
        wallet, created = Wallet.objects.get_or_create(user=user)
        serializer = WalletSerializer(wallet)
        return Response(serializer.data, status=200)
      elif request.method == 'PUT':
        if user.is_superuser:
          wallet = Wallet.objects.get(user=user)
          serializer = WalletSerializer(wallet, data=request.data)
          if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=200)
          else:
            return Response({'error': serializer.errors}, status=400)
        else:
          return Response({'error': 'Only super can access'}, status=403)
      else:
        return Response({'error': 'Method not allowed'}, status=405)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except ValidationError as e:
    return Response({'error': list(e.messages)}, status=400)
  except Exception as e:
    return Response({'error': str(e)}, status=500)
  

@api_view(['GET', 'PUT', 'POST'])
@permission_classes([IsAuthenticated])
def manage_operational_profit(request):
  user = request.user       
  month = request.query_params.get('active_month_profit')
  year = request.query_params.get('active_year_profit')
  month_ = request.data.get('active_month_profit')
  year_ = request.data.get('active_year_profit')
  daily = request.data.get('daily_profit_rate')

  try:
    if request.method == 'GET':
      try:
        operational_profit = OperationalProfit.objects.get(active_month_profit=month, active_year_profit=year)
      except OperationalProfit.DoesNotExist:
        return Response({'error': 'Operational profit not found'}, status=404)
      serializer = OperationalProfitSerializer(operational_profit)
      return Response(serializer.data, status=200)
    
    if user.is_staff:
      if request.method == 'POST':
        if OperationalProfit.objects.filter(active_month_profit=month, active_year_profit=year).exists():
          return Response({'error': 'Operational profit record already exists.'}, status=400)
        serializer = OperationalProfitSerializer(data=request.data)
        if serializer.is_valid(): 
          serializer.save()
          return Response(serializer.data, status=201)
        else:
          return Response({'error': serializer.errors}, status=400)
        
      elif request.method == 'PUT': 
        operational_profit, created = OperationalProfit.objects.get_or_create(active_month_profit=month_, active_year_profit=year_)
        serializer = OperationalProfitSerializer(operational_profit, data=request.data, partial=True)
        if serializer.is_valid():
          serializer.save()
          return Response(serializer.data, status=200)
        else:
          return Response({'error': serializer.errors}, status=400)
      else:
        return Response({'error': 'Method not allowed'}, status=405)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    return Response({'error': str(e)}, status=500)


@api_view(['GET', 'PUT', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_monthly_finalized_profit(request):
  user = request.user
  month = request.data.get('month')
  year_ = request.data.get('year')
  year = request.query_params.get('year')  # Use query_params for GET requests

  try:
    
    if request.method == 'GET':
      queryset = MonthlyFinalizedProfit.objects.all()
      year_filter = None
      if year:
        try:
          year_filter = int(year)
          queryset = queryset.filter(year=year_filter)
        except ValueError:
          return Response({'error': 'Year query parameter must be an integer.'}, status=400)   
      else:
        queryset = MonthlyFinalizedProfit.objects.all()   
      queryset = queryset.order_by('year', 'month') 
      serializer = MonthlyFinalizedProfitSerializer(queryset, many=True)
      return Response(serializer.data, status=200)

    if user.is_staff:
      if request.method == 'POST':
        serializer = MonthlyFinalizedProfitSerializer(data=request.data)
        if serializer.is_valid():
          if MonthlyFinalizedProfit.objects.filter(month=month, year=year_).exists():
            return Response({'error': 'Profit record already exists.'}, status=409)
          serializer.save()
          return Response(serializer.data, status=201)
        else:
          return Response({'error': serializer.errors}, status=400)
      elif request.method == 'PUT':
        if not year_ or not month:
          return Response({'error': 'Month and year are required.'}, status=400)
        try:
          instance, created = MonthlyFinalizedProfit.objects.get_or_create(month=month, year=year_)
        except MonthlyFinalizedProfit.DoesNotExist:
          return Response({'error': 'Profit record not found.'}, status=404)

        serializer = MonthlyFinalizedProfitSerializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
          serializer.save()
          return Response(serializer.data, status=200)
        else:
          return Response({'error': serializer.errors}, status=400)
      elif request.method == 'DELETE':
        if not year or not month:
          return Response({'error': 'Month and year are required.'}, status=400)
        try:
          instance= MonthlyFinalizedProfit.objects.get(month=month, year=year_)
          instance.delete()
          return Response(status=204)
        except MonthlyFinalizedProfit.DoesNotExist:
          return Response({'error': 'Profit record not found.'}, status=404)
      else:
        return Response({'error': 'Method not allowed'}, status=405)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    return Response({'error': str(e)}, status=500)
  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_yearly_profit_total(request):
    # year = request.data.get('year') # Old way for POST-like GET
    year_str = request.query_params.get('year') # Correct way for GET
    if not year_str:
        return Response({'error': 'Year query parameter is required.'}, status=400)
    try:
        year = int(year_str)
    except ValueError:
        return Response({'error': 'Year must be an integer.'}, status=400)

    # Add permission check if necessary, e.g., if only staff can see this
    # if not request.user.is_staff:
    #     return Response({'error': 'Permission denied'}, status=403)

    if year: # year is now an int
      total = MonthlyFinalizedProfit.get_total_yearly_profit(year)
      return Response({'year': year, 'total_profit_rate': float(total)})
    else:
      # This case should ideally be caught by the 'not year_str' check above
      return Response({'error': 'Error getting yearly total profit, year parameter missing or invalid.'}, status=400)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_user(request):
  user = request.user
  try:
    if user.is_staff:
      all_user = User.objects.all()
      serializer = UserSerializer(all_user, many=True)
      return Response(serializer.data, status=200) 
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    return Response({'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_network(request):
  user = request.user
  try:
    if user.is_staff:
      all_network = user.get_all_network(include_self=True)
      serializer = UserNetworkSerializer(all_network, many=True)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    return Response({'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_transaction(request):
  user = request.user
  try:
    if user.is_staff:
      all_transaction = Transaction.objects.all()
      serializer= TransactionSerializer(all_transaction, many=True)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    return Response({'error': str(e)}, status=400)
  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_transaction(request):
  user = request.user
  try:
    if user.is_staff:
      pending_transaction = Transaction.objects.filter(request_status='PENDING')
      serializer= TransactionSerializer(pending_transaction, many=True)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    return Response({'error': str(e)}, status=400)
  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_withdrawal_request(request):
  user = request.user
  try:
    if user.is_staff:
      all_withdrawal_request = WithdrawalRequest.objects.all()
      serializer = WithdrawalRequestSerializer(all_withdrawal_request, many=True)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    return Response({'error': str(e)}, status=400)
  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_deposit_lock(request):
  user = request.user
  try:
    if user.is_staff:
      all_deposit_lock = DepositLock.objects.all()
      serializer = DepositLockSerializer(all_deposit_lock, many=True)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    return Response({'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_total_asset_balance(request):
  user = request.user
  try:
    if user.is_staff:
      total_balance = Asset.objects.aggregate(total=models.Sum('amount'))['total'] or 0
      return Response({'Total Asset Balance': float(total_balance)}, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    return Response({'error': str(e)}, status=400)
  

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def setup_user(request):
  user = request.user
  user_id = request.data.get('user_id')
  username = request.data.get('username')
  master_amount = request.data.get('master_amount')
  profit_amount = request.data.get('profit_amount')
  affiliate_amount = request.data.get('affiliate_amount')

  if user.is_staff:
    if not user_id or not username:
      return Response({'error': 'User ID and username are required'}, status=400)
    
    try:
      user = User.objects.get(id=user_id, username=username)
    except User.DoesNotExist:
      return Response({'error': 'User not found'}, status=404)
    
    try:
      wallet = UserService.setup_user(user_id, master_amount, profit_amount, affiliate_amount)
      serializer = WalletSerializer(wallet)
      return Response(serializer.data, status=200)
    except ValidationError as e:
      return Response({'error': list(e.messages)}, status=400)
    except Exception as e:
      return Response({'error': str(e)}, status=500)
  else:
    return Response({'error': 'Permission denied'}, status=403)
      

  

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profit_sharing (request):
  user = request.user
  amount = request.data.get('amount')
  if not amount:
    return Response({'error': 'Amount is required'}, status=400)
  try:
    if user.is_staff:
      userSuper = User.objects.get(is_superuser=True)
      wallet, created = Wallet.objects.get_or_create(user=userSuper)
      wallet.profit_point_balance += Decimal(amount)
      wallet.save()
      Transaction.objects.create(
        user=userSuper,
        wallet=wallet,
        transaction_type='SHARING_PROFIT',
        point_type='PROFIT',
        amount=amount,
        description=f"SHARING PROFIT: {amount}",
        reference=f"SHARING PROFIT - {amount}"
      )
      serializer = WalletSerializer(wallet, data=request.data, partial=True)
      if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=200)
      else:
        return Response(serializer.errors, status=401)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    return Response({'error': str(e)}, status=500)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def distribute_profit(request):
  """
  Admin manually triggers profit distribution.
  """
  user = request.user

  try:
    if user.is_staff:
        result = distribute_profit_manually()
        return Response(result, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except ValidationError as e:
    return Response({'error': list(e.messages)}, status=400)
  except Exception as e:
    return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def grant_free_campro(request):
  user = request.user
  user_id = request.data.get('user_id')
  try:
    if user.is_staff:
      result = grant_free_campro(user_id)
      serializer = TransactionSerializer(result)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except ValidationError as e:
    return Response({'error': list(e.messages)}, status=400)
  except Exception as e:
    return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_place_asset(request):
  user = request.user
  transaction_id = request.data.get('transaction_id')
  action = request.data.get('action')

  if not transaction_id or not action:
    return Response({'error': 'Transaction ID and action are required'}, status=400)

  try:
    if user.is_staff:
      result = WalletService.process_place_asset(transaction_id, action)
      serializer = TransactionSerializer(result)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except ValidationError as e:
    return Response({'error': list(e.messages)}, status=400)
  except Exception as e:
    return Response({'error': str(e)}, status=500)
  

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_withdrawal_asset(request):
  user = request.user
  transaction_id = request.data.get('transaction_id')
  action = request.data.get('action')

  if not transaction_id and not action:
    return Response({'error': 'Transaction ID and action are required'}, status=400)

  try:
    if user.is_staff:
      result = AssetService.process_withdrawal_request(transaction_id, action)
      serializer = TransactionSerializer(result)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except ValidationError as e:
    return Response({'error': list(e.messages)}, status=400)
  except Exception as e:
    return Response({'error': str(e)}, status=500)
  

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_withdrawal_profit(request):
  user = request.user
  transaction_id = request.data.get('transaction_id')
  action = request.data.get('action')

  if not transaction_id and not action:
    return Response({'error': 'Transaction ID and action are required'}, status=400)

  try:
    if user.is_staff:
      result = ProfitService.process_withdrawal_request(transaction_id, action)
      serializer = TransactionSerializer(result)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except ValidationError as e:
    return Response({'error': list(e.messages)}, status=400)
  except Exception as e:
    return Response({'error': str(e)}, status=500)
  

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_withdrawal_commission(request):
  user = request.user
  request_id = request.data.get('request_id')
  action = request.data.get('action')

  if not request_id and not action:
    return Response({'error': 'Transaction ID and action are required'}, status=400)

  try:
    if user.is_staff:
      result = CommissionService.process_withdrawal_request(request_id, action)
      serializer = WithdrawalRequestSerializer(result)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except ValidationError as e:
    return Response({'error': list(e.messages)}, status=400)
  except Exception as e:
    return Response({'error': str(e)}, status=500)
  

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_verification(request):
  user = request.user
  user_id = request.data.get('user_id')
  action = request.data.get('action')
  reject_reason = request.data.get('reject_reason')

  user_ = User.objects.get(id=user_id)
  try:
    if user.is_staff:
      if action == 'Approve':
        user_.verification_status = 'APPROVED'
      elif action == 'Reject':
        user_.verification_status = 'REJECTED'
        user_.reject_reason = reject_reason
      else:
        return Response({'error': 'Invalid action'}, status=400)
      user_.save()
      serializer = UserSerializer(user_)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    return Response({'error': str(e)}, status=500)

