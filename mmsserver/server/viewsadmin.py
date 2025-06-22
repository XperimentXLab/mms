from .models import *
from .serializers import *
from .utils import *
from django.conf import settings
import requests
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


@api_view(['GET', 'PUT', 'POST'])
@permission_classes([IsAuthenticated])
def manage_admin_point(request):
  user = request.user       
  admin_point = AdminPoint.objects.first()
  try:
    if user.is_staff:

      if request.method == 'GET':
        if admin_point:
          serializer = AdminPointSerializer(admin_point)
          return Response(serializer.data, status=200)
        else:
          return Response({'error': 'Admin point not found'}, status=404)
        
      elif request.method == 'POST':
        if admin_point:
          return Response({'error': 'AdminPoint record already exists.'}, status=400)
        serializer = AdminPointSerializer(data=request.data)
        if serializer.is_valid():
          serializer.save()
          return Response(serializer.data, status=201)
        else:
          return Response({'error': serializer.errors}, status=400)
        
      elif request.method == 'PUT':
        if admin_point:
          serializer = AdminPointSerializer(admin_point, data=request.data, partial=True)
          if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=200)
          else:
            return Response({'error': serializer.errors}, status=400)
        else:
          return Response({'error': 'Admin point not found'}, status=404)
      else:
        return Response({'error': 'Method not allowed'}, status=405)
    else:
      return Response({'error': 'Permission denied'}, status=403)
  except Exception as e:
    return Response({'error': str(e)}, status=500)
  

@api_view(['GET', 'PUT', 'POST'])
@permission_classes([IsAuthenticated])
def manage_operational_profit(request):
  user = request.user        
  operational_profit = OperationalProfit.objects.first()
  try:
    if request.method == 'GET':
      if operational_profit:
        serializer = OperationalProfitSerializer(operational_profit)
        return Response(serializer.data, status=200)
      else:
        return Response({'error': 'Operational profit not found'}, status=404)
    if user.is_staff:
      if request.method == 'POST':
        if operational_profit:
          return Response({'error': 'OperationalProfit record already exists.'}, status=400)
        serializer = OperationalProfitSerializer(data=request.data)
        if serializer.is_valid():
          serializer.save()
          return Response(serializer.data, status=201)
        else:
          return Response({'error': serializer.errors}, status=400)
      elif request.method == 'PUT':
        if operational_profit:
          serializer = OperationalProfitSerializer(operational_profit, data=request.data, partial=True)
          if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=200)
          else:
            return Response({'error': serializer.errors}, status=400)
        else:
          return Response({'error': 'Operational profit not found'}, status=404)
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
  year = request.query_params.get('year')

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
          if MonthlyFinalizedProfit.objects.filter(month=month, year=year).exists():
            return Response({'error': 'Profit record already exists.'}, status=409)
          serializer.save()
          return Response(serializer.data, status=201)
        else:
          return Response({'error': serializer.errors}, status=400)
      elif request.method == 'PUT':
        if not year or not month:
          return Response({'error': 'Month and year are required.'}, status=400)
        try:
          instance, created = MonthlyFinalizedProfit.objects.get_or_create(month=month, year=year)
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
          instance= MonthlyFinalizedProfit.objects.get(month=month, year=year)
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
def distribute_profit(request):
  """
  Admin manually triggers profit distribution.
  """
  user = request.user

  try:
    if user.is_staff:
        result = distribute_profit_manually()
        serializer = WalletSerializer(result)
        return Response(serializer.data, status=200)
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
  try:
    if user.is_staff:
      result = grant_free_campro()
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
def process_withdrawal_commision(request):
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
  

