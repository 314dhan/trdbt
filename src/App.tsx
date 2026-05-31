import { useState, useEffect, useCallback } from 'react';
import type { Asset, SignalResult } from './types';
import { fetchKlines } from './api/bybit';
import { aggregate } from './signals/aggregate';
import { SignalCard } from './components/SignalCard';
import { IndicatorPanel } from './components/IndicatorPanel';
import { PriceChart } from './components/PriceChart';

const ASSETS: Asset[] = ['BTCUSDT', 'XAUUSDT'];
const LABELS: Record<Asset, string> = { BTCUSDT: 'BTC/USDT', XAUUSDT: 'XAU/USDT' };
const REFRESH_MS = 30_000;

export default function App() {
  const [active, setActive] = useState<Asset>('BTCUSDT');
  const [results, setResults] = useState<Partial<Record<Asset, SignalResult>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const entries = await Promise.all(
        ASSETS.map(async a => [a, aggregate(await fetchKlines(a))] as const)
      );
      setResults(Object.fromEntries(entries));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const current = results[active];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Signal Bot</h1>
            <p className="text-slate-500 text-sm">RSI · EMA · MACD · Bollinger · 1h candles</p>
          </div>
          <button
            onClick={refresh}
            className="bg-slate-700 hover:bg-slate-600 transition text-sm px-4 py-2 rounded-lg font-medium"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="flex gap-2">
          {ASSETS.map(a => (
            <button
              key={a}
              onClick={() => setActive(a)}
              className={`px-5 py-2 rounded-lg font-semibold text-sm transition ${
                active === a ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {LABELS[a]}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-xl text-sm">
            ⚠ {error}
          </div>
        )}

        {loading && (
          <div className="text-center text-slate-500 py-20 text-sm">Loading market data…</div>
        )}

        {!loading && current && (
          <div className="space-y-4">
            <SignalCard result={current} asset={LABELS[active]} />
            <PriceChart candles={current.candles} signal={current.signal} />
            <IndicatorPanel indicators={current.indicators} price={current.candles.at(-1)?.close ?? 0} />
          </div>
        )}

        <p className="text-center text-slate-600 text-xs pb-4">
          Auto-refreshes every 30s · Data: Bybit public API · No auth required
        </p>
      </div>
    </div>
  );
}
