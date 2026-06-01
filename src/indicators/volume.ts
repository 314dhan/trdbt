import type { OHLCV } from '../types';

export function calcRelativeVolume(candles: OHLCV[], period = 20): number {
  if (candles.length < 2) return 1;
  const lookback = candles.slice(-period - 1, -1);
  if (lookback.length === 0) return 1;
  const avg = lookback.reduce((s, c) => s + c.volume, 0) / lookback.length;
  return avg === 0 ? 1 : (candles.at(-1)!.volume / avg);
}
