import datetime
import pandas as pd
import pickle

# Функция выбора расширенных данных из датафрейма Биткоина (выбор всех данных):

def calculate_ema(df, period):
    ema = df['close'].ewm(span=period, adjust=False).mean()
    return ema

def draw_graph(ema_period=120):
    # Считываем датафрейм:
    with open('dataframe_1d.pkl', 'rb') as file:
        df = pickle.load(file)

    # Обрезаем ненужные столбцы из датафрейма:
    df = df.iloc[:, :6]

    # Присваиваем имена столбцам:
    df.columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']

    # Обрезаем строки до нужного количества (указываем количество свечей):
    df = df.head(6221)

    df = df.rename(
        columns={'Date': 'date', 'Open': 'open', 'High': 'high', 'Low': 'low', 'Close': 'close',
                 'Volume': 'volume'})
    df['date'] = pd.to_datetime(df['date'], unit='ms').dt.strftime('%Y-%m-%d')
    for col in df.columns[1:]:
        df[col] = pd.to_numeric(df[col]).round(2)

    # Считаем EMA с указанным ema_period
    ema_data = calculate_ema(df, ema_period)

    # Округляем значения EMA 120 до целых чисел
    ema_data = ema_data.round().astype(int)

    # Сохраняем EMA 120 в файл Excel
    ema_df = pd.DataFrame({'EMA 120': ema_data})
    ema_df.to_excel('ema_120.xlsx', index=False)

    # Сохраняем исходный датафрейм биткоина в файл Excel
    df.to_excel('data_btc.xlsx', index=False)

    # Определяем максимальную и минимальную цены из датафрейма:

    date_candle = df['date']
    open_price = df['open']
    high_price = df['high']
    low_price = df['low']
    close_price = df['close']
    volume_data = df['volume']

    data = {
        'date': date_candle,
        'open': open_price,
        'high': high_price,
        'low': low_price,
        'close': close_price,
        'volume': volume_data,
        'ema': ema_data
    }

    data['ema'] = ema_data
    return data

# Вызываем функцию для получения данных и EMA 120
data = draw_graph()
