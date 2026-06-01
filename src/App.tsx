import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Mode, AssetConfig, SignalResult, Timeframe } from './types';
import { ASSET_CONFIGS, TIMEFRAME_LABELS, SCALPING_TIMEFRAMES, refreshInterval } from './types';
import { fetchKlines } from './api/bybit';
import { aggregate } from './signals/aggregate';
import { SignalCard } from './components/SignalCard';
import { IndicatorPanel } from './components/IndicatorPanel';
import { PriceChart } from './components/PriceChart';
import { DemoPanel } from './components/DemoPanel';
import { TradeLog } from './components/TradeLog';
import { AccountSwitcher } from './components/AccountSwitcher';
import { useDemo } from './store/demo';
import { useAccounts } from './store/accounts';

const TIMEFRAMES = Object.keys(TIMEFRAME_LABELS) as Timeframe[];

function assetKey(a: AssetConfig) { return `${a.symbol}-${a.category}`; }

export default function App() {
  const [mode, setMode] = useState<Mode>('spot');
  const [timeframe, setTimeframe] = useState<Timeframe>('60');
  const [activeKey, setActiveKey] = useState('BTCUSDT-spot');
  const [results, setResults] = useState<Record<string, SignalResult>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { accounts, activeId, switchAccount, createAccount, deleteAccount } = useAccounts();
  const { account, stats, setBalance, setLeverage, setMarginMode, openTrade, closeTrade, checkAutoClose, resetAccount } = useDemo(activeId);

  const assets = ASSET_CONFIGS.filter(a => a.mode === mode);
  const activeAsset = assets.find(a => assetKey(a) === activeKey) ?? assets[0];

  const currentPrices = useMemo(() => {
    const prices: Record<string, number> = {};
    for (const [key, res] of Object.entries(results)) {
      const asset = ASSET_CONFIGS.find(a => assetKey(a) === key);
      if (asset) prices[asset.symbol] = res.tpsl.entry;
    }
    return prices;
  }, [results]);

  const fetchAssets = useCallback(async (tf: Timeframe, assetList: AssetConfig[]) => {
    const entries = await Promise.all(
      assetList.map(async a => [assetKey(a), aggregate(await fetchKlines(a.symbol, a.category, tf))] as const)
    );
    setResults(prev => ({ ...prev, ...Object.fromEntries(entries) }));
    const prices: Record<string, number> = {};
    for (const [key, res] of entries) {
      const asset = assetList.find(a => assetKey(a) === key);
      if (asset) prices[asset.symbol] = res.tpsl.entry;
    }
    checkAutoClose(prices);
    return entries;
  }, [checkAutoClose]);

  const refresh = useCallback(async (tf: Timeframe, assetList: AssetConfig[], activeOnly = false) => {
    try {
      setError(null);
      setLoading(true);
      // Fast tick: fetch only active asset to avoid rate limits
      // Background tick (every 3rd call): fetch all assets for signal dots
      const toFetch = activeOnly
        ? assetList.filter(a => assetKey(a) === activeKey)
        : assetList;
      await fetchAssets(tf, toFetch);
      setLastRefresh(new Date());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fetchAssets, activeKey]);

  const tickRef = useRef(0);

  useEffect(() => {
    const list = ASSET_CONFIGS.filter(a => a.mode === mode);
    tickRef.current = 0;
    refresh(timeframe, list, false); // initial: fetch all

    if (intervalRef.current) clearInterval(intervalRef.current);
    const ms = refreshInterval(timeframe);
    intervalRef.current = setInterval(() => {
      tickRef.current += 1;
      // Every 3rd tick fetch all assets; otherwise only active (saves ~85% of requests)
      const activeOnly = tickRef.current % 3 !== 0;
      refresh(timeframe, list, activeOnly);
    }, ms);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refresh, timeframe, mode]);

  // ensure activeKey belongs to current mode
  useEffect(() => {
    const list = ASSET_CONFIGS.filter(a => a.mode === mode);
    if (!list.find(a => assetKey(a) === activeKey)) {
      setActiveKey(assetKey(list[0]));
    }
  }, [mode, activeKey]);

  const current = results[assetKey(activeAsset)];
  const isScalping = SCALPING_TIMEFRAMES.includes(timeframe);
  const ms = refreshInterval(timeframe);

  const btn = (active: boolean, color: string) => ({
    padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: active ? color : 'transparent',
    color: active ? '#fff' : 'var(--ink-2)',
  } as React.CSSProperties);

  const pill = (active: boolean, color: string) => ({
    padding: '5px 11px', borderRadius: 6, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
    background: active ? color : 'transparent',
    color: active ? '#fff' : 'var(--ink-3)',
    border: `1px solid ${active ? color : 'var(--border)'}`,
  } as React.CSSProperties);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.2 }}>
              Signal Bot
            </h1>
            <p style={{ color: 'var(--ink-3)', fontSize: 12, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
              RSI · EMA · MACD · Bollinger · ATR
              {isScalping && (
                <span style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.05em' }}>
                  SCALPING
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <button
              onClick={() => refresh(timeframe, ASSET_CONFIGS.filter(a => a.mode === mode))}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink-2)', borderRadius: 'var(--radius-sm)', padding: '7px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              ↻ Refresh
            </button>
            <span style={{ color: 'var(--ink-3)', fontSize: 10 }}>Every {ms / 1000}s</span>
          </div>
        </header>

        {/* Mode: Spot / Futures */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: 3, gap: 2, border: '1px solid var(--border)' }}>
            <button onClick={() => setMode('spot')}    style={btn(mode === 'spot',    'var(--blue)')}>Spot</button>
            <button onClick={() => setMode('futures')} style={btn(mode === 'futures', 'var(--violet)')}>Futures / Perp</button>
          </div>
        </div>

        {/* Asset tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {assets.map(a => {
            const k = assetKey(a);
            const res = results[k];
            const sigColor = res ? ({ BUY: 'var(--green)', SELL: 'var(--red)', NEUTRAL: 'var(--yellow)' }[res.signal]) : 'var(--border)';
            return (
              <button
                key={k}
                onClick={() => setActiveKey(k)}
                style={{
                  padding: '7px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
                  background: activeKey === k ? 'var(--surface2)' : 'transparent',
                  color: activeKey === k ? 'var(--ink)' : 'var(--ink-3)',
                  border: `1px solid ${activeKey === k ? 'var(--border)' : 'transparent'}`,
                }}
              >
                {a.label}
                {res && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: sigColor, display: 'inline-block', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Timeframe pills */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: 'var(--ink-3)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', marginRight: 4 }}>TF</span>
          {TIMEFRAMES.map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)} style={pill(timeframe === tf, SCALPING_TIMEFRAMES.includes(tf) ? 'var(--yellow)' : 'var(--violet)')}>
              {TIMEFRAME_LABELS[tf]}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--red)' }}>
            ⚠ {error}
          </div>
        )}

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 18, alignItems: 'start' }}>

          {/* Left: signal analysis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            {loading && !current && (
              <div style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '80px 0', fontSize: 13 }}>
                Loading market data…
              </div>
            )}
            {current && (
              <>
                <SignalCard result={current} asset={activeAsset.label} mode={mode} />
                <PriceChart candles={current.candles} signal={current.signal} />
                <IndicatorPanel indicators={current.indicators} price={current.candles.at(-1)?.close ?? 0} />
              </>
            )}
          </div>

          {/* Right: account switcher + demo account + trade log (sticky) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 24 }}>
            <AccountSwitcher
              accounts={accounts}
              activeId={activeId}
              onSwitch={switchAccount}
              onCreate={createAccount}
              onDelete={id => deleteAccount(id, activeId)}
            />
            <DemoPanel
              account={account}
              stats={stats}
              activeAsset={activeAsset}
              currentResult={current}
              currentPrices={currentPrices}
              onSetBalance={setBalance}
              onSetLeverage={setLeverage}
              onSetMarginMode={setMarginMode}
              onOpenTrade={openTrade}
              onCloseTrade={closeTrade}
              onReset={resetAccount}
            />
            <TradeLog trades={account.trades} stats={stats} accounts={accounts} activeAccountId={activeId} />
          </div>

        </div>

        <footer style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 11, paddingBottom: 16 }}>
          {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Loading'} · Bybit API · No auth
        </footer>
      </div>
    </div>
  );
}
