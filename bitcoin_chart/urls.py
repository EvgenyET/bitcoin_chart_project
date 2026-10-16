from django.urls import path
from .views import BitcoinDataView, StrategyOptimizationView
from . import views

urlpatterns = [
    path('api/bitcoin-data/', BitcoinDataView.as_view(), name='bitcoin-data'),
    path('calculate_ema/', views.calculate_ema_view, name='calculate_ema'),
    path('calculate_profit/', views.calculate_profit_view, name='calculate_profit'),  # Новый URL для данных о прибылях и убытках
    path('strategy_optimization/', StrategyOptimizationView.as_view(), name='strategy_optimization'),  # Новый URL для результатов оптимизации стратегии
]