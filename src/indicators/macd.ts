import { calcEMA } from './ema';

export type MACDResult = { macd: number; signal: number; histogram: number; prevHistogram: number };

export function calcMACD(closes: number[], fast = 12, slow = 26, signal = 9): MACDResult {
  const fastEMA = calcEMA(closes, fast);
  const slowEMA = calcEMA(closes, slow);
  const macdLine = fastEMA.map((f, i) => f - slowEMA[i]);
  const validMACD = macdLine.slice(slow - 1);
  const signalLine = calcEMA(validMACD, signal);
  const lastMACD = validMACD.at(-1) ?? 0;
  const lastSignal = signalLine.at(-1) ?? 0;
  const prevMACD = validMACD.at(-2) ?? lastMACD;
  const prevSignal = signalLine.at(-2) ?? lastSignal;
  return {
    macd: lastMACD,
    signal: lastSignal,
    histogram: lastMACD - lastSignal,
    prevHistogram: prevMACD - prevSignal,
  };
}
