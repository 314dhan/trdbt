import { useState, useEffect, useCallback, useRef } from 'react';
import type { DemoAccount, OpenPosition, ClosedTrade, AssetConfig, SignalResult, MarginMode, TradeDirection } from '../types';

export type DemoStats = {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
};

function makeDefault(): DemoAccount {
  return { balance: 10000, leverage: 10, marginMode: 'isolated', positions: [], trades: [] };
}

function revive(raw: unknown): DemoAccount {
  const d = raw as DemoAccount;
  return {
    ...d,
    marginMode: d.marginMode ?? 'isolated',
    positions: d.positions.map(p => ({
      ...p,
      marginMode: p.marginMode ?? ('isolated' as MarginMode),
      liqPrice: p.liqPrice ?? 0,
      openedAt: new Date(p.openedAt),
    })),
    trades: d.trades.map(t => ({
      ...t,
      openedAt: new Date(t.openedAt),
      closedAt: new Date(t.closedAt),
    })),
  };
}

function load(storageKey: string): DemoAccount {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return revive(JSON.parse(raw));
    // Migrate legacy single-account data to default account on first load
    if (storageKey === 'tsb-account-default') {
      const legacy = localStorage.getItem('tsb-demo-v1');
      if (legacy) return revive(JSON.parse(legacy));
    }
  } catch {}
  return makeDefault();
}

// Isolated: only position margin at risk
// Cross: entire account balance backs position, so liq price is further away
export function calcLiqPrice(
  entry: number,
  direction: TradeDirection,
  leverage: number,
  marginMode: MarginMode,
  accountBalance: number,
  positionSize: number,
): number {
  if (marginMode === 'isolated') {
    return direction === 'LONG'
      ? entry * (1 - 1 / leverage)
      : entry * (1 + 1 / leverage);
  }
  // Cross: total available margin = accountBalance (entire balance backs the position)
  // extra buffer = accountBalance / (positionSize * leverage) extra price move before liq
  const notional = positionSize * leverage;
  const extraBuffer = accountBalance / notional;
  return direction === 'LONG'
    ? entry * (1 - 1 / leverage - extraBuffer)
    : entry * (1 + 1 / leverage + extraBuffer);
}

function calcPnl(pos: OpenPosition, exitPrice: number): { pnl: number; pnlPct: number } {
  const priceDiff =
    pos.direction === 'LONG' ? exitPrice - pos.entry : pos.entry - exitPrice;
  const pnl = (priceDiff / pos.entry) * pos.size * pos.leverage;
  const pnlPct = (priceDiff / pos.entry) * pos.leverage * 100;
  return { pnl: Math.max(-pos.size, pnl), pnlPct };
}

