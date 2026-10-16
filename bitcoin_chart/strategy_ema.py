import datetime
import pandas as pd
import pickle
from tqdm import tqdm

def calculate_ema(ema_period, dataframe_path='dataframe_1d.pkl'):
    # Загрузка и обработка датафрейма
    with open(dataframe_path, 'rb') as file:
        df = pickle.load(file)

    # Выборка нужных столбцов и преобразование данных
    df = df.iloc[:, :6]  # Обрезаем ненужные столбцы из датафрейма:
    df.columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']  # Присваиваем имена столбцам
    df = df.head(6221)  # Обрезаем строки до нужного количества (указываем количество свечей):
    df = df.rename(columns={'Date': 'date', 'Open': 'open', 'High': 'high', 'Low': 'low', 'Close': 'close', 'Volume': 'volume'})
    df['date'] = pd.to_datetime(df['date'], unit='ms').dt.strftime('%Y-%m-%d')
    for col in df.columns[1:]:
        df[col] = pd.to_numeric(df[col]).round(2)

    # Расчет скользящего среднего (EMA)
    ema_data = df['close'].ewm(span=ema_period, adjust=False).mean().round().astype(int)

    # Подсчет количества сделок
    def count_trades(df, ema_data):
        in_trade = False
        trade_count = 0
        for i in range(1, len(df)):
            if ema_data[i] > df['close'][i] and not in_trade:
                in_trade = True
                trade_count += 1
            elif ema_data[i] < df['close'][i] and in_trade:
                in_trade = False
        return trade_count

    trade_count = count_trades(df, ema_data)

    # Возврат результатов функции
    return ema_data.tolist(), trade_count, df


# Функция расчёта прибыли и убытка, а также других параметров:
def calculate_profit(ema_data, close_data, initial_balance, df):

    # Преобразование списка close_data в Series
    close_series = pd.Series(close_data)

    # Составление DataFrame для расчета прибыли и убытка
    profit_df = pd.DataFrame({
        'close': close_series,
        'ema': pd.Series(ema_data),
        'date': df['date']
    })

    # Установка комиссии биржи и других начальных параметров
    percent = 0.075
    percentage_decimal = percent / 100
    trade_data = []
    in_trade = False
    balance = initial_balance
    buy_price = 0
    profit = 0

    # Анализ каждой строки в DataFrame для вычисления результатов сделок
    for i in range(len(profit_df)):
        close_price = profit_df['close'][i]
        date_trade = profit_df['date'][i]
        ema_value = profit_df['ema'][i]

        # Логика для открытия и закрытия сделок
        if close_price > ema_value and not in_trade:
            # Открытие сделки
            in_trade = True
            buy_price = close_price
            entry_date = date_trade

        elif close_price < ema_value and in_trade:
            # Закрытие сделки
            in_trade = False
            sell_price = close_price  # цена продажи
            trade_profit = round(sell_price - buy_price, 1)  # прибыль/убыток (в пунктах) (округляем значения)
            percentage_profit = round((sell_price - buy_price) / buy_price * 100, 1)  # прибыль/убыток (в процентах) (округляем значения)
            profit = round(((balance / buy_price) * sell_price) - balance, 1)  # профит ($) (округляем значения)
            percent_value = round(balance * percentage_decimal, 2) # процент биржи (округляем значения)
            balance = round(profit - percent_value + balance, 1)  # общий баланс ($) (округляем значения)

            # Вычисляем количество дней в сделке
            days_in_trade = (pd.to_datetime(date_trade) - pd.to_datetime(entry_date)).days

            # Добавляем данные о сделке в список
            trade_data.append({
                'дата открытия сделки': entry_date,
                'дата закрытия сделки': date_trade,
                'дней в сделке': days_in_trade,
                'цена покупки': buy_price,
                'цена продажи': sell_price,
                'прибыль/убыток (пт)': trade_profit,
                'прибыль/убыток (%)': f"{percentage_profit} %",
                'процент биржи': percent_value,
                'профит ($)': profit,
                'общий баланс ($)': balance
            })

    # После завершения симуляции, выводим общий профит и конечный баланс
    final_profit = balance - initial_balance
    final_balance = balance
    trade_count = len(trade_data)
    percent_profit = round((final_profit / initial_balance) * 100, 2)  # Расчет общего профита в процентах

    # Выводим DataFrame с данными о сделках
    df_trade_data = pd.DataFrame(trade_data)

    # Удаление символа процента и пробелов, а затем конвертация в числа с плавающей запятой (для верного расчёта максимальных и минимальных значений)
    df_trade_data['прибыль/убыток (%)'] = df_trade_data['прибыль/убыток (%)'].str.replace('%', '').astype(float)

    # Расчет максимального убытка за день в процентах
    max_percent_loss = df_trade_data['прибыль/убыток (%)'].min() if not df_trade_data.empty else None

    # Расчет максимальной прибыли за день в процентах
    max_percent_profit = df_trade_data['прибыль/убыток (%)'].max() if not df_trade_data.empty else None

    # Расчет показателей для стратегии HODL
    # Проверяем, что close_data не пустой и содержит более одного элемента
    if len(close_series) > 1:
        first_element = close_series.iloc[0]
        last_element = close_series.iloc[-1]
        max_close = close_series.max()

        # Убедитесь, что первый элемент не равен нулю перед выполнением деления
        if first_element != 0:
            balance_hodl = round(initial_balance * (last_element / first_element), 2)

            # Проверяем, что максимальное значение не равно нулю
            if max_close != 0:
                balance_hodl_max_fixation = round(initial_balance * (max_close / first_element), 2)
            else:
                balance_hodl_max_fixation = initial_balance
        else:
            balance_hodl = initial_balance
            balance_hodl_max_fixation = initial_balance
    else:
        balance_hodl = initial_balance
        balance_hodl_max_fixation = initial_balance

    # Сохраняем данные в базу данных или файл
    # df_trade_data.to_excel('trade_data.xlsx', index=False)

    return balance, df_trade_data, final_profit, final_balance, trade_count, percent_profit, max_percent_loss, max_percent_profit, balance_hodl, balance_hodl_max_fixation

