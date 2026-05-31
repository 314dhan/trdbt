import { useEffect, useRef } from 'react';
import { createChart, ColorType, createSeriesMarkers } from 'lightweight-charts';
import type { OHLCV, SignalType } from '../types';

type Props = { candles: OHLCV[]; signal: SignalType };

export function PriceChart({ candles, signal }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || candles.length === 0) return;

    const chart = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: '#1e293b' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#334155' }, horzLines: { color: '#334155' } },
      width: ref.current.clientWidth,
      height: 320,
    });

    const series = chart.addCandlestickSeries({
      upColor: '#10b981', downColor: '#ef4444',
      borderUpColor: '#10b981', borderDownColor: '#ef4444',
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });

    series.setData(candles.map(c => ({
      time: c.time as any,
      open: c.open, high: c.high, low: c.low, close: c.close,
    })));

    if (signal !== 'NEUTRAL') {
      const last = candles.at(-1)!;
      createSeriesMarkers(series, [{
        time: last.time as any,
        position: signal === 'BUY' ? 'belowBar' : 'aboveBar',
        color: signal === 'BUY' ? '#10b981' : '#ef4444',
        shape: signal === 'BUY' ? 'arrowUp' : 'arrowDown',
        text: signal,
      }]);
    }

    chart.timeScale().fitContent();

    const onResize = () => {
      if (ref.current) chart.applyOptions({ width: ref.current.clientWidth });
    };
    window.addEventListener('resize', onResize);
    return () => { chart.remove(); window.removeEventListener('resize', onResize); };
  }, [candles, signal]);

  return <div ref={ref} className="rounded-2xl overflow-hidden" />;
}
