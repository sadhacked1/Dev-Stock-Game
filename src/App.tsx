import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Stock,
  MarketRegime,
  NewsItem,
  Order,
  Portfolio,
  OrderType,
  OrderSide,
  TradeRecord,
  ChallengeScenario,
  CampaignLevel,
  Badge,
} from './types/game';
import { createInitialStocks } from './constants/stocks';
import {
  CAMPAIGN_LEVELS,
  CHALLENGE_SCENARIOS,
  INITIAL_BADGES,
} from './constants/curriculum';
import {
  simulateMarketDay,
  calculateTradeCost,
  getContextualTip,
} from './services/simulation';
import { soundManager } from './services/sound';
import { Navbar } from './components/Navbar';
import { StockList } from './components/StockList';
import { PortfolioView } from './components/PortfolioView';
import { NewsView } from './components/NewsView';
import { LearnView } from './components/LearnView';
import { ChallengeView } from './components/ChallengeView';
import { StockDetailModal } from './components/StockDetailModal';
import { WhyMovedModal } from './components/WhyMovedModal';
import { TradeReviewModal } from './components/TradeReviewModal';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { AIChatModal } from './components/AIChatModal';
import { AlertCircle, X, CheckCircle2, Award, Sparkles, Bot } from 'lucide-react';

const STORAGE_KEY = 'marketquest_game_state_v1';