# =========================================================================================================

# Функция для оптимизации торговой стратегии
def strategy_optimization(dataframe_path='dataframe_1d.pkl', initial_balance=135):
    ema_results = []  # Инициализация списка для результатов

    # Итерация по разным периодам EMA для оптимизации стратегии
    for ema_period in tqdm(range(1, 151), desc="Optimizing strategy", unit="EMA period"):
        # Вызов функции calculate_ema для получения данных EMA и количества сделок
        ema_data, trade_count, df = calculate_ema(ema_period, dataframe_path)

        # Вызов функции calculate_profit для расчета прибыли и других метрик
        balance, df_trade_data, final_profit, final_balance, _, _, max_percent_loss, max_percent_profit, balance_hodl, balance_hodl_max_fixation = calculate_profit(ema_data, df['close'], initial_balance, df)

        # Добавление результатов в список ema_results
        ema_results.append({
            'Длина EMA': ema_period,
            'Конечный баланс': final_balance,
            'Общий профит': final_profit,
            'Общий профит (%)': round((final_profit / initial_balance) * 100, 1),
            'Количество сделок': trade_count,
            'Максимальный убыток (%)': max_percent_loss,
            'Максимальная прибыль (%)': max_percent_profit
        })

    # Преобразование результатов в DataFrame и определение оптимального периода EMA
    df_results = pd.DataFrame(ema_results)

    # Находим оптимальное значение EMA, которое приносит максимальный профит
    optimal_ema = df_results.loc[df_results['Конечный баланс'].idxmax()]['Длина EMA']

    # Сохраняем результаты в файл (если нужно)
    # df_results.to_excel('ema_optimization_results.xlsx', index=False)

    return optimal_ema, initial_balance, df_results