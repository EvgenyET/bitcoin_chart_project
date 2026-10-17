"""Django integration and calculation checks using generated local candles."""
import os
import logging
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import pandas as pd
from tools.create_demo_data import create_demo_data

TEMP = tempfile.TemporaryDirectory()
PREVIOUS_CWD = Path.cwd()
os.chdir(TEMP.name)
create_demo_data('dataframe_1d.pkl')
os.environ['DJANGO_SETTINGS_MODULE'] = 'bitcoin_chart_project.settings'
os.environ['DJANGO_SECRET_KEY'] = 'YOUR_TEST_ONLY_DJANGO_SECRET'
import django
django.setup()
from django.test import Client, SimpleTestCase, override_settings
from bitcoin_chart.strategy_ema import calculate_ema, calculate_profit


def tearDownModule():
    logging.shutdown()
    os.chdir(PREVIOUS_CWD)
    TEMP.cleanup()


class StrategyTests(unittest.TestCase):
    def test_ema_matches_hand_calculated_three_candles(self):
        data = pd.DataFrame([[1672531200000 + i * 86400000, p, p, p, p, 1] for i, p in enumerate([10, 20, 30])])
        data.to_pickle('three-candles.pkl')
        ema, _, frame = calculate_ema(3, 'three-candles.pkl')
        self.assertEqual(ema, [10, 15, 22])
        self.assertEqual(frame['date'].tolist(), ['2023-01-01', '2023-01-02', '2023-01-03'])

    def test_closed_trade_includes_commission_and_duration(self):
        frame = pd.DataFrame({'date': ['2023-01-01', '2023-01-02', '2023-01-03']})
        result = calculate_profit([90, 90, 125], [100, 110, 120], 1000, frame)
        self.assertEqual(result[4], 1)
        self.assertAlmostEqual(result[3], 1199.2)
        self.assertEqual(result[1].iloc[0]['дней в сделке'], 2)
        self.assertEqual(result[8], 1200)

    @unittest.expectedFailure
    def test_no_completed_trades_should_keep_initial_balance(self):
        # Known limitation of the preserved source: an empty trade table raises KeyError.
        frame = pd.DataFrame({'date': ['2023-01-01', '2023-01-02']})
        result = calculate_profit([20, 20], [10, 11], 1000, frame)
        self.assertEqual(result[3], 1000)
        self.assertEqual(result[4], 0)


@override_settings(ALLOWED_HOSTS=['testserver'])
class DjangoIntegrationTests(SimpleTestCase):
    def setUp(self):
        self.client = Client()
        network = patch('requests.sessions.Session.request', side_effect=AssertionError('No external requests in tests'))
        network.start()
        self.addCleanup(network.stop)

    def test_home_page_renders(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'<html', response.content.lower())

    def test_candle_api_returns_ohlcv_and_ema(self):
        response = self.client.get('/api/bitcoin-data/?ema_period=10', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['close']), 180)
        self.assertEqual(len(data['ema']), 180)
        self.assertEqual(set(data), {'date', 'open', 'high', 'low', 'close', 'volume', 'ema'})

    def test_ema_api_handles_valid_and_invalid_requests(self):
        self.assertIn('Trade Count', self.client.post('/calculate_ema/', data={'period': 10}, content_type='application/json').json())
        self.assertEqual(self.client.post('/calculate_ema/', data={}, content_type='application/json').json()['error'], 'Invalid request data')
        self.assertEqual(self.client.get('/calculate_ema/').json()['error'], 'Invalid request method')


if __name__ == '__main__':
    unittest.main()
