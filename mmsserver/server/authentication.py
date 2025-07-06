from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken
from .models import UserJWT
from .utils import get_client_ip
import hashlib



class JWTDeviceAuthentication(JWTAuthentication):
  """
  An authentication backend that authenticates users with a JWT cookie.
  """
  def authenticate(self, request):    
    # Get token from Authorization header only
    header = self.get_header(request)
    if header is None:
        return None

    raw_token = self.get_raw_token(header)
    if raw_token is None:
        return None

    try:
        validated_token = self.get_validated_token(raw_token)
        return self._validate_user_and_token(request, validated_token)
    except InvalidToken as e:
        raise AuthenticationFailed(str(e))

  def _validate_user_and_token(self, request, token):
      """Common validation for tokens"""
      user = self.get_user(token)
      if user is None:
          raise AuthenticationFailed('User not found')

      # Verify token binding
      if not self._verify_token_binding(request, token):
          raise AuthenticationFailed('Invalid device binding')

      # Verify token in database
      if not UserJWT.objects.filter(
          user=user,
          access_token=str(token),
          device_fingerprint=self._get_device_fingerprint(request)
      ).exists():
          raise AuthenticationFailed('Token revoked')

      return (user, token)

  def _verify_token_binding(self, request, token):
        """Verify token matches client characteristics"""
        expected_ip_hash = token.payload.get('ip_hash')
        expected_ua_hash = token.payload.get('ua_hash')
        
        # If no fingerprinting in token, skip validation
        if not expected_ip_hash or not expected_ua_hash:
            return True
        
        current_ip_hash = self._hash_ip(get_client_ip(request))
        current_ua_hash = self._hash_ua(request.META.get('HTTP_USER_AGENT', ''))
        
        return expected_ip_hash == current_ip_hash and expected_ua_hash == current_ua_hash

  def _hash_ip(self, ip):
      return hashlib.sha256(f"{ip}{settings.SECRET_KEY}".encode()).hexdigest()

  def _hash_ua(self, ua):
      return hashlib.sha256(ua.encode()).hexdigest()

  def _get_device_fingerprint(self, request):
      return self._hash_ua(request.META.get('HTTP_USER_AGENT', ''))[:16] + \
              self._hash_ip(get_client_ip(request))[:16]