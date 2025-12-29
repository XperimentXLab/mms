from .models import *
from .serializers import *
from .utils import *
import calendar
from decimal import Decimal
from rest_framework.authentication import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Sum, Q
from django.db.models.functions import TruncDate
from rest_framework.pagination import PageNumberPagination
from datetime import datetime
import stripe
from django.conf import settings

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
      return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
      })
    else:
      logger.error(f"Error logging in for {username}")
      return Response({'error': 'Invalid credentials'}, status=400)
  except Exception as e:
    logger.error(f"Error logging in for {username}")
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
    logger.error(f"Error resetting wallet balances: {str(e)}")
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
    logger.error(f"Validation error managing admin MP: {str(e)}")
    return Response({'error': list(e.messages)}, status=400)
  except Exception as e:
    logger.error(f"Error managing admin RP: {str(e)}")
    return Response({'error': str(e)}, status=500)
  

@api_view(['GET', 'PUT', 'POST'])
@permission_classes([IsAuthenticated])
def manage_operational_profit(request):
  user = request.user       
  day = request.query_params.get('active_day_profit')
  month = request.query_params.get('active_month_profit')
  year = request.query_params.get('active_year_profit')

  day_ = request.data.get('active_day_profit')
  month_ = request.data.get('active_month_profit')
  year_ = request.data.get('active_year_profit')

  try:
    if request.method == 'GET':
      try:
        operational_profit = OperationalProfit.objects.get(active_day_profit=day, active_month_profit=month, active_year_profit=year)
      except OperationalProfit.DoesNotExist:
        return Response({'error': 'Operational profit not found'}, status=404)
      serializer = OperationalProfitSerializer(operational_profit)
      return Response(serializer.data, status=200)
    
    if user.is_staff:
      if request.method == 'POST':
        if OperationalProfit.objects.filter(active_day_profit=day,active_month_profit=month, active_year_profit=year).exists():
          return Response({'error': 'Operational profit record already exists.'}, status=400)
        serializer = OperationalProfitSerializer(data=request.data)
        if serializer.is_valid(): 
          serializer.save()
          return Response(serializer.data, status=201)
        else:
          return Response({'error': serializer.errors}, status=400)
        
      elif request.method == 'PUT': 
        operational_profit, created = OperationalProfit.objects.get_or_create(active_day_profit=day_,active_month_profit=month_, active_year_profit=year_)
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
    logger.error(f"Error managing operational profit: {str(e)}")
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
    logger.error(f"Error managing monthly finalized profit: {str(e)}")
    return Response({'error': str(e)}, status=500)
  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_yearly_profit_total(request):
  user = request.user
  year_str = request.query_params.get('year')
  try:
    if user.is_staff:
      if not year_str:
          return Response({'error': 'Year query parameter is required.'}, status=400)
      try:
          year = int(year_str)
      except ValueError:
          return Response({'error': 'Year must be an integer.'}, status=400)

      if year: 
        total = MonthlyFinalizedProfit.get_total_yearly_profit(year)
        return Response({'year': year, 'total_profit_rate': float(total)})
      else:
        return Response({'error': 'Error getting yearly total profit.'}, status=400)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    logger.error(f"Error getting yearly total profit: {str(e)}")
    return Response({'error': str(e)}, status=500)
    
 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_user(request):
  user = request.user
  try:
    if user.is_staff:
      search_query = request.GET.get('search', '')
      status_query = request.GET.get('status', None)
      is_campro_query = request.GET.get('is_campro', None)
      sort_by = request.GET.get('sort_by', 'created_at')
      order = request.GET.get('order', 'desc')
      start_date = request.GET.get('start_date', None)
      end_date = request.GET.get('end_date', None)

      query = Q()
      if search_query:
        query &= Q(id__icontains=search_query) | Q(username__icontains=search_query) | Q(email__icontains=search_query) | Q(ic__icontains=search_query) | Q(referred_by__icontains=search_query) | Q(first_name__icontains=search_query) | Q(last_name__icontains=search_query)
      if start_date and end_date:
          query &= date_filter_q('created_at', start_date, end_date)
      if status_query:
        query &= Q(verification_status__icontains=status_query)
      if is_campro_query:
        if is_campro_query.lower() == 'true':
          is_campro_query = True
        elif is_campro_query.lower() == 'false':
          is_campro_query = False
        query &= Q(is_campro=is_campro_query)

        # Sorting logic
      if sort_by == 'created_datetime':
        sort_by = 'created_at'
      if sort_by == 'asset_amount':
        sort_by = 'asset__amount'
      if sort_by == 'master_point':
        sort_by = 'wallet__master_point_balance'
      if sort_by == 'profit_point':
        sort_by = 'wallet__profit_point_balance'

      allowed_sort_fields = ['created_at', 'id', 'username', 'email', 'reffered_by', 'ic', 'asset__amount', 'wallet__master_point_balance', 'wallet__profit_point_balance']
      if sort_by not in allowed_sort_fields:
        sort_by = 'created_at'  # fallback to safe default

      sort_prefix = '' if order == 'asc' else '-'
      all_user = User.objects.filter(query).order_by(f'{sort_prefix}{sort_by}').distinct()

      # 📄 Pagination
      paginator = PageNumberPagination()
      paginator.page_size = int(request.GET.get('page_size', 30))
      paginated_all_user = paginator.paginate_queryset(all_user, request)

      serializer = UserSerializer(paginated_all_user, many=True)
      return paginator.get_paginated_response(serializer.data)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    logger.error(f"Error retrieving all users: {str(e)}")
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
    logger.error(f"Error retrieving all network: {str(e)}")
    return Response({'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_transaction(request):
  user = request.user
  
  try:
    if user.is_staff:
      # 🔍 
      search_query = request.GET.get('search', '')
      status_filter = request.GET.get('status', None)
      transaction_type_filter = request.GET.get('transaction_type', None)
      point_type_filter = request.GET.get('point_type', None)
      start_date = request.GET.get('start_date', None)
      end_date = request.GET.get('end_date', None)
      month = request.GET.get('month')
      year = request.GET.get('year')

      
      query = Q()
      if search_query:
        query &= Q(user__id__icontains=search_query) | Q(user__username__icontains=search_query)
      
      if status_filter:
        query &= Q(request_status__icontains=status_filter)

      if transaction_type_filter:
        query &= Q(transaction_type__icontains=transaction_type_filter)

      if point_type_filter:
        query &= Q(point_type__icontains=point_type_filter)

      if month and year:
        start_date = make_aware(datetime(int(year), int(month), 1))
        last_day = calendar.monthrange(int(year), int(month))[1]
        end_date = make_aware(datetime(int(year), int(month), last_day, 23, 59, 59))

      # ✅ Fallback: last 30 days if no valid range_type
      else:
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)

      # Apply date filter
      query &= date_filter_q('created_at', start_date, end_date)


      transactions = Transaction.objects.filter(query).order_by('-created_at')

      # 📄 Pagination
      paginator = PageNumberPagination()
      paginator.page_size = int(request.GET.get('page_size', 30))
      paginated_transactions = paginator.paginate_queryset(transactions, request)

      serializer = TransactionSerializer(paginated_transactions, many=True)
      return paginator.get_paginated_response(serializer.data)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    logger.error(f"Error retrieving all transactions: {str(e)}")
    return Response({'error': str(e)}, status=400)
  

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_transaction(request):
  user = request.user
  try:
    if user.is_staff:
      pending_transaction = Transaction.objects.filter(request_status='PENDING', transaction_type__in=['ASSET_PLACEMENT'])
      serializer= TransactionSerializer(pending_transaction, many=True)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    logger.error(f"Error retrieving pending transactions: {str(e)}")
    return Response({'error': str(e)}, status=400)
  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_withdrawal_request(request):
  user = request.user
  try:
    if user.is_staff:

      search_query = request.GET.get('search', '')
      status_filter = request.GET.get('status', None)
      start_date = request.GET.get('start_date', None)
      end_date = request.GET.get('end_date', None)
      month = request.GET.get('month')
      year = request.GET.get('year')

      query = Q()

      if search_query:
        query &= Q(transaction__user__id__icontains=search_query) | Q(transaction__user__username__icontains=search_query)
      if status_filter:
        query &= Q(transaction__request_status__icontains=status_filter)
      if start_date:
        if end_date:
          query &= date_filter_q('created_at', start_date, end_date)
        else:
          query &= date_filter_q('created_at', start_date)
      if month and year:
        query &= Q(created_at__year=year, created_at__month=month)

      all_withdrawal_request = WithdrawalRequest.objects.filter(query).order_by('-created_at')
      serializer = WithdrawalRequestSerializer(all_withdrawal_request, many=True)

      total_actual_wd = WithdrawalRequest.objects.filter(query).aggregate(
        total=models.Sum('actual_amount'))['total'] or 0

      return Response({
        'results': serializer.data,
        'total_actual_wd': total_actual_wd
      }, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    logger.error(f"Error retrieving all withdrawal requests: {str(e)}")
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
    logger.error(f"Error retrieving all deposit locks: {str(e)}")
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
    logger.error(f"Error retrieving total asset balance: {str(e)}")
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
      logger.error(f"Validation error setting up user {username}: {str(e)}")
      return Response({'error': list(e.messages)}, status=400)
    except Exception as e:
      logger.error(f"Error setting up user {username}: {str(e)}")
      return Response({'error': str(e)}, status=500)
  else:
    return Response({'error': 'Permission denied'}, status=403)
  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
  user = request.user
  user_id = request.query_params.get('user_id')

  try:
    if user.is_staff:
      get_user = User.objects.get(id=user_id)
      serializer = UserSerializer(get_user)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except User.DoesNotExist:
    return Response({'error': 'User not found'}, status=404)
  except Exception as e:
    logger.error(f"Error retrieving user info for {user_id}: {str(e)}")
    return Response({'error': str(e)}, status=500)
  
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_info(request):
  user = request.user
  user_id = request.data.get('user_id')

  try:
    if user.is_staff:
      updated_user = User.objects.get(id=user_id)
      serializer = UserSerializer(updated_user, data=request.data, partial=True)
      if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=200)
      else:
        return Response(serializer.errors, status=400)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    logger.error(f"Error updating user info for {user_id}: {str(e)}")
    return Response({'error': str(e)}, status=500)

  
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profit_sharing(request):
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
    logger.error(f"Error updating profit sharing: {str(e)}")
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
    logger.error(f"Validation error distributing profit: {str(e)}")
    return Response({'error': list(e.messages)}, status=400)
  except Exception as e:
    logger.error(f"Error distributing profit: {str(e)}")
    return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def grant_welcome_bonus(request):
  user = request.user
  user_id = request.data.get('user_id')
  try:
    if user.is_staff:
      result = AssetService.grant_free_campro(user_id)
      serializer = TransactionSerializer(result)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except ValidationError as e:
    logger.error(f"Validation error granting welcome bonus: {str(e)}")
    return Response({'error': list(e.messages)}, status=400)
  except Exception as e:
    logger.error(f"Error granting welcome bonus: {str(e)}")
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
    logger.error(f"Validation error processing place asset: {str(e)}")
    return Response({'error': list(e.messages)}, status=400)
  except Exception as e:
    logger.error(f"Error processing place asset: {str(e)}")
    return Response({'error': str(e)}, status=500)
  

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_withdrawal_asset(request):
  user = request.user
  transaction_id = request.data.get('transaction_id')
  action = request.data.get('action')
  reference = request.data.get('reference', 'Asset Withdrawal')

  if not transaction_id and not action:
    return Response({'error': 'Transaction ID and action are required'}, status=400)

  try:
    if user.is_staff:
      result = AssetService.process_withdrawal_request(transaction_id, action, reference)
      serializer = TransactionSerializer(result)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except ValidationError as e:
    logger.error(f"Validation error processing withdrawal asset: {str(e)}")
    return Response({'error': list(e.messages)}, status=400)
  except Exception as e:
    logger.error(f"Error processing withdrawal asset: {str(e)}")
    return Response({'error': str(e)}, status=500)
  

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_withdrawal_profit(request):
  user = request.user
  transaction_id = request.data.get('transaction_id')
  action = request.data.get('action')
  reference = request.data.get('reference')

  if not transaction_id and not action:
    return Response({'error': 'Transaction ID and action are required'}, status=400)

  try:
    if user.is_staff:
      result = ProfitService.process_withdrawal_request(transaction_id, action, reference)
      serializer = TransactionSerializer(result)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except ValidationError as e:
    logger.error(f"Validation error processing withdrawal profit: {str(e)}")
    return Response({'error': list(e.messages)}, status=400)
  except Exception as e:
    logger.error(f"Error processing withdrawal profit: {str(e)}")
    return Response({'error': str(e)}, status=500)
  

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_withdrawal_commission(request):
  user = request.user
  request_id = request.data.get('request_id')
  action = request.data.get('action')
  reference = request.data.get('reference')

  if not request_id and not action:
    return Response({'error': 'Transaction ID and action are required'}, status=400)

  try:
    if user.is_staff:
      result = CommissionService.process_withdrawal_request(request_id, action, reference)
      serializer = WithdrawalRequestSerializer(result)
      return Response(serializer.data, status=200)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except ValidationError as e:
    logger.error(f"Validation error processing withdrawal commission: {str(e)}")
    return Response({'error': list(e.messages)}, status=400)
  except Exception as e:
    logger.error(f"Error processing withdrawal commission: {str(e)}")
    return Response({'error': str(e)}, status=500)
  

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_verification(request):
  user = request.user
  user_id = request.data.get('user_id')
  action = request.data.get('action')
  reject_reason = request.data.get('reject_reason', 'Try again')

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
    logger.error(f"Error processing verification for user {user_id}: {str(e)}")
    return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_info_dashboard(request):
  user = request.user
  year = request.GET.get('year', 2025)

  try:
    if user.is_staff:
      
      all_profit_balance = Wallet.objects.aggregate(
        total=models.Sum('profit_point_balance'))['total'] or 0 
      admin_profit = Wallet.objects.filter(user_id__in=[
        'MMS00QVS', 'MMS01FXC' # mmssuper, MMSAdmin
      ]).aggregate(total=models.Sum('profit_point_balance'))['total'] or 0
      actual_profit_balance = all_profit_balance - admin_profit
      print(f'admin p: {admin_profit}')

      all_affiliate_balance = Wallet.objects.aggregate(
        total=models.Sum('affiliate_point_balance'))['total'] or 0
      admin_affiliate = Wallet.objects.filter(user_id__in=[
        'MMS01FXC'
      ]).aggregate(total=models.Sum('affiliate_point_balance'))['total'] or 0
      actual_affiliate_balance = all_affiliate_balance - admin_affiliate
      print(f'admin af: {admin_affiliate}')

      all_introducer_balance = Wallet.objects.aggregate(
        total=models.Sum('introducer_point_balance'))['total'] or 0
      admin_introducer = Wallet.objects.filter(user_id__in=['MMS01FXC']).aggregate(total=models.Sum('introducer_point_balance'))['total'] or 0
      actual_introducer_balance = all_introducer_balance - admin_introducer
      print(f'admin i: {admin_introducer}')

      total_profit_balance = actual_profit_balance + actual_affiliate_balance + actual_introducer_balance
      

      total_convert_amount = Transaction.objects.filter(transaction_type='CONVERT').aggregate(
        total=models.Sum('amount'))['total'] or 0
      

      daily_profits = (
        Transaction.objects
        .filter(transaction_type='DISTRIBUTION')
        .annotate(day=TruncDate('created_at'))  # Extract just the date part
        .values('day')  # Group by day
        .annotate(total=Sum('amount'))  # Sum amounts per day
        .order_by('day')
      )
      

      total_withdraw_amount = WithdrawalRequest.objects.aggregate(
        total=models.Sum('actual_amount'))['total'] or 0
      
      total_withdraw_fee = WithdrawalRequest.objects.aggregate(
        total=models.Sum('fee'))['total'] or 0 
      

      if year is not None:
        try:
          performance = Performance.objects.filter(year=year).order_by('month')
          serializer = PerformanceSerializer(performance, many=True)

          # Calculate yearly total
          yearly_totals = {
            'total_deposit': sum(Decimal(p['total_deposit']) for p in serializer.data),
            'total_gain_a': sum(Decimal(p['total_gain_a']) for p in serializer.data),
            'total_gain_z': sum(Decimal(p['total_gain_z']) for p in serializer.data),
          }

        except Performance.DoesNotExist:
          return Response({'error': f'Performance for year {year} not found,'}, status=404)
        except Exception as e:
          logger.error(f"Error retrieving performance data for {year}: {str(e)}")
          return Response({'error': str(e)}, status=500)    

      total_user = User.objects.count()


      admin_asset = Asset.objects.filter(
        user_id__in=[
          'MMS00QVS', 'MMS01FXC', 'MMS0216J',  'MMS02O5G', 'MMS02GKX'
        ]).aggregate(total=models.Sum('amount'))['total'] or 0
      print(f'admin as: {admin_asset}')
      all_asset_amount = Asset.objects.aggregate(
        total=models.Sum('amount'))['total'] or 0  
      total_asset_amount = all_asset_amount - admin_asset
      all_asset_above_10k = Asset.objects.filter(amount__gte=10000).aggregate(total=models.Sum('amount'))['total'] or 0
      asset_above_10k = Decimal(all_asset_above_10k) - Decimal(admin_asset)
      asset_below_10k = Asset.objects.filter(amount__lt=10000).aggregate(total=models.Sum('amount'))['total'] or 0
      user_asset_above_10k = Asset.objects.filter(amount__gte=10000).count()
      user_asset_below_10k = Asset.objects.filter(amount__lt=10000).count()

      super_user = User.objects.get(id='MMS00QVS')
      super_user_profit = Wallet.objects.filter(user=super_user).aggregate(
        total=models.Sum('profit_point_balance'))['total'] or 0

      return Response({
        'total_asset_amount': total_asset_amount, 
        'total_profit_balance': total_profit_balance,
        'total_convert_amount': total_convert_amount,
        'daily_profits': list(daily_profits),
        'total_withdraw_amount': total_withdraw_amount,
        'total_withdraw_fee': total_withdraw_fee,
        'monthly_data': serializer.data,
        'yearly_totals': yearly_totals,
        'total_user': total_user,
        'asset_above_10k': asset_above_10k,
        'asset_below_10k': asset_below_10k,
        'user_asset_above_10k': user_asset_above_10k,
        'user_asset_below_10k': user_asset_below_10k,
        'super_user_profit': super_user_profit,
      }, status=200)
    else: 
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    logger.error(f"Error retrieving dashboard info: {str(e)}")
    return Response({'error': str(e)}, status=500)
  
@api_view(['GET', 'PATCH']) 
@permission_classes([IsAuthenticated])
def manage_performance(request):
  user = request.user
  month = request.data.get('month')
  year = request.data.get('year')
  
  try:
    if user.is_trader:
      performance, created = Performance.objects.get_or_create(month=month, year=year)

      if request.method == 'GET':
        serializer = PerformanceSerializer(performance)
        return Response(serializer.data, status=200)
      
      elif request.method == 'PATCH':
        serializer = PerformanceSerializer(performance, data=request.data, partial=True)
        if serializer.is_valid():
          serializer.save()
          return Response(serializer.data, status=200)
        else:
          return Response({'error': serializer.errors}, status=400)
        
      else:
        return Response({'error': 'Method not allowed'}, status=405)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except ValidationError as e:
    logger.error(f"Validation error managing performance: {str(e)}")
    return Response({'error': list(e.messages)}, status=401)
  except Exception as e:
    logger.error(f"Error managing performance: {str(e)}")
    return Response({'error': str(e)}, status=500)
  

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ops_profit_calender(request):
  user = request.user
  try:
    if user.is_staff:
      month = request.GET.get('month')
      year = request.GET.get('year')

      query = Q()
      if month and year:
        query &= Q(active_month_profit__icontains=month) & Q(active_year_profit__icontains=year)

      ops_profit = OperationalProfit.objects.filter(query).order_by('active_year_profit', 'active_month_profit')
      serializer = OperationalProfitSerializer(ops_profit, many=True)
      return Response(serializer.data)
  except Exception as e:
    logger.error(f"Error retrieving operational profit calender: {str(e)}")
    return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def customer_portal(request):
  user = request.user

  try:
    if user.is_staff:
      stripe.api_key = settings.STRIPE_API_KEY
      stripe_customer_id = settings.STRIPE_CUS_ID
      billing_config_id = settings.BILLING_CONFIG_ID
      frontend_url = settings.FRONTEND_URL

      portal_session = stripe.billing_portal.Session.create(
        customer=stripe_customer_id,
        return_url=f'{frontend_url}/',
        configuration=billing_config_id
      )

      checkout_session =  stripe.checkout.Session.create(
        mode= 'subscription',
        customer= stripe_customer_id,
        line_items= [{
          'price':'price_1ShQep03ZzE8NvtFOYLMYCTf', 
          'quantity': 1 
        }],
        success_url= f'{frontend_url}/',
        cancel_url= f'{frontend_url}/',
      )

      return Response({'portal': portal_session.url}, status=200)
    
    else:
      return Response({'error': 'Permission denied'}, status=403)
      
  except stripe.error.StripeError as e:
    logger.error(f"Stripe error: {str(e)}")
    return Response({'error': str(e)}, status=400)
  except ValidationError as e:
    logger.error(f"Validation Error: {str(e)}")
    return Response({'error': str(e)}, status=500)
  except Exception as e:
    logger.error(f"error: {str(e)}")
    return Response({'error': str(e)}, status=500)
