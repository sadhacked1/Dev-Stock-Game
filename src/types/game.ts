export type Sector = 'IT' | 'Banking' | 'Pharma' | 'FMCG' | 'Energy' | 'Auto';

export type VolatilityLevel = 'low' | 'medium' | 'high';

export type MarketRegime = 'bull' | 'bear' | 'sideways' | 'crash';

export interface PriceDecomposition {
  marketEffect: number;
  sectorEffect: number;
  newsEffect: number;
  trendEffect: number;
  noise: number;
  totalChangePct: number;
  circuitHit: 'upper' | 'lower' | null;
}

export interface StockHistoryPoint {
  day: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  decomposition?: PriceDecomposition;
}

export interface Stock {
  id: string;
  ticker: string;
  name: string;
  sector: Sector;
  description: string;
  startingPrice: number;
  currentPrice: number;
  previousPrice: number;
  sharesOutstanding: number; // in millions
  eps: number;
  pe: number;
  beta: number; // 0.5 - 2.0
  volatility: VolatilityLevel;
  dividendYield: number; // e.g. 2.5%
  fairValue: number;
  history: StockHistoryPoint[];
  dayHigh: number;
  dayLow: number;
  dayOpen: number;
  dayVolume: number;
  lastDecomposition?: PriceDecomposition;
  lastEarningsDay?: number;
  nextEarningsDay: number;
  lastEarningsReport?: {
    quarter: number;
    epsReported: number;
    epsEstimate: number;
    surprisePct: number;
  };
}

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TARGET';
export type OrderSide = 'BUY' | 'SELL';

export interface Order {
  id: string;
  ticker: string;
  side: OrderSide;
  type: OrderType;
  targetPrice: number;
  quantity: number;
  placedDay: number;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
  fee: number;
}

export interface Position {
  ticker: string;
  shares: number;
  averagePrice: number;
  totalCost: number;
}

export interface TradeRecord {
  id: string;
  day: number;
  ticker: string;
  side: OrderSide;
  shares: number;
  price: number;
  total: number;
  fee: number;
  realizedPnL?: number;
  returnPct?: number;
  holdingDays?: number;
  reviewLesson?: string;
}

export interface NetWorthPoint {
  day: number;
  netWorth: number;
  cash: number;
  investedValue: number;
  indexValue: number;
}

export interface Portfolio {
  cash: number;
  startingCash: number;
  positions: Record<string, Position>;
  tradeHistory: TradeRecord[];
  netWorthHistory: NetWorthPoint[];
  totalRealizedPnL: number;
}

export interface NewsItem {
  id: string;
  day: number;
  headline: string;
  body: string;
  sector?: Sector;
  ticker?: string;
  category: 'Earnings' | 'Regulatory' | 'Macro' | 'Product' | 'Rumor' | 'Management' | 'Sector';
  impactStrength: number; // -3 to +3
  durationDays: number;
  isReliable: boolean;
  revealedDebunk?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LevelObjective {
  id: string;
  text: string;
  hint: string;
  isDone: boolean;
  progressText?: string;
}

export interface CampaignLevel {
  id: number;
  title: string;
  topic: string;
  briefing: string;
  startingCash: number;
  unlockedOrderTypes: OrderType[];
  objectives: LevelObjective[];
  quiz: QuizQuestion[];
  summary: string[];
}

export interface ChallengeScenario {
  id: string;
  title: string;
  badgeId: string;
  difficulty: 'easy' | 'normal' | 'hard';
  description: string;
  briefing: string;
  durationDays: number;
  startingCash: number;
  startingRegime: MarketRegime;
  targetNetWorth: number;
  maxDrawdownPct?: number;
  forcedSectorCrash?: Sector;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDay?: number;
}

export interface GlossaryTerm {
  term: string;
  category: 'Basics' | 'Analysis' | 'Trading' | 'Risk & Strategy';
  definition: string;
  example: string;
  keyTakeaway: string;
}

export type GameMode = 'campaign' | 'freeplay' | 'challenge';
