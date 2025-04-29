from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('upload_csv/', views.upload_csv, name='upload_csv'),
    path('cluster/', views.perform_rfm_clustering, name='cluster'),
    path('customer-segments/', views.customer_segments, name='customer_segments'),
    path('customer-data/', views.customer_data_json, name='customer_data_json'),
    path('visualizations/', views.visualizations, name='visualizations'),
    path('save-cluster-name/', views.save_cluster_name, name='save_cluster_name'),
]