import {
  Stock,
  StockHistoryPoint,
  MarketRegime,
  NewsItem,
  Order,
  Portfolio,
  PriceDecomposition,
  Sector,
  TradeRecord,
  VolatilityLevel,
} from '../types/game';

// Brokerage fee rate: 0.1% with $1 minimum
export const BROKERAGE_FEE_RATE = 0.001;
export const MIN_BROKERAGE_FEE = 1.0;

// Bid-ask half-spread by volatility
export function getBidAskSpreadPct(volatility: VolatilityLevel): number {
  switch (volatility) {
    case 'low':
      return 0.0008; // 0.08%
    case 'medium':
      return 0.0018; // 0.18%
    case 'high':
      return 0.0035; // 0.35%
  }
}

export function calculateTradeCost(price: number, quantity: number, volatility: VolatilityLevel, side: 'BUY' | 'SELL') {
  const spread = getBidAskSpreadPct(volatility);
  // Buyer pays ask (price * (1 + spread)), Seller receives bid (price * (1 - spread))
  const executionPrice = side === 'BUY' ? price * (1 + spread) : price * (1 - spread);
  const tradeValue = executionPrice * quantity;
  const fee = Math.max(MIN_BROKERAGE_FEE, tradeValue * BROKERAGE_FEE_RATE);
  const netTotal = side === 'BUY' ? tradeValue + fee : tradeValue - fee;

  return {
    executionPrice: Math.round(executionPrice * 100) / 100,
    tradeValue: Math.round(tradeValue * 100) / 100,
    fee: Math.round(fee * 100) / 100,
    netTotal: Math.round(netTotal * 100) / 100,
    spreadPct: spread * 100,
  };
}

