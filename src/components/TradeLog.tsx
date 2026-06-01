import type { ClosedTrade } from '../types';
import type { DemoStats } from '../store/demo';

type Props = { trades: ClosedTrade[]; stats: DemoStats };

type StrategyTip = { title: string; tips: string[] };

function getStrategyTip(winRate: number, totalTrades: number): StrategyTip | null {
  if (totalTrades < 5) return null;
  if (winRate < 30) {
    return {
      title: 'Strategy overhaul recommended',
      tips: [
        'Require 3+ indicators to agree (score ≥ 3) before entering any trade',
        'Switch to 4H or Daily timeframe — higher TF signals carry less noise',
        'Reduce leverage to 1–5× until win rate recovers above 50%',
        'Consider only trading in the direction of the Daily trend',
      ],
    };
  }
  if (winRate < 50) {
    return {
      title: 'Below breakeven — adjust your edge',
      tips: [
        'Only enter when EMA crossover and RSI both confirm the same direction',
        'Avoid 1m / 15m scalping — noise kills short-term win rate',
        'Widen SL to 2× ATR to survive normal price volatility',
        'Paper-trade a new strategy for 20+ signals before going live',
      ],
    };
  }
  if (winRate < 60) {
    return {
      title: 'Marginal edge — fine-tune entries',
      tips: [
        'Confirm 4H trend direction before acting on lower TF signals',
        'Skip signals where score is ±2 — wait for ±3 or ±4 conviction',
        'Take 50% profit at 1.5× ATR and trail the remaining position',
      ],
    };
  }
  return null;
}

function timeAgo(d: Date): string {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const LABEL: React.CSSProperties = {
  color: 'var(--ink-3)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

export function TradeLog({ trades, stats }: Props) {
  const tip = getStrategyTip(stats.winRate, stats.totalTrades);

  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  };

  if (stats.totalTrades === 0) {
    return (
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Trade Log</h3>
        <p style={{ color: 'var(--ink-3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
          No closed trades yet. Open a position from the Demo Account panel above.
        </p>
      </div>
    );
  }

  const winRateColor =
    stats.winRate >= 60
      ? 'var(--green)'
      : stats.winRate >= 50
      ? 'var(--yellow)'
      : 'var(--red)';

  return (
    <div style={card}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Trade Log</h3>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        {[
          { label: 'Win Rate', value: `${stats.winRate.toFixed(0)}%`, color: winRateColor },
          { label: 'W / L', value: `${stats.wins} / ${stats.losses}`, color: 'var(--ink)' },
          {
            label: 'Total PnL',
            value: `${stats.totalPnl >= 0 ? '+' : ''}$${Math.abs(stats.totalPnl).toFixed(2)}`,
            color: stats.totalPnl >= 0 ? 'var(--green)' : 'var(--red)',
          },
          { label: 'Trades', value: `${stats.totalTrades}`, color: 'var(--ink-2)' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{ background: 'var(--surface2)', padding: '10px 12px', textAlign: 'center' }}
          >
            <p style={LABEL}>{label}</p>
            <p
              style={{
                color,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: 'ui-monospace, monospace',
                marginTop: 4,
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Strategy tip (shown when win rate is low) */}
      {tip && (
        <div
          style={{
            background: 'var(--yellow-bg)',
            border: '1px solid var(--yellow)',
            borderRadius: 8,
            padding: '12px 14px',
          }}
        >
          <p style={{ color: 'var(--yellow)', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            ⚡ {tip.title}
          </p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {tip.tips.map((t, i) => (
              <li key={i} style={{ color: 'var(--ink-2)', fontSize: 12, marginBottom: 3 }}>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Trade history */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={LABEL}>Recent Trades</p>
        {trades.slice(0, 30).map(t => {
          const pnlStr = `${t.pnl >= 0 ? '+' : ''}$${Math.abs(t.pnl).toFixed(2)}`;
          const pnlColor = t.win ? 'var(--green)' : 'var(--red)';
          const reasonBg =
            t.closeReason === 'TP'
              ? 'var(--green-bg)'
              : t.closeReason === 'Liquidated'
              ? 'var(--red)'
              : t.closeReason === 'SL'
              ? 'var(--red-bg)'
              : 'var(--surface2)';
          const reasonColor =
            t.closeReason === 'TP'
              ? 'var(--green)'
              : t.closeReason === 'Liquidated'
              ? '#fff'
              : t.closeReason === 'SL'
              ? 'var(--red)'
              : 'var(--ink-3)';
          return (
            <div
              key={t.id}
              style={{
                background: 'var(--surface2)',
                borderRadius: 6,
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: t.direction === 'LONG' ? 'var(--green)' : 'var(--red)',
                    flexShrink: 0,
                  }}
                >
                  {t.direction}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-2)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.asset}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--ink-3)',
                    flexShrink: 0,
                  }}
                >
                  {t.leverage}×
                </span>
                <span
                  style={{
                    fontSize: 10,
                    background: reasonBg,
                    color: reasonColor,
                    padding: '1px 5px',
                    borderRadius: 3,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {t.closeReason}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    color: pnlColor,
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                >
                  {pnlStr}{' '}
                  <span style={{ fontSize: 10 }}>
                    ({t.pnlPct >= 0 ? '+' : ''}
                    {t.pnlPct.toFixed(1)}%)
                  </span>
                </span>
                <span style={{ color: 'var(--ink-3)', fontSize: 10 }}>{timeAgo(t.closedAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
