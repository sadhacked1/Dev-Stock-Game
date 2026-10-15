import React from 'react';
import { TradeRecord } from '../types/game';
import { X, Award, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, Compass } from 'lucide-react';

interface TradeReviewModalProps {
  trade: TradeRecord | null;
  onClose: () => void;
}

export const TradeReviewModal: React.FC<TradeReviewModalProps> = ({ trade, onClose }) => {
  if (!trade) return null;

  const isWin = (trade.realizedPnL || 0) >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/70">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isWin ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Post-Trade Review: {trade.ticker}</h2>
              <p className="text-[11px] text-zinc-400">Day {trade.day} Execution Analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5 text-xs">
          {/* Result Card */}
          <div className={`p-3.5 rounded-lg border ${isWin ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-rose-950/20 border-rose-800/40'}`}>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">Realized Return</span>
              <div className="flex items-center gap-1 font-mono font-bold text-sm">
                {isWin ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-rose-400" />}
                <span className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                  {trade.realizedPnL !== undefined
                    ? `${trade.realizedPnL >= 0 ? '+' : ''}$${trade.realizedPnL.toFixed(2)} (${trade.returnPct?.toFixed(1)}%)`
                    : `$${trade.total.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-zinc-850 text-[11px]">
              <div>
                <span className="text-zinc-500 block">Shares Traded</span>
                <span className="font-mono text-zinc-200">{trade.shares} shares</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Execution Price</span>
                <span className="font-mono text-zinc-200">${trade.price.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Brokerage & Spread</span>
                <span className="font-mono text-zinc-400">${trade.fee.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Trade Side</span>
                <span className="font-mono uppercase font-bold text-sky-400">{trade.side}</span>
              </div>
            </div>
          </div>

          {/* Educational Feedback Lesson */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-xs">
              {isWin ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
              <span>Trader Psychology & Takeaway</span>
            </div>
            <p className="text-zinc-300 leading-relaxed text-[12px]">
              {trade.reviewLesson || (isWin
                ? 'Disciplined profit-taking locks in virtual capital. Remember that taking gains along the way preserves compound growth.'
                : 'Cutting losses early using risk management is not a failure—it is the prerequisite for long-term trading longevity.')}
            </p>
          </div>

          {/* Trading Rules Reminder */}
          <div className="p-2.5 bg-zinc-900/60 rounded border border-zinc-850 text-zinc-400 text-[11px] leading-relaxed">
            <strong className="text-zinc-300">Golden Rule:</strong> Never judge a trade purely on whether it won or lost. Judge it by whether you followed your pre-planned risk and diversification strategy.
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition"
          >
            Acknowledge & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
