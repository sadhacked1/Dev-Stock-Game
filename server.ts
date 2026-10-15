import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const port = parseInt(process.env.PORT || '3000', 10);

// Intelligent educational fallback when API key is not configured or in offline mode
function generateLocalEducationalResponse(
  message: string,
  gameState?: {
    day?: number;
    regime?: string;
    indexValue?: number;
    netWorth?: number;
    cash?: number;
    holdings?: Array<{ ticker: string; shares: number; averagePrice: number; currentPrice?: number }>;
    inspectedStock?: { ticker: string; name: string; pe: number; beta: number; sector: string; currentPrice: number };
  }
): string {
  const q = message.toLowerCase();

  // 1. Portfolio analysis request
  if (q.includes('portfolio') || q.includes('my stock') || q.includes('analyze') || q.includes('holdings')) {
    if (!gameState || !gameState.holdings || gameState.holdings.length === 0) {
      return `📊 **Portfolio Analysis:**\n\nYou currently don't own any shares! Your entire net worth is in cash ($${(gameState?.cash || 100000).toLocaleString()}).\n\n💡 **Tip:** To get started, go to the **Market Stocks** tab, pick 2 to 3 companies in different sectors (like Tech, Banking, and Consumer Staples), and buy a few shares using **Market Orders**.`;
    }

    const holdings = gameState.holdings;
    const stockCount = holdings.length;
    let analysis = `📊 **Portfolio Analysis (Day ${gameState.day || 1}):**\n\n`;
    analysis += `• **Active Positions:** You hold ${stockCount} distinct ${stockCount === 1 ? 'company' : 'companies'}.\n`;
    analysis += `• **Available Cash:** $${(gameState.cash || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    analysis += `• **Market Regime:** The market is currently in a **${(gameState.regime || 'bull').toUpperCase()}** regime.\n\n`;

    if (stockCount < 3) {
      analysis += `⚠️ **Diversification Warning:** You only hold ${stockCount} stock(s). If this sector hits a downturn, your whole account suffers. Try holding stocks from at least 3-4 different sectors (e.g. IT, FMCG, Banking, Energy)!\n\n`;
    } else {
      analysis += `✅ **Good Diversification:** You have spread capital across ${stockCount} holdings. That cushions your portfolio against company-specific shocks!\n\n`;
    }

    analysis += `💡 **Next Step:** Always set a **Stop-Loss** order ~4-5% below your buy price on volatile high-beta stocks to protect your capital.`;
    return analysis;
  }

  // 2. P/E Ratio explanation
  if (q.includes('p/e') || q.includes('pe ratio') || q.includes('price to earnings') || q.includes('valuation')) {
    return `📈 **P/E Ratio (Price-to-Earnings) Made Simple:**\n\nThink of the P/E ratio as **"how many dollars you pay for every $1 of annual profit the company makes."**\n\n• **Example:** If a lemonade stand earns $1 profit per share each year, and the share costs $15, the P/E is **15x**.\n• **Low P/E (< 15x):** Usually "Value stocks" (like Zenith Bank or Meridian Trust). They are priced cheaply relative to profits and often pay reliable dividends.\n• **High P/E (> 30x):** Usually "Growth stocks" (like Apex Cyber or Quantum Mobility). Investors pay a premium because they expect massive future profit expansion.\n\n⚠️ **Beginner Rule:** Never buy a stock *just* because its share price is cheap (e.g. $10 vs $200). A $200 stock with P/E of 10 is fundamentally cheaper than a $10 stock with P/E of 80!`;
  }

  // 3. Stop-Loss explanation
  if (q.includes('stop loss') || q.includes('stop-loss') || q.includes('risk') || q.includes('cut loss')) {
    return `🛡️ **What is a Stop-Loss Order?**\n\nA **Stop-Loss** is your automated emergency seatbelt in trading. It tells the exchange: *"If this stock drops to $X, sell it immediately to prevent bigger losses."*\n\n• **Why it's essential:** Every trader makes bad calls. Without a stop-loss, an unexpected -4% dip can snowball into a catastrophic -40% wipeout.\n• **How to use it in MarketQuest:** Open any stock you own, select **Order Type: Stop-Loss**, and set the trigger price 3% to 5% below your purchase price.\n\n🎯 **Golden Rule:** Plan your exit before you enter. Cutting small losses quickly preserves your money for winning opportunities!`;
  }

  // 4. Diversification
  if (q.includes('diversif') || q.includes('allocation') || q.includes('basket')) {
    return `🧺 **The Power of Diversification:**\n\nAs the old saying goes: *"Don't put all your eggs in one basket."*\n\nIf you invest 100% of your money in Tech and tech regulations hit, your entire account crashes. But if you hold:\n1. **IT** (Apex Cyber, Nova Cloud)\n2. **Banking** (Zenith Bank)\n3. **FMCG / Food** (Harvest Foods)\n4. **Utilities & Energy** (HydroGrid, SolarVolt)\n\nWhen cyclical tech stocks dip, defensive food and utility stocks often stay steady or rise, smoothing your returns!\n\n💡 In Level 6 of MarketQuest, you will unlock the **Master Diversifier** badge by holding 4+ sectors.`;
  }

  // 5. Why did it drop?
  if (q.includes('drop') || q.includes('fall') || q.includes('down') || q.includes('why') || q.includes('loss') || q.includes('crash')) {
    return `📉 **Why Do Stocks Drop? (Section 5.2 Mechanics):**\n\nIn MarketQuest and real markets, a stock's price is driven by 5 combined forces:\n1. **Market Drag:** If the overall Index is dropping (Bear or Crash regime), it pulls down 80% of all stocks.\n2. **Sector Headwinds:** Bad news for Banking or Energy drags down all peer companies.\n3. **News Catalysts:** Quarterly earnings misses, product recalls, or regulations cause immediate selling.\n4. **Trend Momentum:** Sellers continue pressing an existing downward trend.\n5. **Normal Noise:** Random day-to-day order fluctuations.\n\n🔍 **Pro Tip:** Tap **"Why Did It Move Today?"** on any stock to see the exact percentage breakdown of these forces!`;
  }

  // 6. Bull vs Bear
  if (q.includes('bull') || q.includes('bear') || q.includes('regime') || q.includes('market cycle')) {
    return `🐂 **Bull Market vs 🐻 Bear Market:**\n\n• **Bull Market:** Prices trend upward over weeks. Investor optimism is high, positive news moves stocks up more than negative news brings them down. Dips are bought quickly.\n• **Bear Market:** Prices trend downward. Fear dominates, sharp selloffs happen, and rallies tend to fizzle out quickly.\n• **Flash Crash:** A sudden, steep market-wide collapse over a few days with extreme volatility.\n\n💡 **Survival Strategy:** In a Bear market, hold more cash or defensive low-beta stocks (like Harvest Foods or HydroGrid) to preserve your capital until valuations bottom!`;
  }

  // 7. Candlesticks & Charts
  if (q.includes('chart') || q.includes('candle') || q.includes('candlestick') || q.includes('sma') || q.includes('moving average')) {
    return `🕯️ **How to Read Candlestick Charts:**\n\nEach candle tells the story of 1 trading day:\n• **Green Candle:** The stock closed **higher** than it opened (Bullish).\n• **Red Candle:** The stock closed **lower** than it opened (Bearish).\n• **Wicks / Shadows:** The thin lines at the top and bottom show the absolute Highest and Lowest prices reached that day.\n\n📊 **SMA 20 (Yellow Line):** The 20-day Simple Moving Average. When the stock price is above this line, the stock is in a positive short-term uptrend!`;
  }

  // Default helpful response
  return `👋 **Hi! I'm QuestBot, your MarketQuest AI Trading Coach!**\n\nI can help you understand the stock market easily. What would you like to explore?\n\n• **"Explain P/E ratio simply"** — Learn how to tell if a stock is cheap or expensive.\n• **"Analyze my portfolio"** — Get a personalized review of your current holdings & diversification.\n• **"What is a Stop-Loss?"** — Discover the #1 rule of capital preservation.\n• **"Why did my stock drop today?"** — Understand market regimes and catalysts.\n• **"How do I read candlesticks?"** — Master technical chart patterns.\n\nType any question above or ask in plain words! (Simulation only · Made by Dev Bhati)`;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize server-side Gemini client
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    try {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI with provided key, using educational fallback mode:', e);
    }
  }

  // POST /api/chat - AI Assistant Endpoint
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { message, history, gameState } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      // If no API key or AI client failed, use rich offline educational fallback
      if (!ai) {
        const reply = generateLocalEducationalResponse(message, gameState);
        res.json({ reply, mode: 'local' });
        return;
      }

      // Format game context
      let contextPrompt = '';
      if (gameState) {
        contextPrompt = `
Current Active MarketQuest Simulation State:
- Trading Day: ${gameState.day || 1}
- Current Market Regime: ${gameState.regime || 'bull'}
- Quest50 Benchmark Index: ${gameState.indexValue || 1000} (${(gameState.indexChangePct || 0) >= 0 ? '+' : ''}${gameState.indexChangePct || 0}%)
- Player Net Worth: $${(gameState.netWorth || 100000).toLocaleString()} (Starting: $${(gameState.startingCash || 100000).toLocaleString()})
- Liquid Cash: $${(gameState.cash || 100000).toLocaleString()}
- Holdings: ${JSON.stringify(gameState.holdings || [])}
- Recent News Wire: ${JSON.stringify(gameState.recentNews || [])}
${gameState.inspectedStock ? `- Currently Selected Stock: ${JSON.stringify(gameState.inspectedStock)}` : ''}
`;
      }

      const systemInstruction = `You are "QuestBot", the friendly, knowledgeable AI Trading Coach inside the MarketQuest stock market simulation game (created by Dev Bhati).
Your purpose is to help beginners understand the stock market EASILY without confusing jargon.

Instructions:
1. Explain finance concepts simply using relatable everyday analogies (e.g., buying a fraction of a business, grocery store discounts, pizza slices).
2. Answer questions about the user's active game state (portfolio diversification, cash reserves, why their stocks are moving, market regimes).
3. Teach core principles: Diversification, Stop-Loss orders, Valuation (P/E & EPS), Candlesticks & SMA, Bull vs Bear regimes.
4. Keep answers friendly, conversational, concise, and beautifully structured with bullet points.
5. Remind the user when relevant that this is an educational simulation with virtual money, not real investment advice.
6. Support Hindi or Gujarati gracefully if the user writes in those languages.`;

      // Construct history
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history)) {
        history.slice(-6).forEach((h: { role: 'user' | 'model'; content: string }) => {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
          });
        });
      }

      contents.push({
        role: 'user',
        parts: [{ text: `${contextPrompt}\n\nUser Question: ${message}` }],
      });

      let reply = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        reply = response.text || '';
      } catch (firstErr) {
        console.warn('gemini-3.8-flash busy/failed, trying gemini-3.1-flash-lite:', firstErr);
        try {
          const responseLite = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          reply = responseLite.text || '';
        } catch (secondErr) {
          console.warn('gemini-3.1-flash-lite also unavailable, falling back to local tutor engine:', secondErr);
          reply = generateLocalEducationalResponse(message, gameState);
        }
      }

      if (!reply) {
        reply = generateLocalEducationalResponse(message, gameState);
      }

      res.json({ reply, mode: 'gemini' });
    } catch (err: unknown) {
      console.error('Error handling /api/chat with Gemini API:', err);
      // Fallback seamlessly so user never sees a broken chat
      const fallbackReply = generateLocalEducationalResponse(req.body?.message || '', req.body?.gameState);
      res.json({ reply: fallbackReply, mode: 'fallback' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', hasGeminiKey: Boolean(apiKey) });
  });

  // Mount Vite middleware in development or serve static in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`MarketQuest server listening on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
