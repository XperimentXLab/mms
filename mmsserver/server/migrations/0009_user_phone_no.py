# Generated by Django 5.2.1 on 2025-07-15 15:48

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('server', '0008_user_is_trader'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='phone_no',
            field=models.CharField(blank=True, max_length=15, null=True, validators=[django.core.validators.RegexValidator('^(?:\\+?60|0)1\\d{7,11}$', 'Enter a valid mobile number')]),
        ),
    ]
