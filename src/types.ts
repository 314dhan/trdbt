export type OHLCV = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Mode = 'spot' | 'futures';

export type AssetConfig = {
  symbol: string;
  category: 'spot' | 'linear';
  label: string;
  mode: Mode;
};

export const ASSET_CONFIGS: AssetConfig[] = [
  { symbol: 'BTCUSDT', category: 'spot',   label: 'BTC / USDT', mode: 'spot' },
  { symbol: 'ETHUSDT', category: 'spot',   label: 'ETH / USDT', mode: 'spot' },
  { symbol: 'XAUUSDT', category: 'linear', label: 'XAU / USDT', mode: 'spot' },
  { symbol: 'BTCUSDT', category: 'linear', label: 'BTC Perp',   mode: 'futures' },
  { symbol: 'ETHUSDT', category: 'linear', label: 'ETH Perp',   mode: 'futures' },
  { symbol: 'SOLUSDT', category: 'linear', label: 'SOL Perp',   mode: 'futures' },
  { symbol: 'XAUUSDT', category: 'linear', label: 'XAU Perp',   mode: 'futures' },
];

export type Timeframe = '1' | '15' | '60' | '240' | 'D' | 'W' | 'M';

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  '1': '1m', '15': '15m', '60': '1h', '240': '4h', 'D': '1D', 'W': '1W', 'M': '1M',
};

export const SCALPING_TIMEFRAMES: Timeframe[] = ['1', '15'];

export function refreshInterval(tf: Timeframe): number {
  if (tf === '1') return 10_000;
  if (tf === '15') return 15_000;
  return 30_000;
}

export type TradeDirection = 'LONG' | 'SHORT';
export type MarginMode = 'isolated' | 'cross';

export type OpenPosition = {
  id: string;
  asset: string;
  symbol: string;
  direction: TradeDirection;
  entry: number;
  tp: number;
  sl: number;
  liqPrice: number;
  size: number;
  leverage: number;
  marginMode: MarginMode;
  openedAt: Date;
};

export type ClosedTrade = {
  id: string;
  asset: string;
  symbol: string;
  direction: TradeDirection;
  entry: number;
  exitPrice: number;
  size: number;
  leverage: number;
  pnl: number;
  pnlPct: number;
  win: boolean;
  openedAt: Date;
  closedAt: Date;
  closeReason: 'TP' | 'SL' | 'Manual' | 'Liquidated';
};

export type DemoAccount = {
  balance: number;
  leverage: number;
  marginMode: MarginMode;
  positions: OpenPosition[];
  trades: ClosedTrade[];
};

export const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 15, 20, 25, 50, 75, 100, 125, 150, 200, 250] as const;

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

export type TPSL = {
  entry: number;
  tp: number;
  sl: number;
  atr: number;
  rr: number; // risk/reward ratio
};

export type SignalResult = {
  signal: SignalType;
  score: number;
  indicators: IndicatorValues;
  tpsl: TPSL;
  candles: OHLCV[];
  updatedAt: Date;
};
