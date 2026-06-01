import { useState, useEffect } from 'react';
import type { DemoAccount, AssetConfig, SignalResult, Mode, MarginMode } from '../types';
import { LEVERAGE_OPTIONS } from '../types';
import type { DemoStats } from '../store/demo';

type Props = {
  account: DemoAccount;
  stats: DemoStats;
  mode: Mode;
  activeAsset: AssetConfig;
  currentResult: SignalResult | undefined;
  currentPrices: Record<string, number>;
  onSetBalance: (b: number) => void;
  onSetLeverage: (l: number) => void;
  onSetMarginMode: (m: MarginMode) => void;
  onOpenTrade: (asset: AssetConfig, result: SignalResult, size: number, leverage: number, entry?: number, tp?: number, sl?: number) => void;
  onCloseTrade: (id: string, exitPrice: number, reason: 'Manual') => void;
  onReset: (balance: number) => void;
};

const fp = (n: number) => (n > 999 ? n.toFixed(2) : n > 1 ? n.toFixed(4) : n.toFixed(6));
const usd = (n: number) => `$${n.toFixed(2)}`;

const leverageBtn = (active: boolean): React.CSSProperties => ({
  padding: '4px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
  border: `1px solid ${active ? 'var(--violet)' : 'var(--border)'}`,
  background: active ? 'var(--violet)' : 'transparent',
  color: active ? '#fff' : 'var(--ink-3)',
  transition: 'all 0.15s',
});

const btn = (bg: string, dim?: boolean): React.CSSProperties => ({
  padding: '6px 12px',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  border: `1px solid ${dim ? 'var(--border)' : 'transparent'}`,
  background: dim ? 'transparent' : bg,
  color: dim ? 'var(--ink-3)' : '#fff',
  transition: 'all 0.15s',
});

const LABEL: React.CSSProperties = {
  color: 'var(--ink-3)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 4,
};

const ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
};

