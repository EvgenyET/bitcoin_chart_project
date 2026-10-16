# bitcoin_chart_project

Обзор исходного кода для портфолио. Названия и структура авторских файлов сохранены.

Django-приложение: графики криптовалют, настройка EMA, проверка стратегии на истории и сравнение с удержанием монеты.

## Состав
```text
  get_data_btc_binance_1d.py
  get_data_btc_binance_1h.py
  get_data_coin_binance.py
  manage.py
  requirements.txt
  bitcoin_chart/__init__.py
  bitcoin_chart/admin.py
  bitcoin_chart/apps.py
  bitcoin_chart/data_btc.py
  bitcoin_chart/models.py
  bitcoin_chart/strategy_ema.py
  bitcoin_chart/urls.py
  bitcoin_chart/views.py
  bitcoin_chart/migrations/0001_initial.py
  bitcoin_chart/migrations/__init__.py
  bitcoin_chart_project/__init__.py
  bitcoin_chart_project/asgi.py
  bitcoin_chart_project/settings.py
  bitcoin_chart_project/urls.py
  bitcoin_chart_project/wsgi.py
  static/css/chart.css
  static/css/sidebar.css
  static/js/chart.js
  templates/index.html
  templates/rest_framework/api.html
```

## Публикация
Логика исходников не перерабатывалась. Чувствительные значения и пустые поля доступа обозначены `YOUR_...` / `REDACTED_SECRET_SET_IN_ENV`. Это заглушки, а не действующие доступы. Настройки через переменные окружения перечислены в `.env.example`, когда они есть в коде.

Окружения Python, сторонние библиотеки, базы данных, токены, журналы, обученные модели и массивы рыночных данных не включены. Это компактная копия для чтения; для запуска исторических проектов могут понадобиться собственные настройки, данные, модели и совместимые зависимости. Наличие requirements.txt не означает, что старые API проверены сегодня.

Сгенерированные HTML-графики со встроенной библиотекой Plotly также не включены: нет таких файлов в отобранном наборе. Их создают исходные Python-скрипты; визуальный результат доступен в галерее.

## Даты
Начало - октябрь 2023. Изменения - ноябрь-декабрь 2023, октябрь и декабрь 2025.

Скриншоты и описание находятся в каталоге портфолио. Видео будет добавлено отдельно.