// Generate News Catalog
const NEWS_TEMPLATES: Array<{
  headline: string;
  body: string;
  targetType: 'company' | 'sector' | 'market';
  sector?: Sector;
  impact: number;
  category: NewsItem['category'];
  isReliable: boolean;
}> = [
  // IT
  {
    headline: 'Apex Cyber Lands $180M Federal Defense Security Contract',
    body: 'Enterprise cyber defense bookings surged as federal agencies accelerate zero-trust mandate adoption.',
    targetType: 'company',
    sector: 'IT',
    impact: 2.2,
    category: 'Product',
    isReliable: true,
  },
  {
    headline: 'Global Cloud Infrastructure Spending Forecast Raised by 18%',
    body: 'Enterprise migration toward AI workloads drives robust revenue acceleration across cloud providers.',
    targetType: 'sector',
    sector: 'IT',
    impact: 1.5,
    category: 'Sector',
    isReliable: true,
  },
  {
    headline: 'Rumor: Major Tech Firm Facing Stricter Data Privacy Regulations',
    body: 'Unverified regulatory leak suggests antitrust inquiry into cloud data licensing pricing.',
    targetType: 'sector',
    sector: 'IT',
    impact: -1.4,
    category: 'Rumor',
    isReliable: false,
  },

  // Banking
  {
    headline: 'Central Bank Signals Extended Pause on Interest Rates',
    body: 'Commercial banks maintain healthy net interest margins while commercial loan defaults stay muted.',
    targetType: 'sector',
    sector: 'Banking',
    impact: 1.2,
    category: 'Macro',
    isReliable: true,
  },
  {
    headline: 'Zenith National Bank Posts Record Tier-1 Capital Adequacy',
    body: 'Strong retail deposit inflows solidify balance sheet strength amid market-wide liquidity scrutiny.',
    targetType: 'company',
    sector: 'Banking',
    impact: 1.6,
    category: 'Earnings',
    isReliable: true,
  },
  {
    headline: 'Credit Rating Agency Downgrades Commercial Real Estate Debt',
    body: 'Investment banking advisory revenues face headwinds as high-yield debt issuance contracts.',
    targetType: 'sector',
    sector: 'Banking',
    impact: -1.5,
    category: 'Macro',
    isReliable: true,
  },

  // Pharma
  {
    headline: 'BioGenix Phase 3 Trial Meets Primary Clinical Endpoint with High Efficacy',
    body: 'Regulatory fast-track review granted for breakthrough genetic rare-disease therapy candidate.',
    targetType: 'company',
    sector: 'Pharma',
    impact: 2.8,
    category: 'Product',
    isReliable: true,
  },
  {
    headline: 'Healthcare Agency Approves Generic Alternatives for Blockbuster Drug',
    body: 'Pricing pressures emerge across standard legacy cardiovascular medications.',
    targetType: 'sector',
    sector: 'Pharma',
    impact: -1.3,
    category: 'Regulatory',
    isReliable: true,
  },

  // FMCG
  {
    headline: 'Harvest Foods Expands Direct-to-Consumer Distribution in Asian Markets',
    body: 'Strong organic consumer demand provides resilient margin expansion against retail inflation.',
    targetType: 'company',
    sector: 'FMCG',
    impact: 1.2,
    category: 'Product',
    isReliable: true,
  },
  {
    headline: 'Agricultural Commodity Costs Fall 8%, Boosting Consumer Staples Margins',
    body: 'Packaged food and household beverage makers benefit from lower input packaging and shipping costs.',
    targetType: 'sector',
    sector: 'FMCG',
    impact: 1.4,
    category: 'Sector',
    isReliable: true,
  },

  // Energy
  {
    headline: 'SolarVolt Signs Multi-Gigawatt Renewable Power Purchase Agreement',
    body: 'Industrial manufacturers sign long-term clean electricity supply contracts, boosting forward backlog.',
    targetType: 'company',
    sector: 'Energy',
    impact: 2.0,
    category: 'Product',
    isReliable: true,
  },
  {
    headline: 'Crude Oil Inventory Surplus Drags Down Fossil Fuel Refining Spreads',
    body: 'Global energy demand slows slightly as industrial production gauges soften.',
    targetType: 'sector',
    sector: 'Energy',
    impact: -1.6,
    category: 'Sector',
    isReliable: true,
  },

  // Auto
  {
    headline: 'Quantum Mobility Unveils Next-Gen Solid-State Battery Platform',
    body: 'New battery architecture achieves 600-mile real-world driving range on a single 15-minute charge.',
    targetType: 'company',
    sector: 'Auto',
    impact: 2.5,
    category: 'Product',
    isReliable: true,
  },
  {
    headline: 'Automotive Supply Chain Bottlenecks Impact Global Assembly Lines',
    body: 'Component shortages lead to temporary plant curtailments across traditional vehicle makers.',
    targetType: 'sector',
    sector: 'Auto',
    impact: -1.8,
    category: 'Sector',
    isReliable: true,
  },

  // Macro / Market
  {
    headline: 'National GDP Beats Forecast at 3.1% Annualized Expansion',
    body: 'Consumer spending resilience and corporate capex signal sustained macroeconomic strength.',
    targetType: 'market',
    impact: 1.8,
    category: 'Macro',
    isReliable: true,
  },
  {
    headline: 'Geopolitical Tensions Drive Inflation Spikes in Shipping Freights',
    body: 'Market sentiment turns defensive as traders price in risk premiums and bond yield volatility.',
    targetType: 'market',
    impact: -2.1,
    category: 'Macro',
    isReliable: true,
  },
];

