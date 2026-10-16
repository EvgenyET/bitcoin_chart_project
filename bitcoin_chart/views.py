from rest_framework.views import APIView
from .data_btc import draw_graph
import logging
from django.core.cache import cache

logger = logging.getLogger(__name__)

class BitcoinDataView(APIView):
    def get(self, request):
        # Попробуйте получить значение ema_period из кеша
        ema_period_cached = cache.get('ema_period')

        # Если значение в кеше есть, используйте его, иначе используйте значение из query_params
        ema_period = int(request.query_params.get('ema_period', ema_period_cached or 120))

        # Обновляем данные с учетом нового ema_period
        data = draw_graph(ema_period)

        # Отдаем обновленные данные в API
        return Response(data)

from django.shortcuts import render

def index(request):
    return render(request, 'index.html')


# Код, который принимает ввод данных EMA с сервера и возвращает их обратно
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def calculate_ema_view(request):
    if request.method == 'POST':
        try:
            request_data = json.loads(request.body.decode('utf-8'))
            period = request_data.get('period')

            if period is not None:
                period = int(period)
                ema_data, trade_count, df = calculate_ema(period)  # Теперь функция возвращает три значения
                # Можно использовать ema_data и df по мере необходимости
                return JsonResponse({'Trade Count': trade_count})
            else:
                return JsonResponse({'error': 'Invalid request data'})
        except Exception as e:
            logger.error(f"Error processing request: {e}")
            return JsonResponse({'error': 'Invalid request data'})
    else:
        return JsonResponse({'error': 'Invalid request method'})


# Код, который возвращает в api данные о прибылях и убытках исходя из стратегии (после ввода данных пользователем):
from django.views.decorators.csrf import csrf_exempt
import json
from .strategy_ema import calculate_profit, calculate_ema

logger = logging.getLogger(__name__)

@csrf_exempt
def calculate_profit_view(request):
    if request.method == 'POST':
        try:
            request_data = json.loads(request.body.decode('utf-8'))
            ema_period = request_data.get('ema_period')
            close_data = request_data.get('close_data')
            initial_balance = request_data.get('initial_balance')

            # Преобразуем initial_balance и ema_period в числовые типы
            initial_balance = float(initial_balance) if initial_balance is not None else None
            ema_period = int(ema_period) if ema_period is not None else None

            if ema_period is not None and close_data is not None and initial_balance is not None:
                ema_data, _, df = calculate_ema(ema_period)  # Теперь возвращаем df из calculate_ema
                _, df_trade_data, final_profit, final_balance, trade_count, percent_profit, max_percent_loss, max_percent_profit, balance_hodl, balance_hodl_max_fixation = calculate_profit(ema_data, close_data, initial_balance, df)

                response_data = {
                    'data': df_trade_data.to_dict(orient='records'),
                    'final_profit': final_profit,
                    'final_balance': final_balance,
                    'trade_count': trade_count,  # Добавляем trade_count в ответ
                    'ema_period': ema_period,
                    'percent_profit': percent_profit,
                    'max_percent_loss': max_percent_loss,
                    'max_percent_profit': max_percent_profit,
                    'balance_hodl': balance_hodl,
                    'balance_hodl_max_fixation': balance_hodl_max_fixation,
                }

                # Сохраняем ema_data в кеше
                cache.set('ema_period', ema_period)

                # Добавляем отладочный вывод
                print(f"Saved ema_data in cache: {ema_period}")

                return JsonResponse(response_data)
            else:
                return JsonResponse({'error': 'Invalid request data'})
        except Exception as e:
            # Логируем ошибку
            logger.error(f"Error processing request: {e}")
            return JsonResponse({'error': 'Invalid request data'})
    else:
        return JsonResponse({'error': 'Invalid request method'})


from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse
from .strategy_ema import strategy_optimization
import logging

logger = logging.getLogger(__name__)

class StrategyOptimizationView(APIView):
    def post(self, request):
        logger.debug("Получен POST-запрос на оптимизацию стратегии")
        try:
            optimal_ema, initial_balance, optimization_results = strategy_optimization()
            logger.debug("Оптимизация стратегии выполнена успешно")
            return JsonResponse({
                'optimal_ema': optimal_ema,
                'initial_balance': initial_balance,
                'optimization_results': optimization_results.to_dict(orient='records')
            })
        except Exception as e:
            logger.error(f"Ошибка при оптимизации стратегии: {e}")
            return JsonResponse({'error': str(e)})