import type { OHLCV, Timeframe } from '../types';

const BASE = 'https://api.bybit.com';

type KlineResponse = { retCode: number; retMsg: string; result: { list: string[][] } };

function parseKlines(json: KlineResponse): OHLCV[] {
  if (json.retCode !== 0) throw new Error(`Bybit: ${json.retMsg}`);
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

export async function fetchKlines(symbol: string, category: 'spot' | 'linear', interval: Timeframe = '60', limit = 200): Promise<OHLCV[]> {
  const url = new URL(`${BASE}/v5/market/kline`);
  url.searchParams.set('category', category);
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('interval', interval);
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString());
  if (res.status === 429) {
    await new Promise(r => setTimeout(r, 2000));
    const retry = await fetch(url.toString());
    if (!retry.ok) throw new Error(`Bybit rate limited (${retry.status})`);
    return parseKlines(await retry.json() as KlineResponse);
  }
  if (!res.ok) throw new Error(`Bybit API error: ${res.status}`);
  return parseKlines(await res.json() as KlineResponse);
}
