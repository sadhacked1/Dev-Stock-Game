import React, { useState } from 'react';
import { NewsItem, Sector, Stock } from '../types/game';
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Filter,
  Radio,
} from 'lucide-react';
import { soundManager } from '../services/sound';

interface NewsViewProps {
  news: NewsItem[];
  stocks: Stock[];
  onSelectStock: (stock: Stock) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ news, stocks, onSelectStock }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const categories = ['ALL', 'Macro', 'Earnings', 'Product', 'Regulatory', 'Rumor', 'Sector'];

  const filteredNews = news
    .filter((n) => categoryFilter === 'ALL' || n.category === categoryFilter)
    .sort((a, b) => b.day - a.day);

  return (
    <div className="space-y-3.5">
      {/* Header & Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded bg-zinc-900 text-sky-400">
            <Radio className="w-4 h-4 animate-pulse text-rose-500" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Financial News Terminal
            </h2>
            <p className="text-[11px] text-zinc-400">
              Live intelligence, macro data releases, regulatory reports & rumors
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                soundManager.playClick();
                setCategoryFilter(cat);
              }}
              className={`px-2.5 py-1 rounded text-xs transition whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-zinc-700 text-white font-bold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* News List */}
      <div className="space-y-2.5">
        {filteredNews.length === 0 ? (
          <div className="text-center py-12 bg-zinc-950 rounded-xl border border-zinc-850 p-6 space-y-2">
            <Newspaper className="w-8 h-8 text-zinc-600 mx-auto mb-1" />
            <h3 className="text-sm font-bold text-white">No News Bulletins in this Category</h3>
            <p className="text-xs text-zinc-400">Advance the day to receive fresh market dispatches.</p>
          </div>
        ) : (
          filteredNews.map((item) => {
            const isBullish = item.impactStrength > 0;
            const targetStock = item.ticker ? stocks.find((s) => s.ticker === item.ticker) : null;

            return (
              <div
                key={item.id}
                className="bg-zinc-950 border border-zinc-850 hover:border-zinc-750 rounded-xl p-3.5 transition space-y-2"
              >
                {/* Meta row */}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-500">Day {item.day}</span>
                    <span className="text-zinc-600">·</span>
                    <span className={`px-1.5 py-0.5 rounded font-semibold uppercase text-[10px] ${
                      item.category === 'Earnings'
                        ? 'bg-purple-950 text-purple-300'
                        : item.category === 'Macro'
                        ? 'bg-blue-950 text-blue-300'
                        : item.category === 'Rumor'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-zinc-900 text-zinc-300'
                    }`}>
                      {item.category}
                    </span>
                    {item.sector && (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 font-medium text-[10px]">
                        {item.sector}
                      </span>
                    )}
                    {!item.isReliable && (
                      <span className="flex items-center gap-1 text-amber-400 font-semibold text-[10px] bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-600/30">
                        <AlertCircle className="w-3 h-3" /> Unverified Rumor
                      </span>
                    )}
                  </div>

                  {/* Impact badge */}
                  <div className={`flex items-center gap-1 font-mono font-bold text-[11px] ${
                    isBullish ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {isBullish ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{isBullish ? 'Bullish Catalyst' : 'Bearish Catalyst'}</span>
                  </div>
                </div>

                {/* Headline & Body */}
                <div>
                  <h3 className="text-sm font-bold text-white leading-snug">
                    {item.headline}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {item.body}
                  </p>
                </div>

                {/* Associated Stock Link Action */}
                {targetStock && (
                  <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">Related Asset:</span>
                      <span className="font-mono font-bold text-white">{targetStock.ticker}</span>
                      <span className="text-zinc-400">(${targetStock.currentPrice.toFixed(2)})</span>
                    </div>
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onSelectStock(targetStock);
                      }}
                      className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold transition"
                    >
                      Trade {targetStock.ticker} <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