export function useDemo(accountId: string) {
  const storageKey = `tsb-account-${accountId}`;
  const skipSave = useRef(false);

  const [account, setAccount] = useState<DemoAccount>(() => load(storageKey));

  // Reload account data when switching accounts; guard against saving stale data
  useEffect(() => {
    skipSave.current = true;
    setAccount(load(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(account));
  }, [account, storageKey]);

  const setBalance = useCallback((balance: number) => {
    setAccount(prev => ({ ...prev, balance }));
  }, []);

  const setLeverage = useCallback((leverage: number) => {
    setAccount(prev => ({ ...prev, leverage }));
  }, []);

  const setMarginMode = useCallback((marginMode: MarginMode) => {
    setAccount(prev => ({ ...prev, marginMode }));
  }, []);

  const openTrade = useCallback(
    (
      asset: AssetConfig,
      result: SignalResult,
      size: number,
      leverage: number,
      entryOverride?: number,
      tpOverride?: number,
      slOverride?: number,
    ) => {
      if (result.signal === 'NEUTRAL') return;
      setAccount(prev => {
        if (size > prev.balance || size <= 0) return prev;
        const direction = result.signal === 'BUY' ? 'LONG' : 'SHORT';
        const entry = entryOverride ?? result.tpsl.entry;
        const pos: OpenPosition = {
          id: crypto.randomUUID(),
          asset: asset.label,
          symbol: asset.symbol,
          direction,
          entry,
          tp: tpOverride ?? result.tpsl.tp,
          sl: slOverride ?? result.tpsl.sl,
          liqPrice: calcLiqPrice(entry, direction, leverage, prev.marginMode, prev.balance, size),
          size,
          leverage,
          marginMode: prev.marginMode,
          openedAt: new Date(),
        };
        return { ...prev, balance: prev.balance - size, positions: [...prev.positions, pos] };
      });
    },
    []
  );

  const closeTrade = useCallback(
    (posId: string, exitPrice: number, reason: 'TP' | 'SL' | 'Manual') => {
      setAccount(prev => {
        const pos = prev.positions.find(p => p.id === posId);
        if (!pos) return prev;
        const { pnl, pnlPct } = calcPnl(pos, exitPrice);
        const trade: ClosedTrade = {
          id: pos.id,
          asset: pos.asset,
          symbol: pos.symbol,
          direction: pos.direction,
          entry: pos.entry,
          exitPrice,
          size: pos.size,
          leverage: pos.leverage,
          pnl,
          pnlPct,
          win: pnl > 0,
          openedAt: pos.openedAt,
          closedAt: new Date(),
          closeReason: reason,
        };
        return {
          ...prev,
          balance: prev.balance + pos.size + pnl,
          positions: prev.positions.filter(p => p.id !== posId),
          trades: [trade, ...prev.trades],
        };
      });
    },
    []
  );

  const checkAutoClose = useCallback((prices: Record<string, number>) => {
    setAccount(prev => {
      if (prev.positions.length === 0) return prev;
      let balance = prev.balance;
      const closed: ClosedTrade[] = [];
      const remaining: OpenPosition[] = [];

      for (const pos of prev.positions) {
        const price = prices[pos.symbol];
        if (price === undefined) { remaining.push(pos); continue; }

        // Check liquidation FIRST — at high leverage liqPrice > SL for LONG (and < SL for SHORT)
        const isLiquidated =
          pos.direction === 'LONG'
            ? price <= pos.liqPrice
            : price >= pos.liqPrice;

        let hit: 'TP' | 'SL' | 'Liquidated' | null = null;
        if (isLiquidated) {
          hit = 'Liquidated';
        } else if (pos.direction === 'LONG') {
          if (price >= pos.tp) hit = 'TP';
          else if (price <= pos.sl) hit = 'SL';
        } else {
          if (price <= pos.tp) hit = 'TP';
          else if (price >= pos.sl) hit = 'SL';
        }

        if (hit) {
          const exitPrice =
            hit === 'TP' ? pos.tp : hit === 'SL' ? pos.sl : pos.liqPrice;
          const pnl = hit === 'Liquidated' ? -pos.size : calcPnl(pos, exitPrice).pnl;
          const pnlPct = hit === 'Liquidated' ? -100 : calcPnl(pos, exitPrice).pnlPct;
          closed.push({
            id: pos.id,
            asset: pos.asset,
            symbol: pos.symbol,
            direction: pos.direction,
            entry: pos.entry,
            exitPrice,
            size: pos.size,
            leverage: pos.leverage,
            pnl,
            pnlPct,
            win: pnl > 0,
            openedAt: pos.openedAt,
            closedAt: new Date(),
            closeReason: hit,
          });
          balance += hit === 'Liquidated' ? 0 : pos.size + pnl;
        } else {
          remaining.push(pos);
        }
      }

      if (closed.length === 0) return prev;
      return { ...prev, balance, positions: remaining, trades: [...closed, ...prev.trades] };
    });
  }, []);

  const resetAccount = useCallback((newBalance: number) => {
    setAccount({ ...makeDefault(), balance: newBalance });
  }, []);

  const stats: DemoStats = {
    totalTrades: account.trades.length,
    wins: account.trades.filter(t => t.win).length,
    losses: account.trades.filter(t => !t.win).length,
    winRate:
      account.trades.length > 0
        ? (account.trades.filter(t => t.win).length / account.trades.length) * 100
        : 0,
    totalPnl: account.trades.reduce((s, t) => s + t.pnl, 0),
  };

  return {
    account,
    stats,
    setBalance,
    setLeverage,
    setMarginMode,
    openTrade,
    closeTrade,
    checkAutoClose,
    resetAccount,
  };
}
