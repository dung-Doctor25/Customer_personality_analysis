# Generated by Django 5.2 on 2025-04-29 16:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('CPA_APP', '0005_clustername_remove_customer_cluster_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customer',
            name='cluster',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
    ]
