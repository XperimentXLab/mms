from django.urls import path
from .views import *

urlpatterns = [

  #auth
  path('register/', register_user, name='register_user'),
  path('login_verify', login_verify, name='login_verify'),
  path('protected/', protected_view, name='protected_view'),

  #get details
  path('user_details/<str:user_id>', get_user, name='user_details'),
  path('user_network/<str:user_id>', get_user_network, name='user_network'),

  #updating
  path('update_password/<str:user_id>', update_password, name='update_password'),
  path('update_user/<str:user_id>', update_user, name='update_user'),

  #admin only
  path('all_network/<str:user_id>', get_all_network, name='all_network'),
  

]