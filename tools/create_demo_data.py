"""Create synthetic OHLCV data for a local demo, never download market data."""
from pathlib import Path
import math
import pandas as pd


def create_demo_data(destination):
    destination = Path(destination)
    if destination.exists():
        raise FileExistsError('Refusing to replace existing candle data: ' + str(destination))
    dates = pd.date_range('2023-01-01', periods=180, freq='D')
    rows = []
    for i, date in enumerate(dates):
        close = round(100 + 20 * math.sin(i / 6) + i / 10, 2)
        rows.append([int(date.timestamp() * 1000), close - 1, close + 2, close - 2, close, 1000 + i])
    pd.DataFrame(rows).to_pickle(destination)
    return destination


if __name__ == '__main__':
    target = Path(__file__).resolve().parents[1] / 'dataframe_1d.pkl'
    print('Synthetic demo data created:', create_demo_data(target))
