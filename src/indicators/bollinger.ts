export type BollingerResult = { upper: number; middle: number; lower: number };

export function calcBollinger(closes: number[], period = 20, mult = 2): BollingerResult {
  if (closes.length < period) return { upper: 0, middle: 0, lower: 0 };
  const slice = closes.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(slice.reduce((s, c) => s + (c - middle) ** 2, 0) / period);
  return { upper: middle + mult * std, middle, lower: middle - mult * std };
}
