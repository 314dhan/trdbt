import type { OHLCV, SignalResult, IndicatorValues, IndicatorSignal, SignalType, TPSL } from '../types';
import { calcRSI } from '../indicators/rsi';
import { calcEMA } from '../indicators/ema';
import { calcMACD } from '../indicators/macd';
import { calcBollinger } from '../indicators/bollinger';
import { calcATR } from '../indicators/atr';
import { calcRelativeVolume } from '../indicators/volume';

export function aggregate(candles: OHLCV[]): SignalResult {
  const closes = candles.map(c => c.close);
  const lastClose = closes.at(-1) ?? 0;

  // RSI(14): oversold/overbought
  const rsi = calcRSI(closes);
  const rsiSignal: IndicatorSignal = rsi < 30 ? 'bullish' : rsi > 70 ? 'bearish' : 'neutral';

  // EMA 9/21 short-term crossover
  const ema9arr = calcEMA(closes, 9);
  const ema21arr = calcEMA(closes, 21);
  const ema9 = ema9arr.at(-1) ?? 0;
  const ema21 = ema21arr.at(-1) ?? 0;
  const emaSignal: IndicatorSignal = ema9 > ema21 ? 'bullish' : ema9 < ema21 ? 'bearish' : 'neutral';

  // EMA 50/200 long-term trend
  const ema50arr = calcEMA(closes, 50);
  const ema200arr = calcEMA(closes, 200);
  const ema50 = ema50arr.at(-1) ?? 0;
  const ema200 = ema200arr.at(-1) ?? 0;
  const trendSignal: IndicatorSignal = ema50 > ema200 ? 'bullish' : ema50 < ema200 ? 'bearish' : 'neutral';

  // MACD: require histogram expanding (momentum confirmation, not just crossover)
  const macdResult = calcMACD(closes);
  const histogramExpanding = Math.abs(macdResult.histogram) > Math.abs(macdResult.prevHistogram);
  const macdTrend: IndicatorSignal =
    macdResult.histogram > 0 && histogramExpanding ? 'bullish' :
    macdResult.histogram < 0 && histogramExpanding ? 'bearish' : 'neutral';

  // Bollinger Bands: price outside bands
  const bb = calcBollinger(closes);
  const bbSignal: IndicatorSignal =
    lastClose < bb.lower ? 'bullish' :
    lastClose > bb.upper ? 'bearish' : 'neutral';

  // Relative volume (current vs 20-candle average)
  const relVolume = calcRelativeVolume(candles);
  const volumeSignal: IndicatorSignal =
    relVolume >= 1.3 ? 'bullish' :
    relVolume < 0.7 ? 'bearish' : 'neutral';

  const indicators: IndicatorValues = {
    rsi, rsiSignal,
    ema9, ema21, emaSignal,
    ema50, ema200, trendSignal,
    macd: macdResult.macd,
    macdSignal: macdResult.signal,
    macdHistogram: macdResult.histogram,
    macdTrend,
    bbUpper: bb.upper,
    bbMiddle: bb.middle,
    bbLower: bb.lower,
    bbSignal,
    relVolume,
    volumeSignal,
  };

  // 4 core votes: RSI, EMA crossover, MACD (with momentum), BB
  const coreSigs = [rsiSignal, emaSignal, macdTrend, bbSignal];
  let score = coreSigs.reduce((s, sig) => s + (sig === 'bullish' ? 1 : sig === 'bearish' ? -1 : 0), 0);

  // Volume boost: high volume +1 in signal direction, low volume -1 toward 0
  if (score !== 0) {
    if (relVolume >= 1.5) score += score > 0 ? 1 : -1;
    else if (relVolume < 0.7) score += score > 0 ? -1 : 1;
  }

  // Trend filter: opposing long-term trend reduces score by 1 toward 0
  if (score > 0 && trendSignal === 'bearish') score = Math.max(0, score - 1);
  if (score < 0 && trendSignal === 'bullish') score = Math.min(0, score + 1);

  // Higher threshold: 3+ required for directional signal
  const signal: SignalType = score >= 3 ? 'BUY' : score <= -3 ? 'SELL' : 'NEUTRAL';
  const trendAligned =
    (signal === 'BUY' && trendSignal === 'bullish') ||
    (signal === 'SELL' && trendSignal === 'bearish') ||
    signal === 'NEUTRAL';

  const absScore = Math.abs(score);
  const signalStrength: 'strong' | 'moderate' | 'weak' =
    absScore >= 4 ? 'strong' : absScore === 3 ? 'moderate' : 'weak';

  const atr = calcATR(candles);
  const SL_MULT = 1.5;
  // Adaptive TP: stronger signal earns wider target
  const TP_MULT = absScore >= 4 ? 4.0 : absScore === 3 ? 3.0 : 2.5;

  const tpsl: TPSL = {
    entry: lastClose,
    tp: signal === 'SELL' ? lastClose - TP_MULT * atr : lastClose + TP_MULT * atr,
    sl: signal === 'SELL' ? lastClose + SL_MULT * atr : lastClose - SL_MULT * atr,
    atr,
    rr: TP_MULT / SL_MULT,
  };

  return { signal, score, signalStrength, trendAligned, indicators, tpsl, candles, updatedAt: new Date() };
}
