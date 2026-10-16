import os
import pandas as pd
from binance.client import Client
import pickle

'''Загружаем данные Биткоина с биржи Binance:'''

user_key = os.environ['BINANCE_API_KEY']
secret_key = os.environ['BINANCE_API_SECRET']
binance_client = Client(user_key, secret_key)

binance_client.futures_symbol_ticker(symbol='DOGEUSDT')

binance_client.futures_historical_klines(
    symbol='DOGEUSDT',
    interval='1h',  # can play with this e.g. '1h', '4h', '1w', etc.
    start_str='2021-01-29',
    end_str='2021-05-18'
)

df = pd.DataFrame(binance_client.futures_historical_klines(
    symbol='DOGEUSDT',
    interval='1h',
    start_str='2021-01-29',
    end_str='2021-05-18'
))

df.head()


'''Сохраняем датафрейм BTC (с биржи Binance) на жесткий диск,
 чтобы не грузить его постоянно из сети:'''

with open('dataframe_doge_30m.pkl', 'wb') as file:
    pickle.dump(df, file)

print('Загрузка данных часового таймфрейма (1h) закончена.')