export default function App() {
  // Game simulation state
  const [stocks, setStocks] = useState<Stock[]>(() => createInitialStocks());
  const [day, setDay] = useState<number>(1);
  const [regime, setRegime] = useState<MarketRegime>('bull');
  const [regimeRemainingDays, setRegimeRemainingDays] = useState<number>(24);
  const [indexValue, setIndexValue] = useState<number>(1000.0);
  const [indexChangePct, setIndexChangePct] = useState<number>(0.35);

  const [portfolio, setPortfolio] = useState<Portfolio>(() => {
    return {
      cash: 100000,
      startingCash: 100000,
      positions: {},
      tradeHistory: [],
      netWorthHistory: [
        {
          day: 1,
          netWorth: 100000,
          cash: 100000,
          investedValue: 0,
          indexValue: 1000,
        },
      ],
      totalRealizedPnL: 0,
    };
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [news, setNews] = useState<NewsItem[]>([
    {
      id: 'news_init_1',
      day: 1,
      headline: 'Tech Enterprise Spending Surges as Cloud Workloads Expand',
      body: 'Corporate IT budgets indicate double-digit investments in zero-trust cybersecurity and distributed cloud architecture.',
      category: 'Sector',
      impactStrength: 1.8,
      durationDays: 3,
      isReliable: true,
      sector: 'IT',
    },
    {
      id: 'news_init_2',
      day: 1,
      headline: 'Central Bank Confirms Stable Policy Stance at Monetary Forum',
      body: 'Moderate inflation and steady hiring keep consumer sentiment balanced heading into the trading quarter.',
      category: 'Macro',
      impactStrength: 1.1,
      durationDays: 4,
      isReliable: true,
    },
  ]);

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio' | 'news' | 'learn' | 'challenges'>('market');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [whyMovedStock, setWhyMovedStock] = useState<Stock | null>(null);
  const [reviewModalTrade, setReviewModalTrade] = useState<TradeRecord | null>(null);
  const [levelCompleteModal, setLevelCompleteModal] = useState<CampaignLevel | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(false);

  // Curriculum & Challenges
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [levels, setLevels] = useState<CampaignLevel[]>(() => CAMPAIGN_LEVELS);
  const [badges, setBadges] = useState<Badge[]>(() => INITIAL_BADGES);
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeScenario | null>(null);

  // Automation & Controls
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<1 | 2 | 5>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeTip, setActiveTip] = useState<string | null>(
    '👋 Welcome to MarketQuest! Start by opening any company from the Market list to inspect its fundamentals and place your first trade.'
  );

  // Objective state tracking helpers
  const [inspectedAnyStock, setInspectedAnyStock] = useState(false);
  const [checkedPortfolioTab, setCheckedPortfolioTab] = useState(false);
  const [readNewsTab, setReadNewsTab] = useState(false);
  const [openedWhyMoved, setOpenedWhyMoved] = useState(false);
  const [reviewedTrade, setReviewedTrade] = useState(false);

  // Active level unlocked order types
  const activeLevel = levels.find((l) => l.id === currentLevelId) || levels[0];
  const unlockedOrders = activeLevel.unlockedOrderTypes;

  // Unlock badge helper
  const unlockBadge = useCallback((badgeId: string) => {
    setBadges((prev) =>
      prev.map((b) => {
        if (b.id === badgeId && !b.unlocked) {
          soundManager.playSuccess();
          return { ...b, unlocked: true, unlockedDay: day };
        }
        return b;
      })
    );
  }, [day]);

  // Handle Next Day Turn
  const handleAdvanceDay = useCallback(() => {
    soundManager.playNextDay();

    const result = simulateMarketDay(
      day,
      regime,
      regimeRemainingDays,
      indexValue,
      stocks,
      news,
      portfolio,
      orders
    );

    const changePct = ((result.nextIndexValue - indexValue) / indexValue) * 100;

    setDay(result.nextDay);
    setRegime(result.nextRegime);
    setRegimeRemainingDays(result.nextRegimeRemaining);
    setIndexValue(result.nextIndexValue);
    setIndexChangePct(changePct);
    setStocks(result.nextStocks);
    setNews((prev) => [...result.newNews, ...prev.slice(0, 30)]);
    setPortfolio(result.nextPortfolio);
    setOrders(result.nextOrders);

    // If selected stock is open, update its reference to latest
    if (selectedStock) {
      const updated = result.nextStocks.find((s) => s.ticker === selectedStock.ticker);
      if (updated) setSelectedStock(updated);
    }
    if (whyMovedStock) {
      const updated = result.nextStocks.find((s) => s.ticker === whyMovedStock.ticker);
      if (updated) setWhyMovedStock(updated);
    }

    // Sound alert if stop-loss executed
    if (result.triggeredStopLosses.length > 0) {
      soundManager.playAlert();
      unlockBadge('stop_loss_hero');
      setActiveTip(
        `🛡️ Stop-Loss Executed: Your stop-loss order on ${result.triggeredStopLosses[0].ticker} triggered, capping your drawdown!`
      );
    }

    // Circuit hit alert
    if (result.circuitHits.length > 0) {
      soundManager.playAlert();
      setActiveTip(
        `⚡ Circuit Breaker Hit: ${result.circuitHits[0].ticker} hit its ${result.circuitHits[0].direction.toUpperCase()} circuit limit (±10%) today!`
      );
    }

    // Dividends received alert
    if (result.dividendPayoutsTotal > 0) {
      soundManager.playBuy();
      setActiveTip(
        `💰 Dividend Payout: You received +$${result.dividendPayoutsTotal.toFixed(2)} in quarterly dividend income from your portfolio holdings!`
      );
    }

    // Check educational contextual tips
    const contextual = getContextualTip(result.nextPortfolio, result.nextStocks, result.nextRegime, result.nextDay);
    if (contextual && result.triggeredStopLosses.length === 0 && result.circuitHits.length === 0) {
      setActiveTip(contextual);
    }

    // Check challenge completion
    if (currentChallenge) {
      const positions = Object.values(result.nextPortfolio.positions);
      const stockVal = positions.reduce((acc, p) => {
        const s = result.nextStocks.find((item) => item.ticker === p.ticker);
        return acc + (s ? p.shares * s.currentPrice : 0);
      }, 0);
      const netWorth = result.nextPortfolio.cash + stockVal;

      if (result.nextDay >= currentChallenge.durationDays) {
        setIsPlaying(false);
        if (netWorth >= currentChallenge.targetNetWorth) {
          soundManager.playSuccess();
          unlockBadge(currentChallenge.badgeId);
          setActiveTip(`🏆 Challenge Victorious! You successfully met the target net worth of $${currentChallenge.targetNetWorth.toLocaleString()}!`);
        } else {
          soundManager.playAlert();
          setActiveTip(`Challenge Ended: Finished with $${Math.round(netWorth).toLocaleString()} (Target: $${currentChallenge.targetNetWorth.toLocaleString()}). Try another strategy!`);
        }
      }
    }
  }, [day, regime, regimeRemainingDays, indexValue, stocks, news, portfolio, orders, selectedStock, whyMovedStock, currentChallenge, unlockBadge]);

  // Autoplay loop timer
  useEffect(() => {
    if (!isPlaying) return;
    const intervalTime = speed === 1 ? 1600 : speed === 2 ? 800 : 350;
    const timer = setInterval(() => {
      handleAdvanceDay();
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isPlaying, speed, handleAdvanceDay]);

  // Check Level Objectives Progress
  useEffect(() => {
    setLevels((prevLevels) =>
      prevLevels.map((lvl) => {
        if (lvl.id !== currentLevelId) return lvl;

        const updatedObjectives = lvl.objectives.map((obj) => {
          let done = obj.isDone;

          if (lvl.id === 1) {
            if (obj.id === 'l1_inspect' && inspectedAnyStock) done = true;
            if (obj.id === 'l1_first_buy' && portfolio.tradeHistory.some((t) => t.side === 'BUY' && t.shares >= 5)) done = true;
            if (obj.id === 'l1_portfolio_check' && checkedPortfolioTab) done = true;
          } else if (lvl.id === 2) {
            if (obj.id === 'l2_read_news' && readNewsTab) done = true;
            if (obj.id === 'l2_advance_day' && day >= 3) done = true;
            if (obj.id === 'l2_inspect_why' && openedWhyMoved) done = true;
          } else if (lvl.id === 3) {
            const has5kPosition = Object.values(portfolio.positions).some((p) => p.totalCost >= 5000);
            if (obj.id === 'l3_buy_stock' && has5kPosition) done = true;
            if (obj.id === 'l3_sell_profit' && portfolio.tradeHistory.some((t) => t.side === 'SELL' && (t.realizedPnL || 0) > 0)) done = true;
            if (obj.id === 'l3_review_trade' && reviewedTrade) done = true;
          } else if (lvl.id === 4) {
            if (obj.id === 'l4_toggle_candlestick') done = true;
            if (obj.id === 'l4_toggle_sma') done = true;
            if (obj.id === 'l4_trend_trade' && portfolio.tradeHistory.length > 0) done = true;
          } else if (lvl.id === 5) {
            if (obj.id === 'l5_compare_pe') done = true;
            const hasValue = Object.keys(portfolio.positions).some((ticker) => {
              const s = stocks.find((item) => item.ticker === ticker);
              return s && s.pe < 15;
            });
            const hasGrowth = Object.keys(portfolio.positions).some((ticker) => {
              const s = stocks.find((item) => item.ticker === ticker);
              return s && s.pe > 30;
            });
            if (obj.id === 'l5_buy_value' && hasValue) done = true;
            if (obj.id === 'l5_buy_growth' && hasGrowth) done = true;
          } else if (lvl.id === 6) {
            const sectorsOwned = new Set<string>();
            Object.keys(portfolio.positions).forEach((ticker) => {
              const s = stocks.find((item) => item.ticker === ticker);
              if (s) sectorsOwned.add(s.sector);
            });
            if (obj.id === 'l6_diversify_4' && sectorsOwned.size >= 4) {
              done = true;
              unlockBadge('diversifier');
            }
            if (obj.id === 'l6_max_weight') done = true;
            if (obj.id === 'l6_survive_days' && day >= 6) done = true;
          } else if (lvl.id === 7) {
            const placedStop = orders.some((o) => o.type === 'STOP_LOSS') || portfolio.tradeHistory.some((t) => t.reviewLesson?.includes('Stop-loss'));
            if (obj.id === 'l7_place_stoploss' && placedStop) done = true;
            if (obj.id === 'l7_trigger_or_protect' && day >= 4) done = true;
          } else if (lvl.id === 8) {
            if (obj.id === 'l8_place_limit' && orders.some((o) => o.type === 'LIMIT')) done = true;
            if (obj.id === 'l8_place_target' && orders.some((o) => o.type === 'TARGET')) done = true;
            if (obj.id === 'l8_execute_order' && portfolio.tradeHistory.some((t) => t.reviewLesson?.includes('executed') || t.reviewLesson?.includes('Target'))) done = true;
          } else if (lvl.id === 9) {
            if (obj.id === 'l9_check_regime') done = true;
            if (obj.id === 'l9_beta_analysis') done = true;
            if (obj.id === 'l9_protect_bear') done = true;
          } else if (lvl.id === 10) {
            if (obj.id === 'l10_trade_60_days' && day >= 25) done = true;
            const portReturn = (portfolio.cash - portfolio.startingCash) / portfolio.startingCash;
            if (obj.id === 'l10_beat_index' && portReturn > 0) {
              done = true;
              unlockBadge('index_crusher');
            }
            if (obj.id === 'l10_no_margin_call') done = true;
          }

          return { ...obj, isDone: done };
        });

        // Trigger level completion celebration if all objectives newly done
        const allDone = updatedObjectives.every((o) => o.isDone);
        if (allDone && !lvl.objectives.every((o) => o.isDone)) {
          soundManager.playSuccess();
          setLevelCompleteModal({ ...lvl, objectives: updatedObjectives });
        }

        return { ...lvl, objectives: updatedObjectives };
      })
    );
  }, [
    currentLevelId,
    inspectedAnyStock,
    checkedPortfolioTab,
    readNewsTab,
    openedWhyMoved,
    reviewedTrade,
    portfolio,
    stocks,
    day,
    orders,
    unlockBadge,
  ]);

  // Execute Market / Limit / Stop Order from user
  const handlePlaceOrder = (
    ticker: string,
    side: OrderSide,
    type: OrderType,
    quantity: number,
    targetPrice?: number
  ) => {
    const stock = stocks.find((s) => s.ticker === ticker);
    if (!stock) return;

    if (type === 'MARKET') {
      const costCalc = calculateTradeCost(stock.currentPrice, quantity, stock.volatility, side);

      if (side === 'BUY') {
        if (portfolio.cash < costCalc.netTotal) return;

        soundManager.playBuy();
        unlockBadge('first_trade');

        const existing = portfolio.positions[ticker] || {
          ticker,
          shares: 0,
          averagePrice: 0,
          totalCost: 0,
        };
        const newShares = existing.shares + quantity;
        const newTotalCost = existing.totalCost + costCalc.tradeValue;

        const nextPositions = {
          ...portfolio.positions,
          [ticker]: {
            ticker,
            shares: newShares,
            averagePrice: Math.round((newTotalCost / newShares) * 100) / 100,
            totalCost: newTotalCost,
          },
        };

        const newTrade: TradeRecord = {
          id: `trade_${day}_${Math.random().toString(36).substring(2, 7)}`,
          day,
          ticker,
          side: 'BUY',
          shares: quantity,
          price: costCalc.executionPrice,
          total: costCalc.netTotal,
          fee: costCalc.fee,
          reviewLesson: `Bought ${quantity} shares of ${ticker} at $${costCalc.executionPrice}. Position established.`,
        };

        setPortfolio({
          ...portfolio,
          cash: Math.round((portfolio.cash - costCalc.netTotal) * 100) / 100,
          positions: nextPositions,
          tradeHistory: [newTrade, ...portfolio.tradeHistory],
        });
      } else {
        // SELL
        const existing = portfolio.positions[ticker];
        if (!existing || existing.shares < quantity) return;

        soundManager.playSell();

        const costOfSold = existing.averagePrice * quantity;
        const pnl = costCalc.tradeValue - costOfSold - costCalc.fee;
        const returnPct = ((costCalc.tradeValue - costOfSold) / costOfSold) * 100;

        const remainingShares = existing.shares - quantity;
        const nextPositions = { ...portfolio.positions };
        if (remainingShares <= 0) {
          delete nextPositions[ticker];
        } else {
          nextPositions[ticker] = {
            ...existing,
            shares: remainingShares,
            totalCost: existing.averagePrice * remainingShares,
          };
        }

        const newTrade: TradeRecord = {
          id: `trade_${day}_${Math.random().toString(36).substring(2, 7)}`,
          day,
          ticker,
          side: 'SELL',
          shares: quantity,
          price: costCalc.executionPrice,
          total: costCalc.netTotal,
          fee: costCalc.fee,
          realizedPnL: Math.round(pnl * 100) / 100,
          returnPct: Math.round(returnPct * 10) / 10,
          reviewLesson: pnl >= 0
            ? `Secured +$${pnl.toFixed(2)} (+${returnPct.toFixed(1)}%) profit! Locking in gains reduces portfolio volatility.`
            : `Loss of -$${Math.abs(pnl).toFixed(2)} (${returnPct.toFixed(1)}%). Remember: taking a small loss protects against catastrophic drawdowns.`,
        };

        setPortfolio({
          ...portfolio,
          cash: Math.round((portfolio.cash + costCalc.netTotal) * 100) / 100,
          positions: nextPositions,
          tradeHistory: [newTrade, ...portfolio.tradeHistory],
          totalRealizedPnL: Math.round((portfolio.totalRealizedPnL + pnl) * 100) / 100,
        });

        // Prompt user with post-trade review
        setReviewModalTrade(newTrade);
      }
    } else {
      // Pending Order (LIMIT, STOP_LOSS, TARGET)
      soundManager.playClick();
      const newOrder: Order = {
        id: `ord_${day}_${Math.random().toString(36).substring(2, 7)}`,
        ticker,
        side,
        type,
        targetPrice: targetPrice || stock.currentPrice,
        quantity,
        placedDay: day,
        status: 'PENDING',
        fee: Math.max(1, (targetPrice || stock.currentPrice) * quantity * 0.001),
      };

      setOrders((prev) => [newOrder, ...prev]);
      setActiveTip(
        `Order Queued: ${type} ${side} order placed for ${quantity} shares of ${ticker} at $${(targetPrice || stock.currentPrice).toFixed(2)}. It will execute when market criteria are satisfied.`
      );
    }
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  // Reset Game State to Fresh Day 1
  const handleResetGame = () => {
    if (window.confirm('Reset MarketQuest simulation back to Day 1 with fresh cash?')) {
      soundManager.playClick();
      setIsPlaying(false);
      setStocks(createInitialStocks());
      setDay(1);
      setRegime('bull');
      setRegimeRemainingDays(24);
      setIndexValue(1000.0);
      setIndexChangePct(0.35);
      setOrders([]);
      setCurrentChallenge(null);
      setPortfolio({
        cash: 100000,
        startingCash: 100000,
        positions: {},
        tradeHistory: [],
        netWorthHistory: [{ day: 1, netWorth: 100000, cash: 100000, investedValue: 0, indexValue: 1000 }],
        totalRealizedPnL: 0,
      });
      setActiveTip('Simulation reset to initial state. Ready to trade!');
    }
  };

  // Start Challenge
  const handleStartChallenge = (scenario: ChallengeScenario) => {
    soundManager.playSuccess();
    setCurrentChallenge(scenario);
    setDay(1);
    setRegime(scenario.startingRegime);
    setRegimeRemainingDays(scenario.durationDays);
    setOrders([]);
    setPortfolio({
      cash: scenario.startingCash,
      startingCash: scenario.startingCash,
      positions: {},
      tradeHistory: [],
      netWorthHistory: [{ day: 1, netWorth: scenario.startingCash, cash: scenario.startingCash, investedValue: 0, indexValue: 1000 }],
      totalRealizedPnL: 0,
    });
    setActiveTab('market');
    setActiveTip(`🎯 ${scenario.title} started! Target Net Worth: $${scenario.targetNetWorth.toLocaleString()} over ${scenario.durationDays} days.`);
  };

  // Pass Checkpoint Quiz
  const handlePassQuiz = (levelId: number) => {
    unlockBadge('quiz_whiz');
    if (levelId === currentLevelId && currentLevelId < CAMPAIGN_LEVELS.length) {
      setCurrentLevelId(levelId + 1);
      setActiveTip(`🎉 Level ${levelId} Checkpoint Passed! Unlocked Level ${levelId + 1}: ${CAMPAIGN_LEVELS[levelId].title}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Educational Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Top Navigation & Dashboard Bar */}
      <Navbar
        day={day}
        regime={regime}
        regimeRemainingDays={regimeRemainingDays}
        indexValue={indexValue}
        indexChangePct={indexChangePct}
        portfolio={portfolio}
        mode={currentChallenge ? 'challenge' : 'campaign'}
        activeTab={activeTab}
        isPlaying={isPlaying}
        speed={speed}
        soundEnabled={soundEnabled}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'portfolio') setCheckedPortfolioTab(true);
          if (tab === 'news') setReadNewsTab(true);
        }}
        onNextDay={handleAdvanceDay}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onChangeSpeed={(s) => setSpeed(s)}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          soundManager.enabled = next;
        }}
        onResetGame={handleResetGame}
        onOpenAIChat={() => setIsAIChatOpen(true)}
      />

      {/* Active Tip / Notification Banner */}
      {activeTip && (
        <div className="bg-sky-950/40 border-b border-sky-800/40 py-2 px-3 text-xs text-sky-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{activeTip}</span>
            </div>
            <button
              onClick={() => setActiveTip(null)}
              className="text-sky-400 hover:text-white p-0.5 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-5">
        {activeTab === 'market' && (
          <StockList
            stocks={stocks}
            onSelectStock={(stock) => {
              setSelectedStock(stock);
              setInspectedAnyStock(true);
            }}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioView
            portfolio={portfolio}
            stocks={stocks}
            orders={orders}
            onSelectStock={(stock) => setSelectedStock(stock)}
            onCancelOrder={handleCancelOrder}
            onReviewTrade={(trade) => setReviewModalTrade(trade)}
          />
        )}

        {activeTab === 'news' && (
          <NewsView
            news={news}
            stocks={stocks}
            onSelectStock={(stock) => setSelectedStock(stock)}
          />
        )}

        {activeTab === 'learn' && (
          <LearnView
            levels={levels}
            currentLevelId={currentLevelId}
            badges={badges}
            onSelectLevel={(id) => setCurrentLevelId(id)}
            onPassQuiz={handlePassQuiz}
          />
        )}

        {activeTab === 'challenges' && (
          <ChallengeView
            currentChallengeId={currentChallenge ? currentChallenge.id : null}
            onStartChallenge={handleStartChallenge}
            onExitChallenge={() => {
              setCurrentChallenge(null);
              setActiveTip('Returned to Free Play mode.');
            }}
          />
        )}
      </main>

      {/* Stock Detail & Order Placement Modal */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          portfolio={portfolio}
          unlockedOrderTypes={unlockedOrders}
          trades={portfolio.tradeHistory}
          onClose={() => setSelectedStock(null)}
          onPlaceOrder={handlePlaceOrder}
          onOpenWhyMoved={(stock) => {
            setWhyMovedStock(stock);
            setOpenedWhyMoved(true);
          }}
          onOpenAIChat={() => setIsAIChatOpen(true)}
        />
      )}

      {/* "Why Did It Move?" Decomposition Modal */}
      {whyMovedStock && (
        <WhyMovedModal
          stock={whyMovedStock}
          onClose={() => setWhyMovedStock(null)}
        />
      )}

      {/* Post-Trade Review Modal */}
      {reviewModalTrade && (
        <TradeReviewModal
          trade={reviewModalTrade}
          onClose={() => {
            setReviewModalTrade(null);
            setReviewedTrade(true);
          }}
        />
      )}

      {/* Level Complete Celebration Modal */}
      {levelCompleteModal && (
        <LevelCompleteModal
          level={levelCompleteModal}
          onClose={() => setLevelCompleteModal(null)}
          onOpenQuiz={() => {
            setLevelCompleteModal(null);
            setActiveTab('learn');
          }}
        />
      )}

      {/* Floating Ask AI Coach Button (when modal is closed) */}
      {!isAIChatOpen && (
        <button
          onClick={() => {
            soundManager.playClick();
            setIsAIChatOpen(true);
          }}
          className="fixed bottom-5 right-5 z-40 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-bold transition transform hover:scale-105 group border border-sky-400/40 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-sky-200" />
          </div>
          <span>Ask AI Coach</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      )}

      {/* AI Chat Bot Assistant Modal */}
      <AIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        day={day}
        regime={regime}
        indexValue={indexValue}
        indexChangePct={indexChangePct}
        portfolio={portfolio}
        stocks={stocks}
        inspectedStock={selectedStock}
      />

      {/* Footer info & Dev Bhati credit */}
      <footer className="border-t border-zinc-900 py-4 px-4 text-center text-xs text-zinc-500 bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MarketQuest · Interactive Stock Market Learning Simulator</span>
          <span className="text-zinc-400 font-medium">Made by Dev Bhati</span>
          <span>Virtual Trading Environment · Zero Real Money Risk</span>
        </div>
      </footer>
    </div>
  );
}
