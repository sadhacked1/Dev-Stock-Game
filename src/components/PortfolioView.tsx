import React, { useState } from 'react';
import { Portfolio, Stock, Order, TradeRecord, Sector } from '../types/game';
import {
  PieChart as PieIcon,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Layers,
} from 'lucide-react';
import { soundManager } from '../services/sound';

interface PortfolioViewProps {
  portfolio: Portfolio;
  stocks: Stock[];
  orders: Order[];
  onSelectStock: (stock: Stock) => void;
  onCancelOrder: (orderId: string) => void;
  onReviewTrade: (trade: TradeRecord) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  portfolio,
  stocks,
  orders,
  onSelectStock,
  onCancelOrder,
  onReviewTrade,
}) => {
  const [tab, setTab] = useState<'holdings' | 'orders' | 'history'>('holdings');

  // Compute live holdings metrics
  const holdingsList = Object.values(portfolio.positions).map((pos) => {
    const stock = stocks.find((s) => s.ticker === pos.ticker);
    const currentPrice = stock?.currentPrice || pos.averagePrice;
    const marketValue = pos.shares * currentPrice;
    const costBasis = pos.totalCost;
    const unrealizedPnL = marketValue - costBasis;
    const returnPct = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

    return {
      ...pos,
      stock,
      currentPrice,
      marketValue,
      costBasis,
      unrealizedPnL,
      returnPct,
    };
  });

  const totalInvested = holdingsList.reduce((acc, h) => acc + h.marketValue, 0);
  const totalCost = holdingsList.reduce((acc, h) => acc + h.costBasis, 0);
  const totalUnrealizedPnL = totalInvested - totalCost;
  const totalReturnPct = totalCost > 0 ? (totalUnrealizedPnL / totalCost) * 100 : 0;
  const netWorth = portfolio.cash + totalInvested;

  // Sector allocation
  const sectorWeights: Record<Sector, number> = {
    IT: 0,
    Banking: 0,
    Pharma: 0,
    FMCG: 0,
    Energy: 0,
    Auto: 0,
  };

  holdingsList.forEach((h) => {
    if (h.stock) {
      sectorWeights[h.stock.sector] = (sectorWeights[h.stock.sector] || 0) + h.marketValue;
    }
  });

  const sectorColors: Record<Sector, string> = {
    IT: 'bg-sky-500',
    Banking: 'bg-blue-600',
    Pharma: 'bg-emerald-500',
    FMCG: 'bg-amber-500',
    Energy: 'bg-orange-500',
    Auto: 'bg-purple-500',
  };

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');

  return (
    <div className="space-y-4">
      {/* Top Portfolio Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Net Worth */}
        <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3.5">
          <span className="text-zinc-400 text-xs font-medium block">Total Net Worth</span>
          <div className="text-xl font-black font-mono text-white mt-1">
            ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
            <span>Starting: ${portfolio.startingCash.toLocaleString()}</span>
            <span className={`font-mono font-semibold ${netWorth >= portfolio.startingCash ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(((netWorth - portfolio.startingCash) / portfolio.startingCash) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Liquid Cash */}
        <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3.5">
          <span className="text-zinc-400 text-xs font-medium block">Available Cash</span>
          <div className="text-xl font-black font-mono text-white mt-1">
            ${portfolio.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {netWorth > 0 ? `${((portfolio.cash / netWorth) * 100).toFixed(1)}% of Portfolio` : '100%'}
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3.5">
          <span className="text-zinc-400 text-xs font-medium block">Invested Holdings</span>
          <div className="text-xl font-black font-mono text-white mt-1">
            ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {holdingsList.length} Active Positions
          </div>
        </div>

        {/* Unrealized & Realized P/L */}
        <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3.5">
          <span className="text-zinc-400 text-xs font-medium block">Unrealized P/L</span>
          <div className={`text-xl font-black font-mono mt-1 ${totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toFixed(2)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
            <span>Realized:</span>
            <span className={`font-mono font-semibold ${portfolio.totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {portfolio.totalRealizedPnL >= 0 ? '+' : ''}${portfolio.totalRealizedPnL.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Allocation Breakdown Bar */}
      {totalInvested > 0 && (
        <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-sky-400" /> Sector Diversification
            </span>
            <span className="text-zinc-400 text-[11px]">
              {Object.keys(sectorWeights).filter((k) => sectorWeights[k as Sector] > 0).length} of 6 Sectors Active
            </span>
          </div>

          {/* Color bar */}
          <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden flex">
            {/* Cash portion */}
            <div
              className="h-full bg-zinc-700 transition-all duration-300"
              style={{ width: `${(portfolio.cash / netWorth) * 100}%` }}
              title={`Cash: ${((portfolio.cash / netWorth) * 100).toFixed(1)}%`}
            />
            {/* Sectors */}
            {(Object.keys(sectorWeights) as Sector[]).map((sec) => {
              const val = sectorWeights[sec];
              if (val <= 0) return null;
              const pct = (val / netWorth) * 100;
              return (
                <div
                  key={sec}
                  className={`h-full ${sectorColors[sec]} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                  title={`${sec}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-zinc-700 inline-block"></span> Cash ({((portfolio.cash / netWorth) * 100).toFixed(0)}%)
            </span>
            {(Object.keys(sectorWeights) as Sector[]).map((sec) => {
              const val = sectorWeights[sec];
              if (val <= 0) return null;
              const pct = (val / netWorth) * 100;
              return (
                <span key={sec} className="flex items-center gap-1">
                  <span className={`w-2.5 h-2.5 rounded ${sectorColors[sec]} inline-block`}></span>
                  {sec} ({pct.toFixed(1)}%)
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => {
            soundManager.playClick();
            setTab('holdings');
          }}
          className={`px-4 py-2 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            tab === 'holdings'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Holdings ({holdingsList.length})
        </button>
        <button
          onClick={() => {
            soundManager.playClick();
            setTab('orders');
          }}
          className={`px-4 py-2 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            tab === 'orders'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Pending Orders ({pendingOrders.length})
        </button>
        <button
          onClick={() => {
            soundManager.playClick();
            setTab('history');
          }}
          className={`px-4 py-2 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            tab === 'history'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Trade History ({portfolio.tradeHistory.length})
        </button>
      </div>

      {/* Tab 1: Active Holdings */}
      {tab === 'holdings' && (
        <div>
          {holdingsList.length === 0 ? (
            <div className="text-center py-12 bg-zinc-950 rounded-xl border border-zinc-850 p-6 space-y-2">
              <Shield className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">No Open Stock Positions</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Your portfolio is currently 100% in cash. Head over to the Market tab to find promising companies and purchase your first shares!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-zinc-950 border border-zinc-850 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-850 text-zinc-400 font-semibold bg-zinc-900/50">
                    <th className="py-2.5 px-3">Stock / Sector</th>
                    <th className="py-2.5 px-3">Shares</th>
                    <th className="py-2.5 px-3">Avg Cost</th>
                    <th className="py-2.5 px-3">Current Price</th>
                    <th className="py-2.5 px-3">Market Value</th>
                    <th className="py-2.5 px-3">Unrealized P/L</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {holdingsList.map((h) => {
                    const isProfit = h.unrealizedPnL >= 0;

                    return (
                      <tr key={h.ticker} className="hover:bg-zinc-900/40 transition">
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => h.stock && onSelectStock(h.stock)}
                            className="font-bold text-white hover:text-sky-400 font-mono text-left flex items-center gap-1.5"
                          >
                            {h.ticker}
                            <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-900 text-zinc-400 font-normal">
                              {h.stock?.sector}
                            </span>
                          </button>
                          <span className="text-[10px] text-zinc-500 block truncate max-w-[120px]">
                            {h.stock?.name}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-zinc-200">
                          {h.shares}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-400">
                          ${h.averagePrice.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-white">
                          ${h.currentPrice.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-200">
                          ${h.marketValue.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <div className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isProfit ? '+' : ''}${h.unrealizedPnL.toFixed(2)}
                          </div>
                          <div className={`text-[10px] ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {h.returnPct >= 0 ? '+' : ''}{h.returnPct.toFixed(1)}%
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => h.stock && onSelectStock(h.stock)}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[11px] font-semibold transition"
                          >
                            Trade
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pending Orders */}
      {tab === 'orders' && (
        <div>
          {pendingOrders.length === 0 ? (
            <div className="text-center py-10 bg-zinc-950 rounded-xl border border-zinc-850 p-6 space-y-1">
              <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">No Pending Orders</h3>
              <p className="text-xs text-zinc-400">
                Limit orders, Stop-losses, and Take-profit targets will appear here until executed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-zinc-950 border border-zinc-850 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-850 text-zinc-400 font-semibold bg-zinc-900/50">
                    <th className="py-2.5 px-3">Placed Day</th>
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3">Order Type</th>
                    <th className="py-2.5 px-3">Trigger Price</th>
                    <th className="py-2.5 px-3">Shares</th>
                    <th className="py-2.5 px-3 text-right">Cancel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {pendingOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-zinc-900/40 transition">
                      <td className="py-2.5 px-3 font-mono text-zinc-400">Day {ord.placedDay}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white">{ord.ticker}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          ord.side === 'BUY' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                        }`}>
                          {ord.side}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-zinc-300">{ord.type}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-sky-400">${ord.targetPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono text-zinc-200">{ord.quantity}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            soundManager.playClick();
                            onCancelOrder(ord.id);
                          }}
                          className="p-1 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 rounded transition"
                          title="Cancel Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Trade History */}
      {tab === 'history' && (
        <div>
          {portfolio.tradeHistory.length === 0 ? (
            <div className="text-center py-10 bg-zinc-950 rounded-xl border border-zinc-850 p-6 space-y-1">
              <BookOpen className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">No Executed Trades Yet</h3>
              <p className="text-xs text-zinc-400">
                Every trade executed in the simulation will be logged here with post-trade feedback.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-zinc-950 border border-zinc-850 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-850 text-zinc-400 font-semibold bg-zinc-900/50">
                    <th className="py-2.5 px-3">Day</th>
                    <th className="py-2.5 px-3">Stock</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3">Shares</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">Total Cost / Value</th>
                    <th className="py-2.5 px-3">Realized P/L</th>
                    <th className="py-2.5 px-3 text-right">Review Lesson</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {portfolio.tradeHistory.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-900/40 transition">
                      <td className="py-2.5 px-3 font-mono text-zinc-400">Day {t.day}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white">{t.ticker}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.side === 'BUY' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                        }`}>
                          {t.side}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-300">{t.shares}</td>
                      <td className="py-2.5 px-3 font-mono text-zinc-300">${t.price.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono text-zinc-300">${t.total.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono">
                        {t.realizedPnL !== undefined ? (
                          <span className={`font-bold ${t.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {t.realizedPnL >= 0 ? '+' : ''}${t.realizedPnL.toFixed(2)} ({t.returnPct?.toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="text-zinc-500">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            soundManager.playClick();
                            onReviewTrade(t);
                          }}
                          className="px-2 py-1 bg-sky-950/70 border border-sky-600/40 hover:bg-sky-900/50 text-sky-300 rounded text-[11px] font-semibold transition"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