// Pick news items for the day based on regime
export function generateDailyNews(day: number, regime: MarketRegime, stocks: Stock[]): NewsItem[] {
  const newsList: NewsItem[] = [];
  
  // Decide news count: 1 to 2 headlines per day
  const count = Math.random() < 0.65 ? 1 : 2;

  // Filter templates matching sentiment loosely
  let filtered = NEWS_TEMPLATES;
  if (regime === 'bull') {
    filtered = NEWS_TEMPLATES.filter((t) => t.impact > -1.5);
  } else if (regime === 'bear' || regime === 'crash') {
    filtered = NEWS_TEMPLATES.filter((t) => t.impact < 1.8);
  }

  for (let i = 0; i < count; i++) {
    const template = filtered[Math.floor(Math.random() * filtered.length)];
    let targetTicker: string | undefined = undefined;

    if (template.targetType === 'company') {
      const sectorStocks = stocks.filter((s) => s.sector === template.sector);
      if (sectorStocks.length > 0) {
        targetTicker = sectorStocks[Math.floor(Math.random() * sectorStocks.length)].ticker;
      }
    }

    newsList.push({
      id: `news_${day}_${i}_${Math.random().toString(36).substring(2, 7)}`,
      day,
      headline: template.headline,
      body: template.body,
      sector: template.sector,
      ticker: targetTicker,
      category: template.category,
      impactStrength: template.impact,
      durationDays: Math.floor(Math.random() * 2) + 1,
      isReliable: template.isReliable,
    });
  }

  return newsList;
}

// Next Regime Transition Logic
export function advanceRegime(
  currentRegime: MarketRegime,
  remainingDays: number
): { regime: MarketRegime; remainingDays: number } {
  if (remainingDays > 1) {
    return { regime: currentRegime, remainingDays: remainingDays - 1 };
  }

  // Transition probabilities
  const rand = Math.random();
  let nextRegime: MarketRegime = 'sideways';
  let nextDuration = 20;

  if (currentRegime === 'bull') {
    if (rand < 0.45) {
      nextRegime = 'bull';
      nextDuration = Math.floor(20 + Math.random() * 30);
    } else if (rand < 0.8) {
      nextRegime = 'sideways';
      nextDuration = Math.floor(15 + Math.random() * 20);
    } else {
      nextRegime = 'bear';
      nextDuration = Math.floor(15 + Math.random() * 25);
    }
  } else if (currentRegime === 'bear') {
    if (rand < 0.4) {
      nextRegime = 'bear';
      nextDuration = Math.floor(15 + Math.random() * 25);
    } else if (rand < 0.8) {
      nextRegime = 'sideways';
      nextDuration = Math.floor(15 + Math.random() * 20);
    } else if (rand < 0.95) {
      nextRegime = 'bull';
      nextDuration = Math.floor(25 + Math.random() * 30);
    } else {
      nextRegime = 'crash';
      nextDuration = Math.floor(4 + Math.random() * 6);
    }
  } else if (currentRegime === 'crash') {
    // Crash ends quickly into bear or sideways
    if (rand < 0.55) {
      nextRegime = 'bear';
      nextDuration = Math.floor(15 + Math.random() * 20);
    } else {
      nextRegime = 'sideways';
      nextDuration = Math.floor(15 + Math.random() * 20);
    }
  } else {
    // Sideways
    if (rand < 0.35) {
      nextRegime = 'bull';
      nextDuration = Math.floor(25 + Math.random() * 35);
    } else if (rand < 0.65) {
      nextRegime = 'bear';
      nextDuration = Math.floor(18 + Math.random() * 25);
    } else if (rand < 0.95) {
      nextRegime = 'sideways';
      nextDuration = Math.floor(15 + Math.random() * 20);
    } else {
      nextRegime = 'crash';
      nextDuration = Math.floor(3 + Math.random() * 5);
    }
  }

  return { regime: nextRegime, remainingDays: nextDuration };
}

// Compute market-wide effect based on regime
export function getMarketIndexEffect(regime: MarketRegime): number {
  switch (regime) {
    case 'bull':
      // upward drift +0.1% to +0.8%, occasional small pullback
      return (Math.random() - 0.28) * 0.016;
    case 'bear':
      // downward drift -0.1% to -0.9%
      return (Math.random() - 0.72) * 0.018;
    case 'sideways':
      // flat chop ±0.4%
      return (Math.random() - 0.5) * 0.01;
    case 'crash':
      // sharp drops -1.8% to -4.5%
      return -0.015 - Math.random() * 0.025;
  }
}

