export type OHLCV = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Asset = 'BTCUSDT' | 'XAUUSDT';

export type SignalType = 'BUY' | 'SELL' | 'NEUTRAL';

export type IndicatorSignal = 'bullish' | 'bearish' | 'neutral';

export type IndicatorValues = {
  rsi: number;
  rsiSignal: IndicatorSignal;
  ema9: number;
  ema21: number;
  emaSignal: IndicatorSignal;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  macdTrend: IndicatorSignal;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  bbSignal: IndicatorSignal;
};

export type SignalResult = {
  signal: SignalType;
  score: number;
  indicators: IndicatorValues;
  candles: OHLCV[];
  updatedAt: Date;
};
