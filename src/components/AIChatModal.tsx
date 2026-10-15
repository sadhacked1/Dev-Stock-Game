import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  HelpCircle,
  Minimize2,
  Maximize2,
  ChevronDown,
} from 'lucide-react';
import { soundManager } from '../services/sound';
import { Stock, Portfolio, MarketRegime } from '../types/game';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: number;
  regime: MarketRegime;
  indexValue: number;
  indexChangePct: number;
  portfolio: Portfolio;
  stocks: Stock[];
  inspectedStock?: Stock | null;
}

const QUICK_PROMPTS = [
  'Explain P/E ratio in simple terms',
  'Analyze my current portfolio & risk',
  'What is a Stop-Loss and why use it?',
  'Why did stock prices move today?',
  'How do I diversify my holdings?',
  'Explain Bull vs Bear markets',
];

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
  day,
  regime,
  indexValue,
  indexChangePct,
  portfolio,
  stocks,
  inspectedStock,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'model',
      content: `👋 **Welcome! I'm QuestBot, your personal AI Market Coach.**\n\nI'm here to help you understand the stock market without confusing jargon! Ask me about anything: P/E ratios, risk management, why prices move, or tap **"Analyze my portfolio"** for feedback on your active trades.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Calculate live portfolio summary for AI context
  const holdingsSummary = Object.values(portfolio.positions).map((pos) => {
    const s = stocks.find((stock) => stock.ticker === pos.ticker);
    return {
      ticker: pos.ticker,
      name: s?.name || pos.ticker,
      sector: s?.sector || 'Unknown',
      shares: pos.shares,
      averagePrice: pos.averagePrice,
      currentPrice: s?.currentPrice || pos.averagePrice,
    };
  });

  const totalStockValue = holdingsSummary.reduce(
    (acc, h) => acc + h.shares * (h.currentPrice || h.averagePrice),
    0
  );
  const netWorth = portfolio.cash + totalStockValue;

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    soundManager.playClick();

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          gameState: {
            day,
            regime,
            indexValue,
            indexChangePct,
            netWorth,
            startingCash: portfolio.startingCash,
            cash: portfolio.cash,
            holdings: holdingsSummary,
            inspectedStock: inspectedStock
              ? {
                  ticker: inspectedStock.ticker,
                  name: inspectedStock.name,
                  sector: inspectedStock.sector,
                  currentPrice: inspectedStock.currentPrice,
                  pe: inspectedStock.pe,
                  beta: inspectedStock.beta,
                }
              : undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      soundManager.playBuy();

      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'model',
        content: data.reply || "I'm here to help you understand stock trading easily! Ask me anything.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      // Fallback response so user always receives educational guidance
      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'model',
        content: `💡 **MarketQuest Tip:**\n\nStock prices reflect discounted future earnings and supply/demand. Remember the golden rule: **Never risk money you cannot afford to lose, diversify across 3+ sectors, and protect your capital using Stop-Loss orders!**\n\nWhat other concept can I explain for you?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    soundManager.playClick();
    setMessages([
      {
        id: 'msg_welcome_reset',
        role: 'model',
        content: `🔄 Chat reset! I'm QuestBot, your AI market coach. What would you like to learn today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Helper to format simple markdown-like text
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold rendering
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="text-white font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 my-0.5">
            <span className="text-sky-400 font-bold">•</span>
            <span>{renderedParts}</span>
          </div>
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p key={idx} className="my-0.5 leading-relaxed">
          {renderedParts}
        </p>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Minimized Bar */}
      {isMinimized ? (
        <div className="bg-zinc-950 border border-sky-500/60 rounded-xl p-3 shadow-2xl flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsMinimized(false)}>
            <div className="w-8 h-8 rounded-lg bg-sky-950 text-sky-400 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">QuestBot AI Coach</span>
              <span className="text-[10px] text-zinc-400">Click to expand chat</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Full Chat Window */
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-[92vw] max-w-md h-[560px] max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-950 border border-sky-600/50 text-sky-400 flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-white">QuestBot</h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 font-mono font-bold border border-sky-700/50">
                    AI COACH
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Easy Learning · Powered by Gemini
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800 transition"
                title="Restart chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800 transition"
                title="Minimize chat"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Game Context Strip */}
          <div className="bg-zinc-900/60 border-b border-zinc-850 px-3 py-1.5 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
            <div className="flex items-center gap-2">
              <span>Day {day}</span>
              <span>·</span>
              <span className="uppercase text-zinc-300 font-semibold">{regime}</span>
            </div>
            <div>
              Net Worth: <strong className="text-white">${Math.round(netWorth).toLocaleString()}</strong>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
            {messages.map((m) => {
              const isUser = m.role === 'user';

              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-lg bg-sky-950 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-tr-none'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none shadow-xs'
                    }`}
                  >
                    {isUser ? m.content : renderFormattedContent(m.content)}
                    <div
                      className={`text-[9px] mt-1.5 text-right ${
                        isUser ? 'text-sky-200' : 'text-zinc-500'
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs py-1">
                <div className="w-6 h-6 rounded-lg bg-sky-950 text-sky-400 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] ml-1">QuestBot is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 pt-2 pb-1 border-t border-zinc-850 bg-zinc-950/70">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">
              Suggested Questions:
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  disabled={isLoading}
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 hover:border-sky-500 hover:text-white text-zinc-400 text-[11px] whitespace-nowrap transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-zinc-800 bg-zinc-900/60 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask anything (e.g., 'What is P/E?', 'Analyze my trades')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-xl transition shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
