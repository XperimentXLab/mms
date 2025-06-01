from django.urls import path
from .views import *

urlpatterns = [

  #auth
  path('token/refresh/', refresh_Token, name='token_refresh'),
  path('register/', register_user, name='register_user'),
  path('login/', login, name='login'),
  path('logout/', logout, name='logout'),
  path('protected/', protected_view, name='protected_view'),

  #forgot password
  path('password_reset/', request_password_reset_email, name='password_reset'),
  path('password_reset_confirm/<uidb64>/<token>/', password_reset_confirm, name='password_reset_confirm'),

  #get details
  path('user_details/', get_user, name='user_details'),
  path('user_network/', get_user_network, name='user_network'),

  #updating
  path('update_password/', update_password, name='update_password'),
  path('update_user/', update_user, name='update_user'),

  #admin only
  path('all_network/', get_all_network, name='all_network'),
  

]