from .models import *
from .serializers import *
import pandas as pd
from io import BytesIO
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.http import HttpResponse
from django.core.exceptions import ValidationError
from django.db.models import Q


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_all_user(request):
  users = User.objects.all().order_by('-created_at')

  user_without_asset = User.objects.filter(asset__isnull=True).count()
  print(f'User without Asset: {user_without_asset}')
  user_without_wallet = User.objects.filter(wallet__isnull=True).count()
  print(f'User without Wallet: {user_without_wallet}')


  # Build DataFrame
  data = []
  for user in users:

    data.append({
      "Joined Date": user.created_at.strftime('%d/%m/%Y'),
      "Joined Time": user.created_at.strftime('%I:%M:%S %p'),
      "User ID": user.id,
      "Username": user.username,
      "I/C": user.ic,
      "Email": user.email,
      "Referral ID": user.referred_by,
      "Verification": user.verification_status,
      "Wallet Address": user.wallet_address if user.wallet_address else '-',
      'Asset Amount': user.asset.amount if hasattr(user, 'asset') else 0,
      "Register Point": user.wallet.master_point_balance if hasattr(user, 'wallet') else 0,
      "Profit Point": user.wallet.profit_point_balance if hasattr(user, 'wallet') else 0,
      "Affiliate Point": user.wallet.affiliate_point_balance if hasattr(user, 'wallet') else 0,
      "Introducer Point": user.wallet.introducer_point_balance if hasattr(user, 'wallet') else 0,
    })
  df = pd.DataFrame(data)

  # Export to Excel
  buffer = BytesIO()
  with pd.ExcelWriter(buffer, engine='xlsxwriter') as writer:
    df.to_excel(writer, sheet_name='User Report', index=False)

  buffer.seek(0)
  response = HttpResponse(
    buffer.getvalue(),
    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  response['Content-Disposition'] = 'attachment; filename="user_report.xlsx"'
  return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_all_verification(request):
  users = User.objects.all().order_by('-created_at')

  # Build DataFrame
  data = []
  for user in users:
    data.append({
      "User ID": user.id,
      "Username": user.username,
      "First Name": user.first_name,
      "Last Name": user.last_name,
      "I/C": user.ic,
      "Phone": user.phone_no,
      "Email": user.email,
      "Address Line": user.address_line,
      "City": user.address_city,
      "State": user.address_state,
      "Poscode": user.address_postcode,
      "Country": user.address_country,
      "Document Link": user.ic_document_url,
      "Verification Status": user.verification_status,
      "Welcome Bonus": user.is_campro,
    })
  df = pd.DataFrame(data)

  # Export to Excel
  buffer = BytesIO()
  with pd.ExcelWriter(buffer, engine='xlsxwriter') as writer:
    df.to_excel(writer, sheet_name='User Verification Report', index=False)

  buffer.seek(0)
  response = HttpResponse(
    buffer.getvalue(),
    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  response['Content-Disposition'] = 'attachment; filename="user_verification_report.xlsx"'
  return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_all_tx(request):
  search = request.GET.get('search', '')
  status = request.GET.get('status', '')
  point_type = request.GET.get('point_type', '')
  transaction_type = request.GET.get('transaction_type', '')
  start_date = request.GET.get('start_date', '')
  end_date = request.GET.get('end_date', '')
  
  query = Q()
  if point_type:
    query &= Q(point_type=point_type)
  if transaction_type:
    query &= Q(transaction_type=transaction_type)
  if status:
    query &= Q(request_status=status)
  if search:
    query &= Q(user__username__icontains=search) | Q(user__id__icontains=search)
  if start_date or end_date:
    query &= Q(created_at__range=[start_date, end_date])  

  txn = Transaction.objects.filter(query).order_by('-created_at')

  # Build DataFrame
  data = []
  for tx in txn:
    data.append({
      "Created Date": tx.created_at.strftime('%d/%m/%Y'),
      "Created Time": tx.created_at.strftime('%I:%M:%S %p'),
      "User ID": tx.user.id,
      "Username": tx.user.username,
      "Point Type": tx.point_type,
      "Transaction Type": tx.transaction_type,
      "Amount": tx.amount,
      "Status": tx.request_status,
      "Description": tx.description,
      "Reference": tx.reference,
    })
  df = pd.DataFrame(data)

  # Export to Excel
  buffer = BytesIO()
  with pd.ExcelWriter(buffer, engine='xlsxwriter') as writer:
    df.to_excel(writer, sheet_name='Transactions Report', index=False)

  buffer.seek(0)
  response = HttpResponse(
    buffer.getvalue(),
    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  response['Content-Disposition'] = 'attachment; filename="all_transactions_report.xlsx"'
  return response