from django.urls import path
from .views import *
from .viewsadmin import *

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
  path('login_admin/', login_admin, name='login_admin'),
  path('all_network/', get_all_network, name='all_network'),
  path('manage_admin_point/', manage_admin_point, name='manage_admin_point'),
  path('manage_operational_profit/', manage_operational_profit, name='manage_operational_profit'),
  path('manage_monthly_finalized_profit/', manage_monthly_finalized_profit, name='manage_monthly_finalized_profit'),
  path('get_yearly_profit_total/', get_yearly_profit_total, name='get_yearly_profit_total'),
  path('distribute_profit/', distribute_profit, name='distribute_profit'),

]