export function DemoPanel({
  account,
  mode,
  activeAsset,
  currentResult,
  currentPrices,
  onSetBalance,
  onSetLeverage,
  onSetMarginMode,
  onOpenTrade,
  onCloseTrade,
  onReset,
}: Props) {
  const [tradeSize, setTradeSize] = useState(100);
  const [customEntry, setCustomEntry] = useState('');
  const [customTp, setCustomTp] = useState('');
  const [customSl, setCustomSl] = useState('');
  const [showBalEdit, setShowBalEdit] = useState(false);
  const [balInput, setBalInput] = useState(account.balance.toFixed(2));
  const [showReset, setShowReset] = useState(false);
  const [resetBal, setResetBal] = useState('10000');

  const unrealizedPnl = account.positions.reduce((sum, pos) => {
    const price = currentPrices[pos.symbol];
    if (price === undefined) return sum;
    const diff = pos.direction === 'LONG' ? price - pos.entry : pos.entry - price;
    return sum + Math.max(-pos.size, (diff / pos.entry) * pos.size * pos.leverage);
  }, 0);

  const equity = account.balance + unrealizedPnl;
  const effectiveLeverage = account.leverage;

  // Sync TP/SL defaults when signal entry price changes (new asset or new candle)
  useEffect(() => {
    if (!currentResult) return;
    setCustomEntry(fp(currentResult.tpsl.entry));
    setCustomTp(fp(currentResult.tpsl.tp));
    setCustomSl(fp(currentResult.tpsl.sl));
  }, [currentResult?.tpsl.entry, activeAsset.symbol]);

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Demo Account</h3>
          <span
            style={{
              background: 'var(--violet)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 4,
              letterSpacing: '0.06em',
            }}
          >
            PAPER
          </span>
        </div>
        <button onClick={() => setShowReset(true)} style={btn('var(--surface2)', true)}>
          Reset
        </button>
      </div>

      {/* Balance / Equity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px' }}>
          <p style={LABEL}>Balance</p>
          {showBalEdit ? (
            <div style={ROW}>
              <input
                type="number"
                value={balInput}
                onChange={e => setBalInput(e.target.value)}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '5px 8px',
                  color: 'var(--ink)',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  width: 90,
                }}
                min="1"
                step="100"
              />
              <button
                style={btn('var(--green)')}
                onClick={() => {
                  const v = parseFloat(balInput);
                  if (v > 0) onSetBalance(v);
                  setShowBalEdit(false);
                }}
              >
                ✓
              </button>
              <button style={btn('var(--surface2)', true)} onClick={() => setShowBalEdit(false)}>
                ✕
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <p
                style={{
                  color: 'var(--ink)',
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {usd(account.balance)}
              </p>
              <button
                onClick={() => {
                  setBalInput(account.balance.toFixed(2));
                  setShowBalEdit(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink-3)',
                  cursor: 'pointer',
                  fontSize: 13,
                  padding: '0 2px',
                }}
              >
                ✎
              </button>
            </div>
          )}
        </div>
        <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px' }}>
          <p style={LABEL}>Equity</p>
          <p
            style={{
              color: unrealizedPnl >= 0 ? 'var(--green)' : 'var(--red)',
              fontSize: 16,
              fontWeight: 700,
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            {usd(equity)}
          </p>
          {account.positions.length > 0 && (
            <p
              style={{
                color: unrealizedPnl >= 0 ? 'var(--green)' : 'var(--red)',
                fontSize: 10,
                marginTop: 2,
              }}
            >
              {unrealizedPnl >= 0 ? '+' : ''}
              {usd(unrealizedPnl)} unrealized
            </p>
          )}
        </div>
      </div>

      {/* Margin mode + Leverage */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ ...LABEL, marginBottom: 0 }}>Margin Mode</p>
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 6, padding: 2, gap: 2, border: '1px solid var(--border)' }}>
            {(['isolated', 'cross'] as const).map(m => (
              <button
                key={m}
                onClick={() => onSetMarginMode(m)}
                style={{
                  padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                  background: account.marginMode === m ? (m === 'isolated' ? 'var(--blue)' : 'var(--violet)') : 'transparent',
                  color: account.marginMode === m ? '#fff' : 'var(--ink-3)',
                  textTransform: 'capitalize',
                }}
              >
                {m}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>
            {account.marginMode === 'isolated' ? 'Only margin at risk' : 'Full balance at risk'}
          </span>
        </div>
        <p style={{ ...LABEL, marginBottom: 0 }}>Leverage</p>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {LEVERAGE_OPTIONS.map(lv => (
            <button key={lv} onClick={() => onSetLeverage(lv)} style={leverageBtn(account.leverage === lv)}>
              {lv}×
            </button>
          ))}
        </div>
        {account.leverage >= 50 && (
          <p style={{ color: 'var(--yellow)', fontSize: 11, fontWeight: 600 }}>
            ⚠ High leverage ({account.leverage}×) — small moves cause large losses
          </p>
        )}
      </div>

      {/* Trade size + open */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={LABEL}>Trade Size (USDT margin)</p>
        <div style={ROW}>
          <input
            type="number"
            value={tradeSize}
            onChange={e => setTradeSize(Math.max(1, parseFloat(e.target.value) || 1))}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '6px 10px',
              color: 'var(--ink)',
              fontSize: 13,
              fontFamily: 'monospace',
              width: 90,
            }}
            min="1"
            step="10"
          />
          {[25, 50, 100, 250].map(v => (
            <button key={v} onClick={() => setTradeSize(v)} style={leverageBtn(tradeSize === v)}>
              ${v}
            </button>
          ))}
        </div>
        {tradeSize > account.balance && (
          <p style={{ color: 'var(--red)', fontSize: 11 }}>Insufficient balance</p>
        )}
        {currentResult && (
          <>
            {/* Entry / TP / SL manual inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {([
                { label: 'Entry',       val: customEntry, set: setCustomEntry, color: 'var(--ink)',  sigVal: currentResult.tpsl.entry },
                { label: 'Take Profit', val: customTp,    set: setCustomTp,    color: 'var(--green)', sigVal: currentResult.tpsl.tp },
                { label: 'Stop Loss',   val: customSl,    set: setCustomSl,    color: 'var(--red)',   sigVal: currentResult.tpsl.sl },
              ] as const).map(({ label, val, set, color, sigVal }) => (
                <div key={label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <p style={{ ...LABEL, marginBottom: 0, color }}>{label}</p>
                    <button
                      onClick={() => set(fp(sigVal))}
                      style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 10, cursor: 'pointer', padding: '0 2px' }}
                      title="Reset to signal value"
                    >
                      ↺ signal
                    </button>
                  </div>
                  <input
                    type="number"
                    value={val}
                    onChange={e => set(e.target.value)}
                    style={{
                      background: 'var(--surface2)',
                      border: `1px solid ${color}40`,
                      borderRadius: 6,
                      padding: '6px 8px',
                      color,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      width: '100%',
                    }}
                    step="any"
                  />
                </div>
              ))}
            </div>

            {currentResult.signal !== 'NEUTRAL' && (
              <p style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                Signal suggests:{' '}
                <span style={{ color: currentResult.signal === 'BUY' ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                  {currentResult.signal === 'BUY' ? '↑ LONG' : '↓ SHORT'}
                </span>
              </p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {(['BUY', 'SELL'] as const).map(dir => {
                const isLong = dir === 'BUY';
                const isSuggested = currentResult.signal === dir;
                const canClick = tradeSize > 0 && tradeSize <= account.balance;
                const entry = parseFloat(customEntry);
                const tp = parseFloat(customTp);
                const sl = parseFloat(customSl);
                const validEntry = !isNaN(entry) && entry > 0;
                const validTp = !isNaN(tp) && tp > 0;
                const validSl = !isNaN(sl) && sl > 0;
                return (
                  <button
                    key={dir}
                    disabled={!canClick}
                    onClick={() => {
                      if (!canClick) return;
                      const fakeResult = { ...currentResult, signal: dir } as typeof currentResult;
                      onOpenTrade(
                        activeAsset, fakeResult, tradeSize, effectiveLeverage,
                        validEntry ? entry : undefined,
                        validTp ? tp : undefined,
                        validSl ? sl : undefined,
                      );
                    }}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: canClick ? 'pointer' : 'not-allowed',
                      border: isSuggested
                        ? 'none'
                        : `1px solid ${isLong ? 'var(--green)' : 'var(--red)'}`,
                      background: !canClick
                        ? 'var(--surface2)'
                        : isSuggested
                        ? isLong ? 'var(--green)' : 'var(--red)'
                        : 'transparent',
                      color: !canClick
                        ? 'var(--ink-3)'
                        : isSuggested
                        ? '#fff'
                        : isLong ? 'var(--green)' : 'var(--red)',
                      transition: 'all 0.15s',
                      textAlign: 'center',
                    }}
                  >
                    {isLong ? '↑ LONG' : '↓ SHORT'}
                    <br />
                    <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.8 }}>
                      ×{effectiveLeverage} = ${(tradeSize * effectiveLeverage).toFixed(0)}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
        {!currentResult && (
          <p style={{ color: 'var(--ink-3)', fontSize: 12 }}>Loading price data…</p>
        )}
      </div>

      {/* Open positions */}
      {account.positions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={LABEL}>Open Positions ({account.positions.length})</p>
          {account.positions.map(pos => {
            const price = currentPrices[pos.symbol];
            const upnl =
              price !== undefined
                ? Math.max(
                    -pos.size,
                    ((pos.direction === 'LONG' ? price - pos.entry : pos.entry - price) /
                      pos.entry) *
                      pos.size *
                      pos.leverage
                  )
                : null;
            const upnlPct =
              price !== undefined
                ? ((pos.direction === 'LONG' ? price - pos.entry : pos.entry - price) /
                    pos.entry) *
                  pos.leverage *
                  100
                : null;
            const pnlColor =
              upnl === null ? 'var(--ink-3)' : upnl >= 0 ? 'var(--green)' : 'var(--red)';
            return (
              <div
                key={pos.id}
                style={{
                  background: 'var(--surface2)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: pos.direction === 'LONG' ? 'var(--green)' : 'var(--red)',
                      }}
                    >
                      {pos.direction}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{pos.asset}</span>
                    <span style={{ fontSize: 10, color: 'var(--ink-3)', background: 'var(--surface)', padding: '1px 5px', borderRadius: 3 }}>
                      {pos.leverage}×
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: (pos.marginMode ?? 'isolated') === 'cross' ? 'var(--violet)' : 'var(--blue)', background: (pos.marginMode ?? 'isolated') === 'cross' ? 'oklch(25% 0.06 295)' : 'oklch(22% 0.06 255)', padding: '1px 5px', borderRadius: 3 }}>
                      {(pos.marginMode ?? 'isolated').toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span>
                      E:{' '}
                      <span style={{ color: 'var(--ink-2)', fontFamily: 'monospace' }}>
                        {fp(pos.entry)}
                      </span>
                    </span>
                    <span>
                      TP:{' '}
                      <span style={{ color: 'var(--green)', fontFamily: 'monospace' }}>
                        {fp(pos.tp)}
                      </span>
                    </span>
                    <span>
                      SL:{' '}
                      <span style={{ color: 'var(--red)', fontFamily: 'monospace' }}>
                        {fp(pos.sl)}
                      </span>
                    </span>
                  </div>
                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--red-bg)', color: 'var(--red)', padding: '1px 5px', borderRadius: 3 }}>
                      LIQ
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--red)', fontFamily: 'monospace', fontWeight: 600 }}>
                      {fp(pos.liqPrice)}
                    </span>
                    {price !== undefined && (
                      <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                        ({Math.abs(((price - pos.liqPrice) / price) * 100).toFixed(2)}% away)
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  {upnl !== null && (
                    <span
                      style={{
                        color: pnlColor,
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                      }}
                    >
                      {upnl >= 0 ? '+' : ''}
                      {usd(upnl)}
                      <span style={{ fontSize: 10, marginLeft: 2 }}>
                        ({upnlPct!.toFixed(1)}%)
                      </span>
                    </span>
                  )}
                  <button
                    onClick={() => onCloseTrade(pos.id, price ?? pos.entry, 'Manual')}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--ink-3)',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reset confirm */}
      {showReset && (
        <div
          style={{
            background: 'var(--red-bg)',
            border: '1px solid var(--red)',
            borderRadius: 8,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <p style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600 }}>
            Reset account? All positions and trade history will be deleted.
          </p>
          <div style={ROW}>
            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>New balance:</span>
            <input
              type="number"
              value={resetBal}
              onChange={e => setResetBal(e.target.value)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '5px 8px',
                color: 'var(--ink)',
                fontSize: 13,
                fontFamily: 'monospace',
                width: 90,
              }}
              min="1"
            />
            <button
              onClick={() => {
                onReset(parseFloat(resetBal) || 10000);
                setShowReset(false);
              }}
              style={btn('var(--red)')}
            >
              Confirm Reset
            </button>
            <button onClick={() => setShowReset(false)} style={btn('var(--surface2)', true)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
