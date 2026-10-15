import React from 'react';
import { Stock } from '../types/game';
import { X, TrendingUp, TrendingDown, Info, ShieldAlert, Cpu } from 'lucide-react';

interface WhyMovedModalProps {
  stock: Stock | null;
  onClose: () => void;
}

export const WhyMovedModal: React.FC<WhyMovedModalProps> = ({ stock, onClose }) => {
  if (!stock) return null;

  const decomp = stock.lastDecomposition || {
    marketEffect: 0,
    sectorEffect: 0,
    newsEffect: 0,
    trendEffect: 0,
    noise: 0,
    totalChangePct: ((stock.currentPrice - stock.previousPrice) / stock.previousPrice) * 100,
    circuitHit: null,
  };

  const isPositive = decomp.totalChangePct >= 0;

  // Generate plain English pedagogical explanation
  const getExplanation = () => {
    const parts: string[] = [];

    if (Math.abs(decomp.newsEffect) > 0.8) {
      if (decomp.newsEffect > 0) {
        parts.push(`Positive catalyst news provided strong upward momentum (+${decomp.newsEffect.toFixed(2)}%).`);
      } else {
        parts.push(`Negative catalyst headlines weighed heavily on sentiment (${decomp.newsEffect.toFixed(2)}%).`);
      }
    }

    if (Math.abs(decomp.marketEffect) > 0.4) {
      if (decomp.marketEffect > 0) {
        parts.push(`A supportive broader market index lifted the stock (+${decomp.marketEffect.toFixed(2)}%), amplified by its Beta of ${stock.beta}.`);
      } else {
        parts.push(`Market-wide selling pulled the stock downward (${decomp.marketEffect.toFixed(2)}%), amplified by its Beta of ${stock.beta}.`);
      }
    }

    if (Math.abs(decomp.sectorEffect) > 0.3) {
      parts.push(`The ${stock.sector} sector experienced a ${decomp.sectorEffect > 0 ? 'tailwind' : 'drag'} of ${decomp.sectorEffect.toFixed(2)}%.`);
    }

    if (decomp.circuitHit) {
      parts.push(`Trading halted at the ${decomp.circuitHit === 'upper' ? 'Upper' : 'Lower'} Circuit Limit (±10%) to prevent disorderly panic.`);
    }

    if (parts.length === 0) {
      parts.push(`Price moved primarily due to normal intraday order flow and statistical volatility without major unexpected news.`);
    }

    return parts.join(' ');
  };

  const factorBar = (label: string, value: number, desc: string) => {
    const isUp = value >= 0;
    const absVal = Math.min(10, Math.abs(value));
    const widthPct = Math.min(100, (absVal / 5) * 100);

    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-zinc-300">{label}</span>
          <span className={`font-mono font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {value > 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`}
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
          {isUp ? (
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${widthPct}%` }}
            />
          ) : (
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500 ml-auto"
              style={{ width: `${widthPct}%` }}
            />
          )}
        </div>
        <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">{desc}</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-zinc-800 text-sky-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Why Did {stock.ticker} Move?
              </h2>
              <p className="text-xs text-zinc-400">
                Mathematical Price Decomposition · Day {stock.history[stock.history.length - 1]?.day || 0}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Summary Box */}
          <div className={`p-3.5 rounded-lg border ${isPositive ? 'bg-emerald-950/30 border-emerald-800/40' : 'bg-rose-950/30 border-rose-800/40'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-zinc-300">Total 24h Price Action</span>
              <div className="flex items-center gap-1.5 text-sm font-bold font-mono">
                {isPositive ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
                <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                  {decomp.totalChangePct > 0 ? `+${decomp.totalChangePct.toFixed(2)}%` : `${decomp.totalChangePct.toFixed(2)}%`}
                </span>
                <span className="text-xs text-zinc-400">(${stock.previousPrice.toFixed(2)} → ${stock.currentPrice.toFixed(2)})</span>
              </div>
            </div>

            {decomp.circuitHit && (
              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-400 bg-amber-950/50 border border-amber-600/40 p-2 rounded">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  Circuit Breaker Activated ({decomp.circuitHit.toUpperCase()} LIMIT 10% HIT): Price halted by exchange rules.
                </span>
              </div>
            )}
          </div>

          {/* Plain English explanation */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-white block mb-0.5">Market Teacher Analysis</strong>
              {getExplanation()}
            </div>
          </div>

          {/* Factor Breakdown Stack */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Decomposition Breakdown (Section 5.2 Model)</h3>

            {factorBar(
              'Market Index Drag / Lift (Beta-weighted)',
              decomp.marketEffect,
              `Broader macroeconomic sentiment scaled by this stock's sensitivity factor (Beta: ${stock.beta}).`
            )}

            {factorBar(
              'Sector Tide Effect',
              decomp.sectorEffect,
              `Industry-wide tailwinds or headcurrents specifically affecting the ${stock.sector} sector.`
            )}

            {factorBar(
              'News & Catalyst Impact',
              decomp.newsEffect,
              `Surprise earnings beats/misses, contracts, analyst upgrades, or regulatory filings.`
            )}

            {factorBar(
              'Trend & Momentum Carryover',
              decomp.trendEffect,
              `Continuation of recent 3-day directional buying or selling pressure.`
            )}

            {factorBar(
              'Statistical Noise & Liquidity Walk',
              decomp.noise,
              `Natural intraday bid-ask friction and stochastic retail order flow.`
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
