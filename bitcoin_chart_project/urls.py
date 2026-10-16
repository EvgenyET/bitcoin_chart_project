from django.contrib import admin
from django.urls import path, include
from bitcoin_chart import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index, name='index'),
    path('', include('bitcoin_chart.urls')),  # Добавьте этот маршрут для корневого URL
]