// Compute sector-specific tides
export function getSectorEffects(): Record<Sector, number> {
  const sectors: Sector[] = ['IT', 'Banking', 'Pharma', 'FMCG', 'Energy', 'Auto'];
  const effects: Record<Sector, number> = {} as Record<Sector, number>;

  sectors.forEach((sec) => {
    // Sector tide ±0.6%
    effects[sec] = (Math.random() - 0.5) * 0.012;
  });

  return effects;
}

// Daily Simulation Engine Step
export function simulateMarketDay(
  currentDay: number,
  regime: MarketRegime,
  regimeRemainingDays: number,
  indexValue: number,
  stocks: Stock[],
  activeNews: NewsItem[],
  portfolio: Portfolio,
  orders: Order[]
): {
  nextDay: number;
  nextRegime: MarketRegime;
  nextRegimeRemaining: number;
  nextIndexValue: number;
  nextStocks: Stock[];
  newNews: NewsItem[];
  nextPortfolio: Portfolio;
  nextOrders: Order[];
  executedOrders: Order[];
  triggeredStopLosses: Order[];
  dividendPayoutsTotal: number;
  circuitHits: { ticker: string; direction: 'upper' | 'lower' }[];
} {
  const nextDay = currentDay + 1;
  const { regime: nextRegime, remainingDays: nextRegimeRemaining } = advanceRegime(regime, regimeRemainingDays);

  // Generate news for the new day
  const dailyNews = generateDailyNews(nextDay, nextRegime, stocks);
  const combinedNews = [...dailyNews, ...activeNews.filter((n) => n.day + n.durationDays >= nextDay)];

  const marketEffect = getMarketIndexEffect(nextRegime);
  const sectorEffects = getSectorEffects();
  const nextIndexValue = Math.max(100, Math.round(indexValue * (1 + marketEffect) * 100) / 100);

  const circuitHits: { ticker: string; direction: 'upper' | 'lower' }[] = [];
  let dividendPayoutsTotal = 0;

  // Update each stock using Section 5.2 formula:
  // New Price = Old Price * (1 + Market Effect * Beta + Sector Effect + News Effect + Trend Effect + Random Noise)
  const nextStocks = stocks.map((stock) => {
    const oldPrice = stock.currentPrice;

    // 1. Market effect scaled by Beta
    const stockMarketEffect = marketEffect * stock.beta;

    // 2. Sector effect
    const stockSectorEffect = sectorEffects[stock.sector] || 0;

    // 3. News effect
    let newsEffect = 0;
    combinedNews.forEach((news) => {
      if (news.ticker === stock.ticker) {
        // Direct company catalyst: 0.8% - 2.5% per impact point
        newsEffect += (news.impactStrength * 0.014) * (news.isReliable ? 1 : 0.7);
      } else if (news.sector === stock.sector && !news.ticker) {
        // Broad sector catalyst
        newsEffect += (news.impactStrength * 0.007) * (news.isReliable ? 1 : 0.6);
      }
    });

    // 4. Trend effect (momentum from last 3 days)
    let trendEffect = 0;
    if (stock.history.length >= 3) {
      const h = stock.history;
      const recentChange = (h[h.length - 1].close - h[h.length - 3].close) / h[h.length - 3].close;
      // Slight momentum continuation: ~10% of recent trend
      trendEffect = recentChange * 0.08;
    }

    // 5. Random noise scaled by volatility
    const volNoiseScale = stock.volatility === 'low' ? 0.008 : stock.volatility === 'medium' ? 0.016 : 0.028;
    const noise = (Math.random() - 0.49) * volNoiseScale;

    // 6. Quarterly Earnings Check (every ~60 days)
    let earningsSurpriseEffect = 0;
    let earningsReport = stock.lastEarningsReport;
    let nextEarningsDay = stock.nextEarningsDay;

    if (nextDay >= stock.nextEarningsDay) {
      // Release earnings
      const surprisePct = Math.round((Math.random() - 0.45) * 18 * 10) / 10; // -8% to +10%
      const estEPS = stock.eps;
      const reportedEPS = Math.max(0.1, Math.round(estEPS * (1 + surprisePct / 100) * 100) / 100);
      earningsSurpriseEffect = (surprisePct / 100) * 0.35; // direct gap impact

      earningsReport = {
        quarter: Math.floor(nextDay / 60) + 1,
        epsEstimate: estEPS,
        epsReported: reportedEPS,
        surprisePct,
      };

      // Dividend payout if owned
      const owned = portfolio.positions[stock.ticker];
      if (owned && owned.shares > 0 && stock.dividendYield > 0) {
        // quarterly dividend = annual div / 4
        const quarterlyDivPerShare = (stock.currentPrice * (stock.dividendYield / 100)) / 4;
        const payout = Math.round(quarterlyDivPerShare * owned.shares * 100) / 100;
        dividendPayoutsTotal += payout;
      }

      nextEarningsDay = nextDay + 60;
    }

    // Drift toward fair value
    const fairValueDrift = ((stock.fairValue - oldPrice) / oldPrice) * 0.02;

    // Raw total change
    let rawChange = stockMarketEffect + stockSectorEffect + newsEffect + trendEffect + noise + earningsSurpriseEffect + fairValueDrift;

    // Circuit Limit clamp: ±10% per day
    const CIRCUIT_LIMIT = 0.10;
    let circuitHit: 'upper' | 'lower' | null = null;

    if (rawChange >= CIRCUIT_LIMIT) {
      rawChange = CIRCUIT_LIMIT;
      circuitHit = 'upper';
      circuitHits.push({ ticker: stock.ticker, direction: 'upper' });
    } else if (rawChange <= -CIRCUIT_LIMIT) {
      rawChange = -CIRCUIT_LIMIT;
      circuitHit = 'lower';
      circuitHits.push({ ticker: stock.ticker, direction: 'lower' });
    }

    const newClose = Math.max(0.5, Math.round(oldPrice * (1 + rawChange) * 100) / 100);
    const dayOpen = oldPrice;

    // High and low for the day
    const intraRange = Math.abs(newClose - dayOpen) * 0.6 + newClose * (volNoiseScale * 0.5);
    const dayHigh = Math.round((Math.max(dayOpen, newClose) + intraRange * Math.random()) * 100) / 100;
    const dayLow = Math.round((Math.min(dayOpen, newClose) - intraRange * Math.random()) * 100) / 100;

    // Volume calculation
    const baseVol = stock.sharesOutstanding * 1500;
    const volCatalystMult = 1 + Math.abs(rawChange) * 12 + (newsEffect !== 0 ? 0.8 : 0);
    const dayVolume = Math.round(baseVol * volCatalystMult * (0.8 + Math.random() * 0.4));

    const decomposition: PriceDecomposition = {
      marketEffect: Math.round(stockMarketEffect * 10000) / 100,
      sectorEffect: Math.round(stockSectorEffect * 10000) / 100,
      newsEffect: Math.round(newsEffect * 10000) / 100,
      trendEffect: Math.round(trendEffect * 10000) / 100,
      noise: Math.round(noise * 10000) / 100,
      totalChangePct: Math.round(rawChange * 10000) / 100,
      circuitHit,
    };

    const newHistoryPoint: StockHistoryPoint = {
      day: nextDay,
      open: dayOpen,
      high: Math.max(dayHigh, dayOpen, newClose),
      low: Math.max(0.2, Math.min(dayLow, dayOpen, newClose)),
      close: newClose,
      volume: dayVolume,
      decomposition,
    };

    return {
      ...stock,
      currentPrice: newClose,
      previousPrice: oldPrice,
      dayOpen,
      dayHigh: Math.max(dayHigh, dayOpen, newClose),
      dayLow: Math.max(0.2, Math.min(dayLow, dayOpen, newClose)),
      dayVolume,
      lastDecomposition: decomposition,
      lastEarningsReport: earningsReport,
      nextEarningsDay,
      history: [...stock.history, newHistoryPoint],
    };
  });

  // Execute Pending Orders (Limit, Stop-Loss, Target)
  const executedOrders: Order[] = [];
  const triggeredStopLosses: Order[] = [];
  const nextPositions = { ...portfolio.positions };
  let currentCash = portfolio.cash + dividendPayoutsTotal;
  const newTrades: TradeRecord[] = [];
  let totalRealizedDelta = 0;

  const nextOrders = orders.filter((order) => {
    if (order.status !== 'PENDING') return false;

    const stock = nextStocks.find((s) => s.ticker === order.ticker);
    if (!stock) return true;

    let shouldExecute = false;
    let execPrice = stock.currentPrice;

    if (order.type === 'LIMIT') {
      if (order.side === 'BUY' && stock.dayLow <= order.targetPrice) {
        shouldExecute = true;
        execPrice = Math.min(stock.currentPrice, order.targetPrice);
      } else if (order.side === 'SELL' && stock.dayHigh >= order.targetPrice) {
        shouldExecute = true;
        execPrice = Math.max(stock.currentPrice, order.targetPrice);
      }
    } else if (order.type === 'STOP_LOSS') {
      if (stock.dayLow <= order.targetPrice) {
        shouldExecute = true;
        execPrice = order.targetPrice;
        triggeredStopLosses.push(order);
      }
    } else if (order.type === 'TARGET') {
      if (stock.dayHigh >= order.targetPrice) {
        shouldExecute = true;
        execPrice = order.targetPrice;
      }
    }

    if (shouldExecute) {
      // Execute the order
      const costCalc = calculateTradeCost(execPrice, order.quantity, stock.volatility, order.side);

      if (order.side === 'BUY') {
        if (currentCash >= costCalc.netTotal) {
          currentCash -= costCalc.netTotal;
          const existing = nextPositions[stock.ticker] || {
            ticker: stock.ticker,
            shares: 0,
            averagePrice: 0,
            totalCost: 0,
          };
          const newShares = existing.shares + order.quantity;
          const newTotalCost = existing.totalCost + costCalc.tradeValue;
          nextPositions[stock.ticker] = {
            ticker: stock.ticker,
            shares: newShares,
            averagePrice: Math.round((newTotalCost / newShares) * 100) / 100,
            totalCost: newTotalCost,
          };

          newTrades.push({
            id: `trade_${nextDay}_${Math.random().toString(36).substring(2, 7)}`,
            day: nextDay,
            ticker: stock.ticker,
            side: 'BUY',
            shares: order.quantity,
            price: costCalc.executionPrice,
            total: costCalc.netTotal,
            fee: costCalc.fee,
            reviewLesson: `Executed ${order.type} buy at $${costCalc.executionPrice}. Good entry discipline!`,
          });

          executedOrders.push({ ...order, status: 'EXECUTED' });
          return false;
        }
      } else if (order.side === 'SELL') {
        const existing = nextPositions[stock.ticker];
        if (existing && existing.shares >= order.quantity) {
          currentCash += costCalc.netTotal;
          const costOfSoldShares = existing.averagePrice * order.quantity;
          const pnl = costCalc.tradeValue - costOfSoldShares - costCalc.fee;
          const returnPct = ((costCalc.tradeValue - costOfSoldShares) / costOfSoldShares) * 100;
          totalRealizedDelta += pnl;

          const remainingShares = existing.shares - order.quantity;
          if (remainingShares <= 0) {
            delete nextPositions[stock.ticker];
          } else {
            nextPositions[stock.ticker] = {
              ...existing,
              shares: remainingShares,
              totalCost: existing.averagePrice * remainingShares,
            };
          }

          let reviewLesson = '';
          if (order.type === 'STOP_LOSS') {
            reviewLesson = `Stop-loss automatically capped your loss at ${Math.round(returnPct * 10) / 10}%. Capital preserved!`;
          } else if (order.type === 'TARGET') {
            reviewLesson = `Target hit! Locked in +${Math.round(returnPct * 10) / 10}% profit without emotion.`;
          } else {
            reviewLesson = `Limit order executed at ${costCalc.executionPrice}. Return: ${Math.round(returnPct * 10) / 10}%.`;
          }

          newTrades.push({
            id: `trade_${nextDay}_${Math.random().toString(36).substring(2, 7)}`,
            day: nextDay,
            ticker: stock.ticker,
            side: 'SELL',
            shares: order.quantity,
            price: costCalc.executionPrice,
            total: costCalc.netTotal,
            fee: costCalc.fee,
            realizedPnL: Math.round(pnl * 100) / 100,
            returnPct: Math.round(returnPct * 10) / 10,
            reviewLesson,
          });

          executedOrders.push({ ...order, status: 'EXECUTED' });
          return false;
        }
      }
    }

    return true; // Keep pending
  });

  // Calculate new portfolio valuation
  let totalInvested = 0;
  Object.values(nextPositions).forEach((pos) => {
    const s = nextStocks.find((item) => item.ticker === pos.ticker);
    if (s) {
      totalInvested += pos.shares * s.currentPrice;
    }
  });

  const currentNetWorth = Math.round((currentCash + totalInvested) * 100) / 100;

  const nextPortfolio: Portfolio = {
    ...portfolio,
    cash: Math.round(currentCash * 100) / 100,
    positions: nextPositions,
    tradeHistory: [...newTrades, ...portfolio.tradeHistory],
    totalRealizedPnL: Math.round((portfolio.totalRealizedPnL + totalRealizedDelta) * 100) / 100,
    netWorthHistory: [
      ...portfolio.netWorthHistory,
      {
        day: nextDay,
        netWorth: currentNetWorth,
        cash: Math.round(currentCash * 100) / 100,
        investedValue: Math.round(totalInvested * 100) / 100,
        indexValue: nextIndexValue,
      },
    ],
  };

  return {
    nextDay,
    nextRegime,
    nextRegimeRemaining,
    nextIndexValue,
    nextStocks,
    newNews: dailyNews,
    nextPortfolio,
    nextOrders,
    executedOrders,
    triggeredStopLosses,
    dividendPayoutsTotal,
    circuitHits,
  };
}

