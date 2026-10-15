import React, { useState } from 'react';
import {
  Stock,
  Portfolio,
  OrderType,
  OrderSide,
  TradeRecord,
} from '../types/game';
import { StockChart } from './StockChart';
import { calculateTradeCost, getBidAskSpreadPct } from '../services/simulation';
import { soundManager } from '../services/sound';
import {
  X,
  TrendingUp,
  TrendingDown,
  Info,
  HelpCircle,
  Lightbulb,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Check,
  Bot,
} from 'lucide-react';

interface StockDetailModalProps {
  stock: Stock | null;
  portfolio: Portfolio;
  unlockedOrderTypes: OrderType[];
  trades: TradeRecord[];
  onClose: () => void;
  onPlaceOrder: (
    ticker: string,
    side: OrderSide,
    type: OrderType,
    quantity: number,
    targetPrice?: number
  ) => void;
  onOpenWhyMoved: (stock: Stock) => void;
  onOpenAIChat?: (stock: Stock) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  stock,
  portfolio,
  unlockedOrderTypes,
  trades,
  onClose,
  onPlaceOrder,
  onOpenWhyMoved,
  onOpenAIChat,
}) => {
  if (!stock) return null;

  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [quantity, setQuantity] = useState<number>(10);
  const [customPrice, setCustomPrice] = useState<number>(stock.currentPrice);
  const [hintTier, setHintTier] = useState<number>(0);
  const [orderSubmittedSuccess, setOrderSubmittedSuccess] = useState<boolean>(false);

  const ownedShares = portfolio.positions[stock.ticker]?.shares || 0;
  const avgCost = portfolio.positions[stock.ticker]?.averagePrice || 0;
  const isUpToday = stock.currentPrice >= stock.previousPrice;
  const dayChangePct = ((stock.currentPrice - stock.previousPrice) / stock.previousPrice) * 100;

  // Maximum shares calculable
  const spreadPct = getBidAskSpreadPct(stock.volatility);
  const effectiveBuyPrice = stock.currentPrice * (1 + spreadPct);
  const maxAffordableShares = Math.max(0, Math.floor(portfolio.cash / (effectiveBuyPrice * 1.001)));
  const maxSellableShares = ownedShares;

  // Calculation for order summary
  const orderTargetPrice = orderType === 'MARKET' ? stock.currentPrice : (customPrice || stock.currentPrice);
  const costSummary = calculateTradeCost(orderTargetPrice, quantity, stock.volatility, side);

  const canAffordBuy = portfolio.cash >= costSummary.netTotal;
  const canSellShares = ownedShares >= quantity;
  const isValidOrder = quantity > 0 && (side === 'BUY' ? canAffordBuy : canSellShares);

  const handleQuickQty = (shares: number) => {
    soundManager.playClick();
    if (side === 'BUY') {
      setQuantity(Math.min(shares, maxAffordableShares || 1));
    } else {
      setQuantity(Math.min(shares, maxSellableShares || 1));
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidOrder) return;

    onPlaceOrder(stock.ticker, side, orderType, quantity, orderType !== 'MARKET' ? customPrice : undefined);
    setOrderSubmittedSuccess(true);
    setTimeout(() => {
      setOrderSubmittedSuccess(false);
      onClose();
    }, 900);
  };

  // 4-tier hint system for this stock
  const hints = [
    {
      level: 1,
      title: 'Nudge',
      text: `Notice ${stock.ticker}'s P/E of ${stock.pe} and Beta of ${stock.beta}. How sensitive is this sector to the broader economic regime?`,
    },
    {
      level: 2,
      title: 'Concept Explanation',
      text: stock.pe > 30
        ? `A P/E of ${stock.pe} means investors expect high future earnings growth. Higher expectations mean sharper drops if earnings miss estimates.`
        : `A P/E of ${stock.pe} is historically modest. Value stocks with solid dividend yields (${stock.dividendYield}%) tend to hold value during market dips.`,
    },
    {
      level: 3,
      title: 'Guided Action',
      text: stock.currentPrice > (stock.history.slice(-20).reduce((a, b) => a + b.close, 0) / 20)
        ? `The price is trading above its 20-day moving average (Uptrend). If entering long, consider a Stop-Loss 3-5% below to protect downside.`
        : `The price is testing support below its 20-day moving average. Consider a Buy Limit order at a discount instead of chasing market orders.`,
    },
    {
      level: 4,
      title: 'Answer Reveal & Strategy',
      text: `Target entry: place a Limit Buy at $${(stock.currentPrice * 0.97).toFixed(1)} or set a Stop-Loss at $${(stock.currentPrice * 0.95).toFixed(1)} immediately after buying. Never risk more than 5% of your portfolio on one trade.`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-4xl w-full my-auto shadow-2xl flex flex-col overflow-hidden max-h-[96vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white">{stock.ticker}</h1>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                  {stock.sector}
                </span>
                <span className={`text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                  stock.volatility === 'low'
                    ? 'bg-emerald-950 text-emerald-400'
                    : stock.volatility === 'medium'
                    ? 'bg-amber-950 text-amber-400'
                    : 'bg-rose-950 text-rose-400'
                }`}>
                  {stock.volatility} Vol
                </span>
              </div>
              <p className="text-xs text-zinc-400">{stock.name}</p>
            </div>
          </div>

          {/* Right side live price */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xl font-bold font-mono text-white">
                ${stock.currentPrice.toFixed(2)}
              </div>
              <div className={`flex items-center justify-end text-xs font-mono font-semibold ${isUpToday ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isUpToday ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                {dayChangePct >= 0 ? `+${dayChangePct.toFixed(2)}%` : `${dayChangePct.toFixed(2)}%`}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 md:p-4 overflow-y-auto space-y-4">
          {/* Chart Component */}
          <StockChart history={stock.history} trades={trades} ticker={stock.ticker} height={280} />

          {/* Action Row: Why Did It Move & Educational Hints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Why did it move button */}
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenWhyMoved(stock);
              }}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-sky-500/50 hover:bg-zinc-850 transition text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-sky-950/70 text-sky-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-sky-300">
                    Why Did It Move Today?
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Inspect market drag, sector influence, catalysts & noise
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-sky-400 transition transform group-hover:translate-x-0.5" />
            </button>

            {/* Hint Tier Trigger */}
            <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  Trading Hint & Coach
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {hintTier === 0 ? 'No Hint Active' : `Level ${hintTier}/4`}
                </span>
              </div>

              {hintTier === 0 ? (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-zinc-400">Need help deciding on this stock?</span>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setHintTier(1);
                    }}
                    className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 rounded text-[11px] font-semibold transition"
                  >
                    Reveal Hint 1 (Nudge)
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="p-2 rounded bg-amber-950/30 border border-amber-600/30 text-amber-200 text-xs leading-relaxed">
                    <strong>{hints[hintTier - 1].title}: </strong>
                    {hints[hintTier - 1].text}
                  </div>
                  {hintTier < 4 && (
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setHintTier((prev) => Math.min(4, prev + 1));
                      }}
                      className="text-[11px] text-zinc-400 hover:text-amber-300 underline block text-right"
                    >
                      Need deeper guidance? Reveal {hints[hintTier].title} →
                    </button>
                  )}
                </div>
              )}

              {onOpenAIChat && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    onOpenAIChat(stock);
                  }}
                  className="mt-2 w-full py-1.5 px-2.5 rounded bg-sky-950/60 border border-sky-600/40 hover:bg-sky-900/40 text-sky-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Bot className="w-3.5 h-3.5 text-sky-400" />
                  Ask QuestBot AI Coach about {stock.ticker}
                </button>
              )}
            </div>
          </div>

          {/* Fundamentals & Key Ratios */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
              Fundamental Valuation & Statistics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
              <div className="bg-zinc-900 p-2 rounded border border-zinc-850">
                <span className="text-zinc-500 block text-[11px]">P/E Ratio</span>
                <span className="font-mono font-bold text-zinc-200">{stock.pe}x</span>
              </div>
              <div className="bg-zinc-900 p-2 rounded border border-zinc-850">
                <span className="text-zinc-500 block text-[11px]">EPS (Profit/Share)</span>
                <span className="font-mono font-bold text-zinc-200">${stock.eps.toFixed(2)}</span>
              </div>
              <div className="bg-zinc-900 p-2 rounded border border-zinc-850">
                <span className="text-zinc-500 block text-[11px]">Beta (Sensitivity)</span>
                <span className="font-mono font-bold text-zinc-200">{stock.beta}</span>
              </div>
              <div className="bg-zinc-900 p-2 rounded border border-zinc-850">
                <span className="text-zinc-500 block text-[11px]">Dividend Yield</span>
                <span className="font-mono font-bold text-emerald-400">{stock.dividendYield}%</span>
              </div>
              <div className="bg-zinc-900 p-2 rounded border border-zinc-850">
                <span className="text-zinc-500 block text-[11px]">Market Cap</span>
                <span className="font-mono font-bold text-zinc-200">
                  ${((stock.currentPrice * stock.sharesOutstanding) / 1000).toFixed(1)}B
                </span>
              </div>
              <div className="bg-zinc-900 p-2 rounded border border-zinc-850">
                <span className="text-zinc-500 block text-[11px]">Fair Value Est.</span>
                <span className="font-mono font-bold text-sky-400">${stock.fairValue.toFixed(1)}</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
              {stock.description}
            </p>
          </div>

          {/* Order Placement Form */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Order Execution Desk
              </h3>
              <div className="text-xs text-zinc-400">
                Holding: <strong className="text-white font-mono">{ownedShares}</strong> shares
                {ownedShares > 0 && ` (Avg: $${avgCost.toFixed(2)})`}
              </div>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-3">
              {/* Buy / Sell Tabs */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setSide('BUY');
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    side === 'BUY'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  BUY {stock.ticker}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setSide('SELL');
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    side === 'SELL'
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  SELL {stock.ticker}
                </button>
              </div>

              {/* Order Types */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 block">
                  Select Order Type (Section 5.8)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(['MARKET', 'LIMIT', 'STOP_LOSS', 'TARGET'] as OrderType[]).map((type) => {
                    const isUnlocked = unlockedOrderTypes.includes(type);
                    const isSelected = orderType === type;

                    return (
                      <button
                        type="button"
                        key={type}
                        disabled={!isUnlocked}
                        onClick={() => {
                          if (isUnlocked) {
                            soundManager.playClick();
                            setOrderType(type);
                          }
                        }}
                        className={`p-2 rounded text-left border text-xs transition relative ${
                          !isUnlocked
                            ? 'opacity-40 cursor-not-allowed bg-zinc-950 border-zinc-850 text-zinc-600'
                            : isSelected
                            ? 'bg-sky-950/60 border-sky-500 text-sky-200'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          {type === 'MARKET' ? 'Market' : type === 'LIMIT' ? 'Limit' : type === 'STOP_LOSS' ? 'Stop-Loss' : 'Target (Take-P)'}
                          {!isUnlocked && <span className="text-[9px] uppercase font-mono text-zinc-500">Locked</span>}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                          {type === 'MARKET'
                            ? 'Instant fill at market price'
                            : type === 'LIMIT'
                            ? 'Fills at your price or better'
                            : type === 'STOP_LOSS'
                            ? 'Auto-sells if price drops'
                            : 'Auto-sells at profit target'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target / Trigger Price for Limit / Stop / Target */}
              {orderType !== 'MARKET' && (
                <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-zinc-400">
                    <label className="font-semibold text-white">
                      {orderType === 'LIMIT' ? 'Limit Price ($)' : orderType === 'STOP_LOSS' ? 'Stop Trigger Price ($)' : 'Profit Target Price ($)'}
                    </label>
                    <span className="text-[11px] font-mono">Current: ${stock.currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-900 border border-zinc-750 rounded px-3 py-1.5 text-white font-mono focus:outline-hidden focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const mult = orderType === 'STOP_LOSS' ? 0.95 : orderType === 'TARGET' ? 1.08 : side === 'BUY' ? 0.97 : 1.03;
                        setCustomPrice(Math.round(stock.currentPrice * mult * 10) / 10);
                      }}
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] whitespace-nowrap"
                    >
                      {orderType === 'STOP_LOSS' ? '-5% Stop' : orderType === 'TARGET' ? '+8% Target' : 'Suggested'}
                    </button>
                  </div>
                </div>
              )}

              {/* Quantity Input and Quick Chips */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-zinc-300">Quantity (Shares)</label>
                  <span className="text-zinc-500 text-[11px]">
                    Available Cash: <strong className="text-white font-mono">${portfolio.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={side === 'BUY' ? maxAffordableShares : maxSellableShares}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 bg-zinc-950 border border-zinc-750 rounded px-3 py-1.5 text-white font-mono focus:outline-hidden focus:border-sky-500"
                  />
                  <div className="flex items-center gap-1 text-[11px]">
                    {[5, 20, 50].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleQuickQty(q)}
                        className="px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                      >
                        +{q}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleQuickQty(side === 'BUY' ? maxAffordableShares : maxSellableShares)}
                      className="px-2.5 py-1.5 rounded bg-sky-950/70 border border-sky-600/40 text-sky-300 font-bold hover:bg-sky-900/50 transition"
                    >
                      Max
                    </button>
                  </div>
                </div>
              </div>

              {/* Cost & Fee Summary */}
              <div className="bg-zinc-950 p-2.5 rounded border border-zinc-850 space-y-1 text-[11px]">
                <div className="flex justify-between text-zinc-400">
                  <span>Execution Price (with {costSummary.spreadPct.toFixed(2)}% spread):</span>
                  <span className="font-mono text-zinc-200">${costSummary.executionPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Gross Trade Value:</span>
                  <span className="font-mono text-zinc-200">${costSummary.tradeValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Brokerage Fee (0.1%):</span>
                  <span className="font-mono text-zinc-400">${costSummary.fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1.5 border-t border-zinc-800 text-white">
                  <span>{side === 'BUY' ? 'Total Cash Required:' : 'Estimated Net Proceeds:'}</span>
                  <span className={`font-mono ${side === 'BUY' ? 'text-sky-300' : 'text-emerald-400'}`}>
                    ${costSummary.netTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isValidOrder || orderSubmittedSuccess}
                className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                  orderSubmittedSuccess
                    ? 'bg-emerald-600 text-white'
                    : !isValidOrder
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : side === 'BUY'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50'
                }`}
              >
                {orderSubmittedSuccess ? (
                  <>
                    <Check className="w-4 h-4" /> Order Confirmed!
                  </>
                ) : (
                  <>
                    {side === 'BUY' ? 'Execute Buy Order' : 'Execute Sell Order'}
                  </>
                )}
              </button>

              {!isValidOrder && (
                <p className="text-[11px] text-rose-400 text-center">
                  {side === 'BUY'
                    ? 'Insufficient cash balance for this order size.'
                    : `You only own ${ownedShares} shares of ${stock.ticker}.`}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
