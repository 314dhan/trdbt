import type { IndicatorValues, IndicatorSignal } from '../types';

const dot: Record<IndicatorSignal, string> = {
  bullish: 'text-emerald-400',
  bearish: 'text-red-400',
  neutral: 'text-yellow-400',
};
const label: Record<IndicatorSignal, string> = {
  bullish: '▲ Bullish',
  bearish: '▼ Bearish',
  neutral: '► Neutral',
};

function Row({ name, value, signal }: { name: string; value: string; signal: IndicatorSignal }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
      <span className="text-slate-300 text-sm">{name}</span>
      <div className="flex items-center gap-3">
        <span className="text-white text-sm font-mono">{value}</span>
        <span className={`${dot[signal]} text-xs font-semibold w-20 text-right`}>{label[signal]}</span>
      </div>
    </div>
  );
}

type Props = { indicators: IndicatorValues; price: number };

export function IndicatorPanel({ indicators: iv, price }: Props) {
  const f = (n: number, d = 2) => n.toFixed(d);
  const fp = (n: number) => n > 999 ? f(n, 2) : f(n, 4);
  return (
    <div className="rounded-2xl bg-slate-800 p-5">
      <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Indicators</h3>
      <Row name="RSI (14)" value={f(iv.rsi)} signal={iv.rsiSignal} />
      <Row name="EMA (9 / 21)" value={`${fp(iv.ema9)} / ${fp(iv.ema21)}`} signal={iv.emaSignal} />
      <Row name="MACD (12,26,9)" value={`${fp(iv.macd)} / ${fp(iv.macdSignal)}`} signal={iv.macdTrend} />
      <Row name="Bollinger (20)" value={`${fp(iv.bbLower)} – ${fp(iv.bbUpper)}`} signal={iv.bbSignal} />
      <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between text-xs text-slate-500">
        <span>Price</span>
        <span className="text-white font-mono font-semibold">{fp(price)}</span>
      </div>
    </div>
  );
}