// Generate contextual educational feedback tips based on user state
export function getContextualTip(
  portfolio: Portfolio,
  stocks: Stock[],
  regime: MarketRegime,
  day: number
): string | null {
  const positions = Object.values(portfolio.positions);
  const totalInvested = positions.reduce((acc, pos) => {
    const s = stocks.find((item) => item.ticker === pos.ticker);
    return acc + (s ? pos.shares * s.currentPrice : 0);
  }, 0);
  const netWorth = portfolio.cash + totalInvested;

  // 1. Over-concentration warning (>50% in one stock)
  for (const pos of positions) {
    const s = stocks.find((item) => item.ticker === pos.ticker);
    if (s) {
      const stockVal = pos.shares * s.currentPrice;
      if (stockVal / netWorth > 0.5) {
        return `⚠️ Risk Warning: ${s.name} accounts for ${Math.round((stockVal / netWorth) * 100)}% of your total net worth! Consider diversifying to protect against single-stock shocks.`;
      }
    }
  }

  // 2. Regime warning
  if (regime === 'bear' && totalInvested / netWorth > 0.8) {
    return `🐻 Bear Market Notice: The overall index is in a downward regime. High-beta stocks face higher selling pressure. Holding some cash or defensive dividend stocks protects your capital.`;
  }

  if (regime === 'crash') {
    return `🚨 Flash Crash Alert: Extreme market-wide volatility. Panic selling often creates deep discounts for disciplined value investors with cash on hand.`;
  }

  // 3. First trade celebration
  if (portfolio.tradeHistory.length === 1 && day <= 3) {
    return `🎉 First trade complete! Head over to your Portfolio tab to monitor your live unrealized Profit & Loss.`;
  }

  return null;
}
