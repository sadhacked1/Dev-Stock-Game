import React, { useState, useMemo } from 'react';
import { Stock, Sector } from '../types/game';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { soundManager } from '../services/sound';

interface StockListProps {
  stocks: Stock[];
  onSelectStock: (stock: Stock) => void;
}

type SortField = 'ticker' | 'price' | 'change' | 'pe' | 'dividend' | 'marketCap' | 'beta';

export const StockList: React.FC<StockListProps> = ({ stocks, onSelectStock }) => {
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<Sector | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<SortField>('change');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const sectors: Array<Sector | 'ALL'> = ['ALL', 'IT', 'Banking', 'Pharma', 'FMCG', 'Energy', 'Auto'];

  const filteredStocks = useMemo(() => {
    return stocks
      .filter((s) => {
        const matchesSearch =
          s.ticker.toLowerCase().includes(search.toLowerCase()) ||
          s.name.toLowerCase().includes(search.toLowerCase());
        const matchesSector = selectedSector === 'ALL' || s.sector === selectedSector;
        return matchesSearch && matchesSector;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        const changeA = ((a.currentPrice - a.previousPrice) / a.previousPrice) * 100;
        const changeB = ((b.currentPrice - b.previousPrice) / b.previousPrice) * 100;

        switch (sortField) {
          case 'ticker':
            return sortAsc ? a.ticker.localeCompare(b.ticker) : b.ticker.localeCompare(a.ticker);
          case 'price':
            valA = a.currentPrice;
            valB = b.currentPrice;
            break;
          case 'change':
            valA = changeA;
            valB = changeB;
            break;
          case 'pe':
            valA = a.pe;
            valB = b.pe;
            break;
          case 'dividend':
            valA = a.dividendYield;
            valB = b.dividendYield;
            break;
          case 'marketCap':
            valA = a.currentPrice * a.sharesOutstanding;
            valB = b.currentPrice * b.sharesOutstanding;
            break;
          case 'beta':
            valA = a.beta;
            valB = b.beta;
            break;
        }

        return sortAsc ? valA - valB : valB - valA;
      });
  }, [stocks, search, selectedSector, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    soundManager.playClick();
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search and Sector Filter Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search stock ticker or company name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-sky-500"
          />
        </div>

        {/* Sector Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          {sectors.map((sec) => (
            <button
              key={sec}
              onClick={() => {
                soundManager.playClick();
                setSelectedSector(sec);
              }}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap text-xs transition ${
                selectedSector === sec
                  ? 'bg-sky-500 text-white font-bold shadow-xs'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Sorting bar */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span className="font-mono">Showing {filteredStocks.length} of {stocks.length} assets</span>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 hidden sm:inline">Sort by:</span>
          <button
            onClick={() => handleSort('change')}
            className={`px-2 py-1 rounded text-xs transition flex items-center gap-1 ${
              sortField === 'change' ? 'bg-zinc-800 text-sky-400 font-bold' : 'hover:text-zinc-200'
            }`}
          >
            24h Change <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleSort('pe')}
            className={`px-2 py-1 rounded text-xs transition flex items-center gap-1 ${
              sortField === 'pe' ? 'bg-zinc-800 text-sky-400 font-bold' : 'hover:text-zinc-200'
            }`}
          >
            P/E Ratio <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleSort('dividend')}
            className={`px-2 py-1 rounded text-xs transition flex items-center gap-1 ${
              sortField === 'dividend' ? 'bg-zinc-800 text-sky-400 font-bold' : 'hover:text-zinc-200'
            }`}
          >
            Div Yield <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Stock Cards Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredStocks.map((stock) => {
          const changePct = ((stock.currentPrice - stock.previousPrice) / stock.previousPrice) * 100;
          const isUp = changePct >= 0;
          const isCircuit = stock.lastDecomposition?.circuitHit;

          // Mini sparkline coordinates
          const recentPoints = stock.history.slice(-12);
          const minP = Math.min(...recentPoints.map((p) => p.close));
          const maxP = Math.max(...recentPoints.map((p) => p.close));
          const range = maxP - minP || 1;
          const sparkSvg = recentPoints
            .map((p, i) => {
              const x = (i / (recentPoints.length - 1)) * 60;
              const y = 20 - ((p.close - minP) / range) * 16;
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');

          return (
            <div
              key={stock.ticker}
              onClick={() => {
                soundManager.playClick();
                onSelectStock(stock);
              }}
              className="bg-zinc-950 border border-zinc-850 hover:border-zinc-700 rounded-xl p-3.5 transition cursor-pointer hover:shadow-lg hover:shadow-black/60 flex flex-col justify-between group relative"
            >
              {/* Circuit Limit Badge */}
              {isCircuit && (
                <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isCircuit === 'upper'
                    ? 'bg-amber-950/80 border border-amber-600/60 text-amber-300'
                    : 'bg-rose-950/80 border border-rose-600/60 text-rose-300'
                }`}>
                  <ShieldAlert className="w-3 h-3" />
                  {isCircuit} Circuit
                </div>
              )}

              {/* Top row: Ticker + Sector */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white group-hover:text-sky-400 transition font-mono">
                      {stock.ticker}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {stock.sector}
                    </span>
                  </div>
                  <h4 className="text-xs text-zinc-400 line-clamp-1 font-medium mt-0.5">
                    {stock.name}
                  </h4>
                </div>
              </div>

              {/* Middle row: Price + 24h Change + Sparkline */}
              <div className="flex items-center justify-between my-3 py-2 border-y border-zinc-900">
                <div>
                  <div className="text-base font-bold font-mono text-white">
                    ${stock.currentPrice.toFixed(2)}
                  </div>
                  <div className={`flex items-center text-xs font-mono font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                    {changePct >= 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`}
                  </div>
                </div>

                {/* SVG Mini Sparkline */}
                <div className="w-16 h-7 flex items-center justify-center">
                  <svg className="w-16 h-7 overflow-visible">
                    <polyline
                      fill="none"
                      stroke={isUp ? '#22c55e' : '#ef4444'}
                      strokeWidth="1.8"
                      points={sparkSvg}
                    />
                  </svg>
                </div>
              </div>

              {/* Bottom row: Valuation metrics */}
              <div className="grid grid-cols-3 gap-1.5 text-[11px] text-zinc-400 pt-1">
                <div>
                  <span className="text-zinc-500 block text-[10px]">P/E Ratio</span>
                  <span className="font-mono text-zinc-300 font-medium">{stock.pe}x</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Dividend</span>
                  <span className="font-mono text-emerald-400 font-medium">{stock.dividendYield}%</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Beta</span>
                  <span className="font-mono text-zinc-300 font-medium">{stock.beta}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
