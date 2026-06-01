import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type AccountStats = {
  id: string;
  name: string;
  winRate: number;
  wins: number;
  losses: number;
  totalPnl: number;
  totalTrades: number;
};

type SupabaseAccount = {
  id: string;
  name: string;
  trades: { win: boolean; pnl: number }[];
};

async function fetchLeaderboard(): Promise<AccountStats[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id, name, trades(win, pnl)')
    .order('name');

  if (error || !data) return [];

  return (data as SupabaseAccount[])
    .map(a => {
      const trades = a.trades ?? [];
      const wins = trades.filter(t => t.win).length;
      return {
        id: a.id,
        name: a.name,
        totalTrades: trades.length,
        wins,
        losses: trades.length - wins,
        winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
        totalPnl: trades.reduce((s, t) => s + t.pnl, 0),
      };
    })
    .sort((a, b) => {
      if (a.totalTrades === 0 && b.totalTrades === 0) return 0;
      if (a.totalTrades === 0) return 1;
      if (b.totalTrades === 0) return -1;
      return b.winRate - a.winRate;
    });
}

const LABEL: React.CSSProperties = {
  color: 'var(--ink-3)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

type Props = { activeId: string };

export function Leaderboard({ activeId }: Props) {
  const [stats, setStats] = useState<AccountStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard()
      .then(data => { setStats(data); setError(null); })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [activeId]); // Refresh when switching accounts

  if (loading) {
    return <p style={{ color: 'var(--ink-3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Loading leaderboard…</p>;
  }

  if (error) {
    return <p style={{ color: 'var(--red)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>Failed to load: {error}</p>;
  }

  if (stats.every(s => s.totalTrades === 0)) {
    return (
      <p style={{ color: 'var(--ink-3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
        No trades yet. Close a position to appear here.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 56px 56px 70px', gap: '0 8px', padding: '4px 8px', alignItems: 'center' }}>
        <span style={LABEL}>#</span>
        <span style={LABEL}>Player</span>
        <span style={{ ...LABEL, textAlign: 'right' }}>Win%</span>
        <span style={{ ...LABEL, textAlign: 'right' }}>W/L</span>
        <span style={{ ...LABEL, textAlign: 'right' }}>PnL</span>
      </div>

      {stats.map((s, i) => {
        const isActive = s.id === activeId;
        const noTrades = s.totalTrades === 0;
        const winColor = s.winRate >= 60 ? 'var(--green)' : s.winRate >= 50 ? 'var(--yellow)' : 'var(--red)';
        const pnlColor = s.totalPnl >= 0 ? 'var(--green)' : 'var(--red)';
        const rankColor = noTrades ? 'var(--ink-3)' : i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? '#cd7f32' : 'var(--ink-3)';

        return (
          <div
            key={s.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '20px 1fr 56px 56px 70px',
              gap: '0 8px',
              padding: '9px 8px',
              borderRadius: 6,
              background: isActive ? 'var(--surface2)' : 'transparent',
              border: isActive ? '1px solid var(--border)' : '1px solid transparent',
              alignItems: 'center',
            }}
          >
            <span style={{ color: rankColor, fontSize: 12, fontWeight: 700 }}>
              {noTrades ? '—' : i + 1}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
              {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--violet)', flexShrink: 0 }} />}
              <span style={{ color: isActive ? 'var(--ink)' : 'var(--ink-2)', fontSize: 12, fontWeight: isActive ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.name}
              </span>
            </div>
            <span style={{ color: noTrades ? 'var(--ink-3)' : winColor, fontSize: 12, fontWeight: 700, fontFamily: 'monospace', textAlign: 'right' }}>
              {noTrades ? '—' : `${s.winRate.toFixed(0)}%`}
            </span>
            <span style={{ color: 'var(--ink-3)', fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>
              {noTrades ? '—' : `${s.wins}/${s.losses}`}
            </span>
            <span style={{ color: noTrades ? 'var(--ink-3)' : pnlColor, fontSize: 11, fontWeight: 600, fontFamily: 'monospace', textAlign: 'right' }}>
              {noTrades ? '—' : `${s.totalPnl >= 0 ? '+' : ''}$${Math.abs(s.totalPnl).toFixed(0)}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
