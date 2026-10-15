import { Stock, Sector, VolatilityLevel, StockHistoryPoint } from '../types/game';

interface StockTemplate {
  id: string;
  ticker: string;
  name: string;
  sector: Sector;
  description: string;
  basePrice: number;
  sharesOutstanding: number;
  eps: number;
  pe: number;
  beta: number;
  volatility: VolatilityLevel;
  dividendYield: number;
  fairValue: number;
}

export const STOCK_TEMPLATES: StockTemplate[] = [
  // IT Sector
  {
    id: 'APEX',
    ticker: 'APEX',
    name: 'Apex Cyber Solutions',
    sector: 'IT',
    description: 'Next-gen enterprise cybersecurity and threat intelligence cloud software.',
    basePrice: 245.0,
    sharesOutstanding: 85,
    eps: 5.75,
    pe: 42.6,
    beta: 1.45,
    volatility: 'high',
    dividendYield: 0.4,
    fairValue: 230.0,
  },
  {
    id: 'NOVA',
    ticker: 'NOVA',
    name: 'Nova Cloud Platform',
    sector: 'IT',
    description: 'Hyperscale distributed cloud hosting and developer computing architecture.',
    basePrice: 165.0,
    sharesOutstanding: 140,
    eps: 5.32,
    pe: 31.0,
    beta: 1.15,
    volatility: 'medium',
    dividendYield: 0.8,
    fairValue: 160.0,
  },
  {
    id: 'BYTE',
    ticker: 'BYTE',
    name: 'ByteMatrix Logic',
    sector: 'IT',
    description: 'Enterprise ERP software with sticky multi-year enterprise contracts.',
    basePrice: 88.0,
    sharesOutstanding: 210,
    eps: 3.65,
    pe: 24.1,
    beta: 0.90,
    volatility: 'low',
    dividendYield: 1.6,
    fairValue: 85.0,
  },

  // Banking Sector
  {
    id: 'ZNB',
    ticker: 'ZNB',
    name: 'Zenith National Bank',
    sector: 'Banking',
    description: 'One of the nation’s largest diversified commercial and mortgage lenders.',
    basePrice: 112.0,
    sharesOutstanding: 320,
    eps: 9.74,
    pe: 11.5,
    beta: 0.88,
    volatility: 'low',
    dividendYield: 3.8,
    fairValue: 118.0,
  },
  {
    id: 'CRST',
    ticker: 'CRST',
    name: 'Crestline Capital',
    sector: 'Banking',
    description: 'Global investment banking, wealth advisory, and securities underwriting firm.',
    basePrice: 76.5,
    sharesOutstanding: 160,
    eps: 5.38,
    pe: 14.2,
    beta: 1.35,
    volatility: 'medium',
    dividendYield: 2.5,
    fairValue: 74.0,
  },
  {
    id: 'MRDN',
    ticker: 'MRDN',
    name: 'Meridian Trust',
    sector: 'Banking',
    description: 'Conservative regional lender with exceptional tier-1 capital reserves.',
    basePrice: 53.0,
    sharesOutstanding: 190,
    eps: 5.40,
    pe: 9.8,
    beta: 0.75,
    volatility: 'low',
    dividendYield: 4.3,
    fairValue: 56.0,
  },

  // Pharma & Healthcare
  {
    id: 'VTL',
    ticker: 'VTL',
    name: 'Vitalis Pharma',
    sector: 'Pharma',
    description: 'Global biopharma giant with patents in cardiovascular and oncology treatments.',
    basePrice: 148.0,
    sharesOutstanding: 180,
    eps: 7.58,
    pe: 19.5,
    beta: 0.68,
    volatility: 'low',
    dividendYield: 2.8,
    fairValue: 152.0,
  },
  {
    id: 'BGEN',
    ticker: 'BGEN',
    name: 'BioGenix Labs',
    sector: 'Pharma',
    description: 'Clinical-stage gene therapy developing targeted therapies for rare disorders.',
    basePrice: 64.0,
    sharesOutstanding: 75,
    eps: 0.94,
    pe: 68.0,
    beta: 1.70,
    volatility: 'high',
    dividendYield: 0.0,
    fairValue: 55.0,
  },
  {
    id: 'CURE',
    ticker: 'CURE',
    name: 'CurePulse Diagnostics',
    sector: 'Pharma',
    description: 'Precision robotic surgery tools and rapid molecular diagnostics hardware.',
    basePrice: 94.0,
    sharesOutstanding: 110,
    eps: 3.55,
    pe: 26.5,
    beta: 1.05,
    volatility: 'medium',
    dividendYield: 1.2,
    fairValue: 90.0,
  },

  // FMCG / Consumer Staples
  {
    id: 'HRVT',
    ticker: 'HRVT',
    name: 'Harvest Foods',
    sector: 'FMCG',
    description: 'Household packaged food brand with deep supermarket distribution moats.',
    basePrice: 69.5,
    sharesOutstanding: 260,
    eps: 3.86,
    pe: 18.0,
    beta: 0.52,
    volatility: 'low',
    dividendYield: 3.2,
    fairValue: 71.0,
  },
  {
    id: 'AURA',
    ticker: 'AURA',
    name: 'Aura Personal Care',
    sector: 'FMCG',
    description: 'Organic cosmetic, skincare, and household hygiene consumer goods.',
    basePrice: 128.0,
    sharesOutstanding: 130,
    eps: 5.82,
    pe: 22.0,
    beta: 0.65,
    volatility: 'low',
    dividendYield: 2.4,
    fairValue: 125.0,
  },
  {
    id: 'PURE',
    ticker: 'PURE',
    name: 'PureBeverage Group',
    sector: 'FMCG',
    description: 'Ready-to-drink functional beverages, cold coffees, and hydration drinks.',
    basePrice: 47.5,
    sharesOutstanding: 220,
    eps: 2.88,
    pe: 16.5,
    beta: 0.62,
    volatility: 'low',
    dividendYield: 3.0,
    fairValue: 49.0,
  },

  // Energy & Utilities
  {
    id: 'SVOLT',
    ticker: 'SVOLT',
    name: 'SolarVolt Renewables',
    sector: 'Energy',
    description: 'Utility-scale solar farms and commercial grid battery storage manufacturing.',
    basePrice: 118.0,
    sharesOutstanding: 95,
    eps: 3.47,
    pe: 34.0,
    beta: 1.48,
    volatility: 'high',
    dividendYield: 1.0,
    fairValue: 108.0,
  },
  {
    id: 'TRRA',
    ticker: 'TRRA',
    name: 'Terra Resources',
    sector: 'Energy',
    description: 'Integrated oil, natural gas, and critical minerals exploration and production.',
    basePrice: 83.0,
    sharesOutstanding: 340,
    eps: 9.76,
    pe: 8.5,
    beta: 1.25,
    volatility: 'medium',
    dividendYield: 4.6,
    fairValue: 88.0,
  },
  {
    id: 'HGRD',
    ticker: 'HGRD',
    name: 'HydroGrid Utilities',
    sector: 'Energy',
    description: 'Government-regulated municipal hydroelectric power transmission network.',
    basePrice: 56.0,
    sharesOutstanding: 280,
    eps: 4.30,
    pe: 13.0,
    beta: 0.48,
    volatility: 'low',
    dividendYield: 4.9,
    fairValue: 57.5,
  },

  // Automotive & Mobility
  {
    id: 'VMT',
    ticker: 'VMT',
    name: 'Velocity Motors',
    sector: 'Auto',
    description: 'Legacy commercial automaker transitioning lineup toward hybrid & EV fleet.',
    basePrice: 44.5,
    sharesOutstanding: 410,
    eps: 5.70,
    pe: 7.8,
    beta: 1.18,
    volatility: 'medium',
    dividendYield: 3.2,
    fairValue: 47.0,
  },
  {
    id: 'AERO',
    ticker: 'AERO',
    name: 'AeroDrive Dynamics',
    sector: 'Auto',
    description: 'Advanced aviation propulsion systems, flight avionics, and defense mobility.',
    basePrice: 138.0,
    sharesOutstanding: 125,
    eps: 7.26,
    pe: 19.0,
    beta: 1.08,
    volatility: 'medium',
    dividendYield: 2.1,
    fairValue: 140.0,
  },
  {
    id: 'QNTM',
    ticker: 'QNTM',
    name: 'Quantum Mobility',
    sector: 'Auto',
    description: 'High-growth electric vehicle brand pioneering autonomous urban robo-cabs.',
    basePrice: 192.0,
    sharesOutstanding: 110,
    eps: 3.49,
    pe: 55.0,
    beta: 1.82,
    volatility: 'high',
    dividendYield: 0.0,
    fairValue: 175.0,
  },
];

