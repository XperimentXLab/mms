from django.urls import path
from .views import *
from .viewsadmin import *
from .viewsexport import *

urlpatterns = [

  #Export
  path('export_all_user/', export_all_user, name='export_all_user'),

  #auth
  path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
  path('token/refresh/', refresh_token, name='token_refresh'),
  path('register/', register_user, name='register_user'),
  path('login/', login, name='login'),
  path('logout/', logout, name='logout'),

  #forgot password
  path('password_reset/', request_password_reset_email, name='password_reset'),
  path('password_reset_confirm/<uidb64>/<token>/', password_reset_confirm, name='password_reset_confirm'),

  #get details
  path('user_details/', get_user, name='user_details'),
  path('user_username/', get_username, name='user_username'),
  path('user_network/', get_user_network, name='user_network'),
  path('user_wallet/', get_wallet, name='user_wallet'),
  path('user_asset/', get_asset, name='user_asset'),
  path('user_profit_tx/', get_profit_transaction, name='user_transaction'),
  path('user_commission_tx/', get_commission_transaction, name='user_commission_transaction'),
  path('user_daily_commission_tx/', get_accumulate_commission_tx, name='user_daily_commission_transaction'),
  path('user_transfer_tx/', get_transfer_transaction, name='user_transfer_transaction'),
  path('user_convert_tx/', get_convert_transaction, name='user_convert_transaction'),
  path('user_profit_commission_wd_tx/', get_profit_commission_wd_transaction, name='user_profit_commission_wd_transaction'),
  path('user_asset_tx/', get_asset_transaction, name='user_asset_transaction'),
  path('user_deposit_lock/', get_deposit_lock, name='user_deposit_lock'),
  path('user_daily_total_profit/', get_daily_total_profit, name="user_daily_total_profit"),

  #updating
  path('update_password/', update_password, name='update_password'),
  path('update_user/', update_user, name='update_user'),
  path('promo_code/', promo_code, name='promo_code'),

  #functionalities
  path('transfer_master_to_user/', transfer_master, name='transfer_master_to_user'),
  path('convert_profit/', convert_profit_to_master, name='convert_profit_to_master'),
  path('convert_commission/', convert_commission_to_master, name='convert_commission_to_master'),

  #functionalities - need admin approval
  path('place_asset/', place_asset, name='place_asset'),
  path('withdraw_profit/', withdraw_profit, name='withdraw_profit'),
  path('withdraw_commission/', withdraw_commission, name='withdraw_commission'),
  path('withdraw_asset/', withdraw_asset, name='withdraw_asset'),


  #admin only
  path('login_admin/', login_admin, name='login_admin'),
  path('all_network/', get_all_network, name='all_network'),
  path('all_users/', get_all_user, name='all_users'),
  path('all_transactions/', get_all_transaction, name='all_transactions'),
  path('all_master_tx/', get_all_master_tx, name="all_master_tx"),
  path('all_profit_tx/', get_all_profit_tx, name="all_profit_tx"),
  path('all_commission_tx/', get_all_commission_tx, name="all_commission_tx"),
  path('all_asset_tx/', get_all_asset_tx, name="all_asset_tx"),
  path('all_withdrawal_requests/', get_all_withdrawal_request, name='all_withdrawal_requests'),
  path('all_deposit_locks/', get_all_deposit_lock, name='all_deposit_locks'),
  path('manage_admin_mp/', manage_admin_mp, name='manage_admin_mp'),
  path('manage_operational_profit/', manage_operational_profit, name='manage_operational_profit'),
  path('manage_monthly_finalized_profit/', manage_monthly_finalized_profit, name='manage_monthly_finalized_profit'),
  path('total_asset_balance/', get_total_asset_balance, name='total_asset_balance'),
  path('get_yearly_profit_total/', get_yearly_profit_total, name='get_yearly_profit_total'),
  path('setup_user/', setup_user, name='setup_user'),
  path('get_pending_transaction/', get_pending_transaction, name='get_pending_transaction'),
  path('get_info_dashboard/', get_info_dashboard, name='get_info_dashboard'),
  path('get_user_info/', get_user_info, name='get_user_info'),
  path('update_user_info/', update_user_info, name='update_user_info'),


  #admin - functionalities
  path('distribute_profit/', distribute_profit, name='distribute_profit'),
  path('grant_campro/', grant_welcome_bonus, name='grant_free_campro'),
  path('process_place_asset/', process_place_asset, name='process_place_asset'),
  path('process_withdrawal_asset/', process_withdrawal_asset, name='process_withdrawal_asset'),
  path('process_withdrawal_profit/', process_withdrawal_profit, name='process_withdrawal_profit'),
  path('process_withdrawal_commission/', process_withdrawal_commission, name='process_withdrawal_commission'),
  path('update_profit_sharing/', update_profit_sharing, name='update_profit_sharing'),
  path('reset_all_wallet_balances/', reset_all_wallet_balances, name='reset_all_wallet_balances'),
  path('process_verification/', process_verification, name='process_verification'),
  path('manage_performance/', manage_performance, name='manage_performance'),

]
