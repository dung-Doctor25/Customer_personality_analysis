import csv
from django.shortcuts import render, redirect
from django.contrib import messages
from .models import File, Customer
from datetime import datetime
import io
def home(request):
    # Render the main page
    return render(request, 'home.html')
import pandas as pd
from django.shortcuts import render, redirect
from django.contrib import messages
from .models import *
from datetime import datetime


#----------------------------Upload CSV----------------------------
def create_db_customer(file_path):
    df = pd.read_csv(file_path, sep=',', encoding='ISO-8859-1')
    list_of_csv = [list(row) for row in df.values]

    for l in list_of_csv:
        Customer.objects.create(
            customer_id=int(l[0]),  # ID
            year_birth=int(l[1]),  # Year_Birth
            education=str(l[2]),  # Education
            marital_status=str(l[3]),  # Marital_Status
            income=float(l[4]) if pd.notna(l[4]) else None,  # Income
            kidhome=int(l[5]),  # Kidhome
            teenhome=int(l[6]),  # Teenhome
            dt_customer=datetime.strptime(str(l[7]), '%d-%m-%Y').date(),  # Dt_Customer
            recency=int(l[8]),  # Recency
            mnt_wines=int(l[9]),  # MntWines
            mnt_fruits=int(l[10]),  # MntFruits
            mnt_meat_products=int(l[11]),  # MntMeatProducts
            mnt_fish_products=int(l[12]),  # MntFishProducts
            mnt_sweet_products=int(l[13]),  # MntSweetProducts
            mnt_gold_prods=int(l[14]),  # MntGoldProds
            num_deals_purchases=int(l[15]),  # NumDealsPurchases
            num_web_purchases=int(l[16]),  # NumWebPurchases
            num_catalog_purchases=int(l[17]),  # NumCatalogPurchases
            num_store_purchases=int(l[18]),  # NumStorePurchases
            num_web_visits_month=int(l[19]),  # NumWebVisitsMonth
            accepted_cmp3= int(l[20]),  # AcceptedCmp3
            accepted_cmp4= int(l[21]),  # AcceptedCmp4
            accepted_cmp5= int(l[22]),  # AcceptedCmp5
            accepted_cmp1= int(l[23]),  # AcceptedCmp1
            accepted_cmp2= int(l[24]),  # AcceptedCmp2
            complain= int(l[25]),  # Complain
            response= int(l[28])  # Response
            # Z_CostContact và Z_Revenue bị bỏ qua vì không có trong model
        )

def upload_csv(request):
    if request.method == 'POST':
        file = request.FILES['csv_file']
        obj = File.objects.create(file=file)
        create_db_customer(obj.file)

        return redirect('home')

    return render(request, 'upload_csv.html')


#----------------------------Update Customer----------------------------
import random
def update_customer_data():
    # Danh sách marital_status để chọn ngẫu nhiên
    marital_status_options = ['Single', 'Together', 'Married', 'Divorced', 'Widow', 'Alone', 'Absurd', 'YOLO']

    # Lấy tất cả bản ghi Customer
    customers = Customer.objects.all()

    # Cập nhật từng bản ghi
    for customer in customers:
        random_increment = random.randint(1, 10)  # Số ngẫu nhiên từ 1 đến 10
        customer.recency += random_increment
        customer.income = (customer.income + random_increment) if customer.income is not None else random_increment
        customer.mnt_wines += random_increment
        customer.mnt_fruits += random_increment
        customer.mnt_meat_products += random_increment
        customer.mnt_fish_products += random_increment
        customer.mnt_sweet_products += random_increment
        customer.mnt_gold_prods += random_increment
        customer.num_deals_purchases += random_increment
        customer.num_web_purchases += random_increment
        customer.num_catalog_purchases += random_increment
        customer.num_store_purchases += random_increment
        customer.marital_status = random.choice(marital_status_options)  # Chọn ngẫu nhiên marital_status
        customer.save()
#---------------------------- CLustering----------------------------
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import MiniBatchKMeans
from yellowbrick.cluster import KElbowVisualizer
from sklearn.metrics import silhouette_score
def remove_outliers_iqr(df, cols):
    """
    Xóa outliers theo phương pháp IQR.
    """
    df_cleaned = df.copy()

    for col in cols:
        Q1 = df_cleaned[col].quantile(0.25)
        Q3 = df_cleaned[col].quantile(0.75)
        IQR = Q3 - Q1

        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR

        df_cleaned = df_cleaned[(df_cleaned[col] >= lower_bound) & (df_cleaned[col] <= upper_bound)]

    return df_cleaned


