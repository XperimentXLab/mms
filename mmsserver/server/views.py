from .models import *
from .serializers import *
from django.conf import settings
import requests
from rest_framework.authentication import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes #force_str
#from django.core.mail import send_mail
#from django.template.loader import render_to_string 

import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_Token(request):
  refresh_token_cookie_name = getattr(settings, 'SIMPLE_JWT', {}).get('AUTH_COOKIE_REFRESH', 'refresh_token')
  refresh_token = request.COOKIES.get(refresh_token_cookie_name)

  if not refresh_token:
    logger.warning("Refresh token cookie not found.")
    return Response({'error': 'Refresh token cookie not found.'}, status=401)

  try:
    # Use the RefreshToken object to verify and potentially blacklist the old token
    refresh = RefreshToken(refresh_token)
    # Verify the token (this will raise TokenError if invalid or blacklisted)
    refresh.verify()

    # Create response and set the new access token cookie
    response = Response({'message': 'Token refreshed successfully'})
    access_token_cookie_name = getattr(settings, 'SIMPLE_JWT', {}).get('AUTH_COOKIE_ACCESS', 'access_token')
    response.set_cookie(
        key=access_token_cookie_name,
        value=str(refresh.access_token),
        httponly=settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True), # Use .get for safety
        secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', not settings.DEBUG),
        samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
        path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/')
    )
    # Since ROTATE_REFRESH_TOKENS is likely False in your settings now,
    # we don't get/set a new refresh token.
    logger.info("Token refreshed successfully via cookie.")
    return response

  except TokenError as e:
    logger.warning(f"Token refresh failed via cookie: {e}")
    # Clear potentially invalid cookies
    response = Response({'error': f'Invalid or expired refresh token: {e}'}, status=401)
    response.delete_cookie(refresh_token_cookie_name, path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'))
    access_token_cookie_name = getattr(settings, 'SIMPLE_JWT', {}).get('AUTH_COOKIE_ACCESS', 'access_token')
    response.delete_cookie(access_token_cookie_name, path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'))
    return response
  except Exception as e:
    logger.error(f"Unexpected error during token refresh: {e}", exc_info=True) # Log traceback for 500s
    return Response({'error': 'An unexpected error occurred during token refresh.'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def protected_view(request):
  user = request.user
  try:
    if (user):
      return Response({'message': f'Hello, {user.username}!'})
    else:
      return Response({'error': 'Invalid credentials'}, status=400)
  except Exception as e:
    return Response({'error': str(e)}, status=400)
  
################### Admin ##################

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
          serializer = AdminPointSerializer(admin_point, data=request.data)
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
    if user.is_staff:
      if request.method == 'GET':
        if operational_profit:
          serializer = OperationalProfitSerializer(operational_profit)
          return Response(serializer.data, status=200)
        else:
          return Response({'error': 'Operational profit not found'}, status=404)
      elif request.method == 'POST':
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
          serializer = OperationalProfitSerializer(operational_profit, data=request.data)
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
  year = request.data.get('year')
  try:
    if user.is_staff:
      if request.method == 'GET':
        if year:
          monthly_finalized_profit = MonthlyFinalizedProfit.objects.filter(year=year)
        else:
          monthly_finalized_profit = MonthlyFinalizedProfit.objects.all()
        serializer = MonthlyFinalizedProfitSerializer(monthly_finalized_profit, many=True)
        return Response(serializer.data, status=200)
      elif request.method == 'POST':
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
          instance = MonthlyFinalizedProfit.objects.get(month=month, year=year)
        except MonthlyFinalizedProfit.DoesNotExist:
          return Response({'error': 'Profit record not found.'}, status=404)

        serializer = MonthlyFinalizedProfitSerializer(instance, data=request.data)
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
    user = request.user
    if user.is_staff:
      year = request.data.get('year')
      total = MonthlyFinalizedProfit.get_total_yearly_profit(year)
      return Response({'year': year, 'total_profit_rate': float(total)})
    else:
      return Response({'error': 'Permission denied'}, status=403)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_all_network(request):
  user = request.user
  try:
    if user.is_staff:
      all_network = user.get_all_network(include_self=True)
      serializer = UserNetworkSerializer(all_network, many=True)
      return Response(serializer.data)
    else:
      return Response({'error': f'{user} is not allowed to perform this action'}, status=403)
  

############################################


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
  user = request.user
  serializer = UserSerializer(user)
  return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
  serializer = UserSerializer(data=request.data)

  try:
    if serializer.is_valid():
      user = serializer.save()
      return Response({'message':f'{user.username} successfully registered'}, status=201)
    else:
      return Response({'error': serializer.errors}, status=400)
    
  except KeyError as e:
    return Response({'error': str(e)}, 400)
  except Exception as e:
    logger.error(f"Unexpected error during user registration: {e}")
    return Response({'error': 'An unexpected error occurred. Please contact administrator'}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
  username = request.data.get('username')
  password = request.data.get('password')
  user = authenticate(request, username=username, password=password)

  if user:
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

    # end new update

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
    return Response({'error': list(e.messages)}, status=400)
  except Exception as e:
    logger.error(f"Unexpected error during password update for {user.username}: {str(e)}")
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

      #frontend_url = getattr(settings, 'CSRF_TRUSTED_ORIGINS')
      reset_link = f"http://localhost:5173/reset-password-confirm/{uidb64}/{token}/"
      
      subject = 'Password Reset Requested'
      reset_password_template = "password_reset_email.html"
      c = {
          "email": user.email,
          "domain": request.get_host(), # or your frontend domain
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
      print(f"DEBUG: Password reset link for {user.email}: {reset_link}")
      return Response({'message': 'If an account with this email, a password reset link will be sent.'}, status=200)
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
    serializer = UserSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
      serializer.save()
      return Response({'message': f'{user.username} successfully updated'}, status=200)
    else:
      return Response(serializer.errors, status=400)


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
    return Response({'Error getting network': str(e)}, status=400)



#Check back with model
@api_view(['POST'])  
@permission_classes([IsAuthenticated])
def process_withdrawal(request):
  amount = request.POST.get('amount')
  point_type = request.POST.get('point_type')
  password = request.POST.get('password')
  
  # Verify password
  user = authenticate(username=request.user.username, password=password)
  if user is not None:
    # Process withdrawal
    pass
  else:
    logger.error(request, "Invalid password")
    return Response({'error': 'Invalid password'}, status=400)
  


