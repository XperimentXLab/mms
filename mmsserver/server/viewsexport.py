import pandas as pd
from io import BytesIO
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.http import HttpResponse
from django.core.exceptions import ValidationError


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_all_user(request):
    # Optional: filter by date range from query params
    users = User.objects.all()

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


def export_all_profit_tx(request):
    # Optional: filter by date range from query params
    txn = Transaction.objects.filter(point_type=['PROFIT'])

    # Build DataFrame
    data = []
    for tx in txn:
        data.append({
          "Created Date": tx.created_at.strftime('%d/%m/%Y'),
          "Created Time": tx.created_at.strftime('%I:%M:%S %p'),
          "User ID": tx.user_id,
          "Point Type": tx.point_type,
          "Transaction Type": tx.transaction_type,
          "Request Status": tx.request_status,
          "Amount": tx.amount,
          "Description": tx.description,
          "Reference": tx.reference,
        })
    df = pd.DataFrame(data)

    # Export to Excel
    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine='xlsxwriter') as writer:
      df.to_excel(writer, sheet_name='Profit Transactions Report', index=False)

    buffer.seek(0)
    response = HttpResponse(
      buffer.getvalue(),
      content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    response['Content-Disposition'] = 'attachment; filename="profit_transactions_report.xlsx"'
    return response