def perform_rfm_clustering(request):
    # update_customer_data() # Cập nhật dữ liệu khách hàng trước khi phân cụm
    # Lấy toàn bộ dữ liệu từ bảng Customer
    customers = Customer.objects.all().values(
        'customer_id', 'recency', 'income', 'mnt_wines', 'mnt_fruits', 'mnt_meat_products',
        'mnt_fish_products', 'mnt_sweet_products', 'mnt_gold_prods', 'num_deals_purchases',
        'num_web_purchases', 'num_catalog_purchases', 'num_store_purchases', 'education', 'marital_status'
    )
    df = pd.DataFrame(list(customers))

    # Tiền xử lý
    #1. Xóa trùng lập
    df.drop_duplicates()
    #2. Xử lý null cột income, xóa null vì tỷ lệ null thấp
    df['income'].dropna()
    #3. Cột tình trạng hôn nhân có dữ liệu cùng nghĩa nên gom lại,cột giáo dục có dữ liệu cùng nghĩa nên gom lại
    df["marital_status"] = df["marital_status"].replace(["Married","Together"],"Partner")
    df["marital_status"] = df["marital_status"].replace(["Divorced","Widow","Alone","Absurd","YOLO"],"Single")
    df["education"] = df["education"].replace(["Master","2n Cycle","PhD"],"PostGraduate")
    df["education"] = df["education"].replace(["Graduation"],"Graduate")
    df["education"] = df["education"].replace(["Basic"],"UnderGraduate")
    # Tạo cột Monetary và Frequency
    df["Monetary"] = (
        df["mnt_wines"] + df["mnt_fruits"] + df["mnt_meat_products"] +
        df["mnt_fish_products"] + df["mnt_sweet_products"] + df["mnt_gold_prods"]
    )
    df["Frequency"] = (
        df["num_deals_purchases"] + df["num_web_purchases"] +
        df["num_catalog_purchases"] + df["num_store_purchases"]
    )

    # Mã hóa one-hot cho Education và Marital_Status
    df = pd.get_dummies(df, columns=['education', 'marital_status'], drop_first=False)

    # Các cột cần xử lý
    cols = [ "recency", "Monetary", "Frequency"]

    # Loại bỏ outliers
    df_cleaned = remove_outliers_iqr(df, cols)

    # Bỏ các dòng chứa NaN
    df_cleaned = df_cleaned.dropna(subset=cols)
    
    # Chuẩn hóa dữ liệu
    scaler = StandardScaler()
    rfm_scaled = scaler.fit_transform(df_cleaned[cols])

    # Tìm số cụm tối ưu bằng Yellowbrick KElbowVisualizer
    kmeans = MiniBatchKMeans(random_state=42)
    visualizer = KElbowVisualizer(kmeans, k=(2, 11), timings=False,show=False)
    visualizer.fit(rfm_scaled)
    optimal_k = visualizer.elbow_value_
    
    # Kiểm tra nếu không tìm thấy elbow point
    if optimal_k is None:
        optimal_k = 4  # Giá trị mặc định nếu không tìm thấy
        print("Không tìm thấy điểm khuỷu tay, sử dụng k=4 mặc định")
    else:
        print(f"Số cụm tối ưu (k): {optimal_k}")

    # Phân cụm với MiniBatchKMeans (k=4 như bạn chọn)
    kmeans = MiniBatchKMeans(n_clusters=optimal_k, random_state=42)
    clusters = kmeans.fit_predict(rfm_scaled)

    # Tính Silhouette Score
    silhouette_avg = silhouette_score(rfm_scaled, clusters)
    print(f"Silhouette Score: {silhouette_avg}")

    # Lưu Silhouette Score vào model Shihoutte
    Shihoutte.objects.create(score=silhouette_avg)

    # Gắn cụm vào dataframe
    df_cleaned['Cluster'] = clusters

    # Cập nhật trường cluster trong database
    count = 0
    for _, row in df_cleaned.iterrows():
        count += 1
        if count in [100, 1000, 2000]:
            print(f"Đã xử lý đến dòng thứ {count}")
        Customer.objects.filter(customer_id=row['customer_id']).update(cluster=row['Cluster'])
    return redirect('home')

from django.shortcuts import render
from .models import Customer
from django.db.models import Count
from django.http import JsonResponse
def customer_segments(request):
    # Lấy tất cả khách hàng và nhóm theo cluster
    customers = Customer.objects.all().order_by('cluster')
    grouped_customers = {}
    
    # Nhóm khách hàng theo cluster
    for customer in customers:
        cluster = customer.cluster
        if cluster not in grouped_customers:
            grouped_customers[cluster] = []
        grouped_customers[cluster].append(customer)
    
    # Đếm số lượng khách hàng trong mỗi cụm
    cluster_counts = Customer.objects.values('cluster').annotate(count=Count('customer_id')).order_by('cluster')
    
    context = {
        'grouped_customers': grouped_customers,
        'cluster_counts': cluster_counts,
    }
    return render(request, 'customer_segments.html', context)

def customer_data_json(request):
    customers = Customer.objects.all().values(
        'customer_id', 'cluster', 'year_birth', 'income', 'kidhome', 'teenhome',
        'mnt_wines', 'mnt_fruits', 'mnt_meat_products', 'mnt_fish_products',
        'mnt_sweet_products', 'mnt_gold_prods', 'num_deals_purchases',
        'num_web_purchases', 'num_catalog_purchases', 'num_store_purchases'
    )
    return JsonResponse(list(customers), safe=False)
def visualizations(request):
    # Lấy Silhouette Score mới nhất
    silhouette_score = None
    try:
        latest_shihoutte = Shihoutte.objects.latest('id')
        silhouette_score = latest_shihoutte.score
    except Shihoutte.DoesNotExist:
        silhouette_score = None

    return render(request, 'visualizations.html', {
        'silhouette_score': silhouette_score
    })

def save_cluster_name(request):
    if request.method == 'POST':
        old_cluster = request.POST.get('cluster')  # Giá trị cluster cũ (số, dạng chuỗi)
        new_cluster_name = request.POST.get('cluster_name')  # Tên cụm mới
        try:
            # Kiểm tra cluster_name hợp lệ
            if not new_cluster_name:
                return JsonResponse({'status': 'error', 'message': 'Tên cụm không được để trống'}, status=400)
            
            # Cập nhật tất cả bản ghi có cluster cũ thành cluster mới
            updated = Customer.objects.filter(cluster=old_cluster).update(cluster=new_cluster_name)
            if updated > 0:
                return JsonResponse({'status': 'success', 'message': f'Cluster {old_cluster} renamed to "{new_cluster_name}"'})
            else:
                return JsonResponse({'status': 'error', 'message': f'No customers found in Cluster {old_cluster}'}, status=404)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)