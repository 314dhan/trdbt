import type { SignalResult } from '../types';

const CONFIG = {
  BUY:     { bg: 'bg-emerald-500', text: 'text-emerald-400', emoji: '↑' },
  SELL:    { bg: 'bg-red-500',     text: 'text-red-400',     emoji: '↓' },
  NEUTRAL: { bg: 'bg-yellow-500',  text: 'text-yellow-400',  emoji: '→' },
};

type Props = { result: SignalResult; asset: string };

export function SignalCard({ result, asset }: Props) {
  const { signal, score, updatedAt } = result;
  const c = CONFIG[signal];
  return (
    <div className="rounded-2xl bg-slate-800 p-6 flex flex-col items-center gap-3">
      <p className="text-slate-400 text-sm font-medium">{asset}</p>
      <div className={`${c.bg} rounded-xl px-10 py-4 text-white text-4xl font-black tracking-widest`}>
        {c.emoji} {signal}
      </div>
      <p className={`${c.text} text-sm font-semibold`}>
        Score: {score > 0 ? `+${score}` : score} / 4 indicators
      </p>
      <p className="text-slate-500 text-xs">Updated {updatedAt.toLocaleTimeString()}</p>
    </div>
  );
}
