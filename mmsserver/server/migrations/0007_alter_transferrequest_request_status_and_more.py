# Generated by Django 5.2.1 on 2025-06-13 10:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('server', '0006_adminpoint_operationalprofit_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='transferrequest',
            name='request_status',
            field=models.CharField(choices=[('Pending', 'Pending'), ('Approved', 'Approved'), ('Rejected', 'Rejected')], default='Pending', max_length=20, verbose_name='Request Status'),
        ),
        migrations.AlterField(
            model_name='withdrawalrequest',
            name='request_status',
            field=models.CharField(choices=[('Pending', 'Pending'), ('Approved', 'Approved'), ('Rejected', 'Rejected')], default='Pending', max_length=20, verbose_name='Request Status'),
        ),
    ]
