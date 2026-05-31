import type { SignalResult, Mode } from '../types';

const CONFIG: Record<string, Record<string, { color: string; bg: string; label: string }>> = {
  spot: {
    BUY:     { color: 'var(--green)',  bg: 'var(--green-bg)',  label: '↑ BUY' },
    SELL:    { color: 'var(--red)',    bg: 'var(--red-bg)',    label: '↓ SELL' },
    NEUTRAL: { color: 'var(--yellow)', bg: 'var(--yellow-bg)', label: '→ NEUTRAL' },
  },
  futures: {
    BUY:     { color: 'var(--green)',  bg: 'var(--green-bg)',  label: '↑ LONG' },
    SELL:    { color: 'var(--red)',    bg: 'var(--red-bg)',    label: '↓ SHORT' },
    NEUTRAL: { color: 'var(--yellow)', bg: 'var(--yellow-bg)', label: '→ NEUTRAL' },
  },
};

type Props = { result: SignalResult; asset: string; mode: Mode };

export function SignalCard({ result, asset, mode }: Props) {
  const { signal, score, updatedAt, tpsl } = result;
  const c = CONFIG[mode][signal];
  const fp = (n: number) => n > 999 ? n.toFixed(2) : n > 1 ? n.toFixed(4) : n.toFixed(6);
  const showTpSl = signal !== 'NEUTRAL';

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Signal badge row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <p style={{ color: 'var(--ink-3)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{asset}</p>
            {mode === 'futures' && <span style={{ background: 'var(--violet)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.06em' }}>PERP</span>}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: c.bg, borderRadius: 'var(--radius-sm)', padding: '8px 18px' }}>
            <span style={{ color: c.color, fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em' }}>{c.label}</span>
          </div>
          <p style={{ color: c.color, fontSize: 12, fontWeight: 600, marginTop: 6 }}>
            {score > 0 ? `+${score}` : score} of 4 indicators agree
          </p>
        </div>

        {/* Score dots */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {[1, 2, 3, 4].map(i => {
            const filled = Math.abs(score) >= i;
            const color = score > 0 ? 'var(--green)' : score < 0 ? 'var(--red)' : 'var(--ink-3)';
            return (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: filled ? color : 'var(--surface2)', border: `1px solid ${filled ? color : 'var(--border)'}`, transition: 'background 0.2s' }} />
            );
          })}
          <p style={{ color: 'var(--ink-3)', fontSize: 10, marginTop: 2 }}>{updatedAt.toLocaleTimeString()}</p>
        </div>
      </div>

      {/* TP / SL */}
      {showTpSl && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {[
            { label: 'Entry', value: fp(tpsl.entry), color: 'var(--ink)' },
            { label: 'Take Profit', value: fp(tpsl.tp), color: 'var(--green)' },
            { label: 'Stop Loss',  value: fp(tpsl.sl), color: 'var(--red)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--surface2)', padding: '10px 12px', textAlign: 'center' }}>
              <p style={{ color: 'var(--ink-3)', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
              <p style={{ color, fontSize: 13, fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>{value}</p>
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1', background: 'var(--surface2)', borderTop: '1px solid var(--border)', padding: '7px 12px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>ATR(14): <span style={{ color: 'var(--ink-2)', fontFamily: 'monospace' }}>{fp(tpsl.atr)}</span></span>
            <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>R:R <span style={{ color: 'var(--ink-2)', fontFamily: 'monospace' }}>1:{tpsl.rr.toFixed(1)}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}
