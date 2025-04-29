from django.db import models

class Customer(models.Model):
    # People
    customer_id = models.CharField(primary_key=True)
    year_birth = models.IntegerField()
    education = models.CharField(max_length=50)
    marital_status = models.CharField(max_length=50)
    income = models.FloatField(null=True, blank=True)
    kidhome = models.IntegerField()
    teenhome = models.IntegerField()
    dt_customer = models.DateField()
    recency = models.IntegerField()
    complain = models.IntegerField()

    # Products
    mnt_wines = models.IntegerField()
    mnt_fruits = models.IntegerField()
    mnt_meat_products = models.IntegerField()
    mnt_fish_products = models.IntegerField()
    mnt_sweet_products = models.IntegerField()
    mnt_gold_prods = models.IntegerField()

    # Promotion
    num_deals_purchases = models.IntegerField()
    accepted_cmp1 = models.IntegerField()
    accepted_cmp2 = models.IntegerField()
    accepted_cmp3 = models.IntegerField()
    accepted_cmp4 = models.IntegerField()
    accepted_cmp5 = models.IntegerField()
    response = models.IntegerField()

    # Place
    num_web_purchases = models.IntegerField()
    num_catalog_purchases = models.IntegerField()
    num_store_purchases = models.IntegerField()
    num_web_visits_month = models.IntegerField()

    cluster = models.CharField(max_length=200,null=True, blank=True)  # Optional field for clustering
    # Z_CostContact and Z_Revenue are not included in the model as per the original code
    # cluster_name = models.CharField(max_length=200, blank=True, default='')
    def __str__(self):
        return f"Customer {self.customer_id} - {self.education}"
      
class ClusterName(models.Model):
    cluster = models.IntegerField(unique=True)  # Số cụm (0, 1, 2, v.v.)
    cluster_name = models.CharField(max_length=200, blank=True, default='')  # Tên cụm

    def __str__(self):
        return f"Cluster {self.cluster}: {self.cluster_name or 'Unnamed'}"

class Shihoutte(models.Model):
    score = models.FloatField(null=True, blank=True)  # Điểm Shihoutte
class File(models.Model):
    file = models.FileField(upload_to='uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"File {self.id} - {self.uploaded_at}"