// Helper to generate realistic historical 30 days of data for each stock
export function generateInitialStockHistory(
  basePrice: number,
  volatility: VolatilityLevel,
  beta: number
): { history: StockHistoryPoint[]; currentPrice: number; prevPrice: number; dayHigh: number; dayLow: number; dayOpen: number; dayVolume: number } {
  const history: StockHistoryPoint[] = [];
  const volMult = volatility === 'low' ? 0.012 : volatility === 'medium' ? 0.022 : 0.038;
  
  let current = basePrice * 0.94; // 30 days ago started slightly lower
  
  for (let i = -29; i <= 0; i++) {
    // Generate realistic daily price action
    const drift = 0.002;
    const wave = Math.sin(i / 4) * 0.008;
    const noise = (Math.random() - 0.48) * volMult;
    const dayChange = drift + wave + noise;
    
    const open = Math.round(current * 100) / 100;
    const close = Math.max(1, Math.round(open * (1 + dayChange) * 100) / 100);
    const intraVol = Math.abs(close - open) * 0.5 + open * (volMult * 0.6);
    const high = Math.round((Math.max(open, close) + intraVol * Math.random()) * 100) / 100;
    const low = Math.round((Math.min(open, close) - intraVol * Math.random()) * 100) / 100;
    const baseVol = Math.round((100000 + Math.random() * 200000) * (volatility === 'high' ? 2 : 1));

    history.push({
      day: i,
      open,
      high: Math.max(high, open, close),
      low: Math.max(0.5, Math.min(low, open, close)),
      close,
      volume: baseVol,
    });
    
    current = close;
  }

  const todayPoint = history[history.length - 1];
  const yesterdayPoint = history[history.length - 2];

  return {
    history,
    currentPrice: todayPoint.close,
    prevPrice: yesterdayPoint.close,
    dayOpen: todayPoint.open,
    dayHigh: todayPoint.high,
    dayLow: todayPoint.low,
    dayVolume: todayPoint.volume,
  };
}

export function createInitialStocks(): Stock[] {
  return STOCK_TEMPLATES.map((tmpl) => {
    const { history, currentPrice, prevPrice, dayOpen, dayHigh, dayLow, dayVolume } = generateInitialStockHistory(
      tmpl.basePrice,
      tmpl.volatility,
      tmpl.beta
    );

    return {
      ...tmpl,
      startingPrice: tmpl.basePrice,
      currentPrice,
      previousPrice: prevPrice,
      history,
      dayOpen,
      dayHigh,
      dayLow,
      dayVolume,
      nextEarningsDay: 45 + Math.floor(Math.random() * 25),
    };
  });
}
