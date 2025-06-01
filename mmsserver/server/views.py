from .models import *
from .serializers import *
from functools import wraps
from django.conf import settings
from jose import JWTError, jwt
from rest_framework.authentication import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

import logging

logger = logging.getLogger(__name__)

####### manual decorators ###########
def supabase_auth_required(view_func):
  @wraps(view_func)
  def wrapper(request, *args, **kwargs):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return Response({'error': 'Authorization header missing'}, status=401)
    
    try:
        token = auth_header.split(' ')[1]
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=['HS256'],
            audience='authenticated',
            issuer='supabase'
        )
        request.user_payload = payload
        return view_func(request, *args, **kwargs)
    except Exception as e:
        return Response({'error': f'Invalid token: {str(e)}'}, status=401)
  return wrapper

##############################################

@api_view(['GET'])
@supabase_auth_required
def protected_view(request):
  user = request.user_payload.get('id')
  return Response({'message': f'Hello, {user}!'})

@api_view(["POST"])
@permission_classes([AllowAny])
def login_verify(request):
  auth_header = request.headers.get('Authorization')
  if not auth_header:
    return Response({'error': 'Authorization header is missing'}, status=401)

  try:
    token = auth_header.split(' ')[1]
    # Get the JWT secret from Supabase project settings
    jwt_secret = settings.SUPABASE_JWT_SECRET

    #Verify token
    payload = jwt.decode(
      token,
      jwt_secret,
      algorithms=['HS256'],
      audience='authenticated',
      issuer='supabase'
    )

    user_id = payload.get('id')

    return Response({'success': True, 'user_id': user_id, 'token': token, 'message': 'Login successful'})
  except JWTError as e:
    return Response({'error': f'Invalid token: {str(e)}'}, status=401)
  except Exception as e:
    return Response({'error': str(e)}, status=401)



@api_view(['GET'])
@permission_classes([AllowAny])
def get_user(request, user_id):
  #user = request.user
  user = User.objects.get(id=user_id)
  serializer = UserSerializer(user)
  return Response(serializer.data)


@api_view(['POST'])
def register_user(request):
  serializer = UserSerializer(data=request.data)
  if serializer.is_valid():
    user = serializer.save()
    return Response({'message': f'{user.username} successfully created'}, status=201)
  
@api_view(['POST'])
@permission_classes([AllowAny])
def update_password(request, user_id):
  #user = request.user
  user = User.objects.get(id=user_id)
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
  

@api_view(['PUT'])
@permission_classes([AllowAny])
def update_user(request, user_id):
  try:
    #user = request.user
    user = User.objects.get(id=user_id)

    serializer = UserSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
      serializer.save()
      print('Serializer Valid')
      return Response({'message': f'{user.username} successfully updated'}, status=200)
    else:
      print('Serializer Error')
      return Response(serializer.errors, status=400)
  except user.DoesNotExist():
    return Response({'error': 'User does not exist'}, status=400)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_network(request, user_id):
  #user = request.user
  user = User.objects.get(id=user_id)

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
  except Exception as e:
    return Response({'Error getting network': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def get_all_network(request ,user_id):
  #user = request.user
  user = User.objects.get(id=user_id)
  if user.is_superuser:   
    all_network = user.get_all_network(include_self=True)
    serializer = UserNetworkSerializer(all_network, many=True)
    return Response(serializer.data)


#Check back with model
@api_view(['POST'])  
@permission_classes([AllowAny])
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
