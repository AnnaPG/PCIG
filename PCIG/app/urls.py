from django.urls import path, re_path
from app import views

urlpatterns = [
    # Views
    # Matches any .html file
    path('', views.index, name='index'),
    path('index.html', views.index, name='index'),
    path('about.html', views.any_html, name='about'),
    path('glossary.html', views.any_html, name='glossary'),
    path('sources.html', views.any_html, name='sources'),
    # Ajax calls
    path('get_freq_types/', views.get_freq_types, name='get-freq-types'),
    path('get_data_counters/', views.get_data_counters, name='get-data-counters'),
    path('get_charts_data/', views.get_charts_data, name='get-charts-data'),
    path('get_cancer_types/', views.get_cancer_types, name='get-cancer-types'),  
    path('get_data_report/', views.get_data_report, name='get-data-report'),
    path('get_data_boxplot/', views.get_data_boxplot, name='get-data-boxplot'),
    path('get_user_guide/', views.get_user_guide, name='get-user-guide')
]


    
    
