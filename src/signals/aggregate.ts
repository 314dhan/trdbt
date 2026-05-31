import type { OHLCV, SignalResult, IndicatorValues, IndicatorSignal, SignalType, TPSL } from '../types';
import { calcRSI } from '../indicators/rsi';
import { calcEMA } from '../indicators/ema';
import { calcMACD } from '../indicators/macd';
import { calcBollinger } from '../indicators/bollinger';
import { calcATR } from '../indicators/atr';

export function aggregate(candles: OHLCV[]): SignalResult {
  const closes = candles.map(c => c.close);
  const lastClose = closes.at(-1) ?? 0;

  const rsi = calcRSI(closes);
  const rsiSignal: IndicatorSignal = rsi < 30 ? 'bullish' : rsi > 70 ? 'bearish' : 'neutral';

  const ema9arr = calcEMA(closes, 9);
  const ema21arr = calcEMA(closes, 21);
  const ema9 = ema9arr.at(-1) ?? 0;
  const ema21 = ema21arr.at(-1) ?? 0;
  const emaSignal: IndicatorSignal = ema9 > ema21 ? 'bullish' : ema9 < ema21 ? 'bearish' : 'neutral';

  const macdResult = calcMACD(closes);
  const macdTrend: IndicatorSignal =
    macdResult.macd > macdResult.signal ? 'bullish' :
    macdResult.macd < macdResult.signal ? 'bearish' : 'neutral';

  const bb = calcBollinger(closes);
  const bbSignal: IndicatorSignal =
    lastClose < bb.lower ? 'bullish' :
    lastClose > bb.upper ? 'bearish' : 'neutral';

  const indicators: IndicatorValues = {
    rsi, rsiSignal,
    ema9, ema21, emaSignal,
    macd: macdResult.macd,
    macdSignal: macdResult.signal,
    macdHistogram: macdResult.histogram,
    macdTrend,
    bbUpper: bb.upper,
    bbMiddle: bb.middle,
    bbLower: bb.lower,
    bbSignal,
  };

  const sigs = [rsiSignal, emaSignal, macdTrend, bbSignal];
  const score = sigs.reduce((s, sig) => s + (sig === 'bullish' ? 1 : sig === 'bearish' ? -1 : 0), 0);
  const signal: SignalType = score >= 2 ? 'BUY' : score <= -2 ? 'SELL' : 'NEUTRAL';

  const atr = calcATR(candles);
  const SL_MULT = 1.5;
  const TP_MULT = 3.0;
  const tpsl: TPSL = {
    entry: lastClose,
    tp: signal === 'SELL' ? lastClose - TP_MULT * atr : lastClose + TP_MULT * atr,
    sl: signal === 'SELL' ? lastClose + SL_MULT * atr : lastClose - SL_MULT * atr,
    atr,
    rr: TP_MULT / SL_MULT,
  };

  return { signal, score, indicators, tpsl, candles, updatedAt: new Date() };
}
