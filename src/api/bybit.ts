import type { Asset, OHLCV } from '../types';

const BASE = 'https://api.bybit.com';
const CATEGORY: Record<Asset, string> = { BTCUSDT: 'spot', XAUUSDT: 'linear' };

export async function fetchKlines(asset: Asset, interval = '60', limit = 200): Promise<OHLCV[]> {
  const url = new URL(`${BASE}/v5/market/kline`);
  url.searchParams.set('category', CATEGORY[asset]);
  url.searchParams.set('symbol', asset);
  url.searchParams.set('interval', interval);
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Bybit API error: ${res.status}`);

  const json = await res.json() as {
    retCode: number;
    retMsg: string;
    result: { list: string[][] };
  };

  if (json.retCode !== 0) throw new Error(`Bybit: ${json.retMsg}`);

  // Bybit returns newest first: [startTime, open, high, low, close, volume, turnover]
  return json.result.list
    .reverse()
    .map(([t, o, h, l, c, v]) => ({
      time: Math.floor(Number(t) / 1000),
      open: Number(o),
      high: Number(h),
      low: Number(l),
      close: Number(c),
      volume: Number(v),
    }));
}
