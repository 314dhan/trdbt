import type { IndicatorValues, IndicatorSignal } from '../types';

const sigColor: Record<IndicatorSignal, string> = {
  bullish: 'var(--green)',
  bearish: 'var(--red)',
  neutral: 'var(--yellow)',
};
const sigLabel: Record<IndicatorSignal, string> = {
  bullish: '▲ Bullish',
  bearish: '▼ Bearish',
  neutral: '► Neutral',
};
const volLabel: Record<IndicatorSignal, string> = {
  bullish: '▲ High',
  bearish: '▼ Low',
  neutral: '► Normal',
};

function Row({
  name,
  value,
  signal,
  labels,
}: {
  name: string;
  value: string;
  signal: IndicatorSignal;
  labels?: Record<IndicatorSignal, string>;
}) {
  const l = labels ?? sigLabel;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--ink-2)', fontSize: 13 }}>{name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: 'var(--ink)', fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>{value}</span>
        <span style={{ color: sigColor[signal], fontSize: 11, fontWeight: 600, minWidth: 76, textAlign: 'right' }}>{l[signal]}</span>
      </div>
    </div>
  );
}

type Props = { indicators: IndicatorValues; price: number };

export function IndicatorPanel({ indicators: iv, price }: Props) {
  const f = (n: number, d = 2) => n.toFixed(d);
  const fp = (n: number) => n > 999 ? f(n, 2) : n > 1 ? f(n, 4) : f(n, 6);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px' }}>
      <p style={{ color: 'var(--ink-3)', fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Indicators</p>
      <Row name="RSI (14)" value={f(iv.rsi)} signal={iv.rsiSignal} />
      <Row name="EMA 9 / 21" value={`${fp(iv.ema9)} / ${fp(iv.ema21)}`} signal={iv.emaSignal} />
      <Row name="EMA 50 / 200" value={`${fp(iv.ema50)} / ${fp(iv.ema200)}`} signal={iv.trendSignal} />
      <Row name="MACD (12, 26, 9)" value={`${fp(iv.macd)} / ${fp(iv.macdSignal)}`} signal={iv.macdTrend} />
      <Row name="Bollinger (20)" value={`${fp(iv.bbLower)} – ${fp(iv.bbUpper)}`} signal={iv.bbSignal} />
      <Row name="Volume (Rel)" value={`${iv.relVolume.toFixed(2)}×`} signal={iv.volumeSignal} labels={volLabel} />
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 2 }}>
        <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>Price</span>
        <span style={{ color: 'var(--ink)', fontSize: 13, fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>{fp(price)}</span>
      </div>
    </div>
  );
}
