import React from 'react';
import { GameMode, MarketRegime, Portfolio } from '../types/game';
import {
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw,
  ShieldAlert,
  Flame,
  LayoutGrid,
  Briefcase,
  Newspaper,
  GraduationCap,
  Trophy,
  Bot,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '../services/sound';

interface NavbarProps {
  day: number;
  regime: MarketRegime;
  regimeRemainingDays: number;
  indexValue: number;
  indexChangePct: number;
  portfolio: Portfolio;
  mode: GameMode;
  activeTab: 'market' | 'portfolio' | 'news' | 'learn' | 'challenges';
  isPlaying: boolean;
  speed: 1 | 2 | 5;
  soundEnabled: boolean;
  onTabChange: (tab: 'market' | 'portfolio' | 'news' | 'learn' | 'challenges') => void;
  onNextDay: () => void;
  onTogglePlay: () => void;
  onChangeSpeed: (speed: 1 | 2 | 5) => void;
  onToggleSound: () => void;
  onResetGame: () => void;
  onOpenAIChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  day,
  regime,
  regimeRemainingDays,
  indexValue,
  indexChangePct,
  portfolio,
  mode,
  activeTab,
  isPlaying,
  speed,
  soundEnabled,
  onTabChange,
  onNextDay,
  onTogglePlay,
  onChangeSpeed,
  onToggleSound,
  onResetGame,
  onOpenAIChat,
}) => {
  const totalStockValue = Object.values(portfolio.positions).reduce(
    (acc, pos) => acc + pos.shares * pos.averagePrice,
    0
  );
  const netWorth = portfolio.cash + totalStockValue;

  const regimeBadges: Record<
    MarketRegime,
    { label: string; bg: string; text: string; icon: React.ReactNode }
  > = {
    bull: {
      label: 'Bull Market',
      bg: 'bg-emerald-950/80 border-emerald-600/50',
      text: 'text-emerald-400',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
    },
    bear: {
      label: 'Bear Market',
      bg: 'bg-rose-950/80 border-rose-600/50',
      text: 'text-rose-400',
      icon: <TrendingDown className="w-3.5 h-3.5" />,
    },
    sideways: {
      label: 'Sideways Chop',
      bg: 'bg-zinc-900 border-zinc-700',
      text: 'text-zinc-300',
      icon: <span className="text-zinc-400 font-mono text-xs">↔</span>,
    },
    crash: {
      label: 'Flash Crash',
      bg: 'bg-red-950 border-red-500 animate-pulse',
      text: 'text-red-300',
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
    },
  };

  const currentBadge = regimeBadges[regime];

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
      {/* Top Banner: Brand, Engine Controls, Net Worth */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Made by Credit */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-mono">
                <span className="w-2.5 h-2.5 rounded bg-sky-500 inline-block animate-pulse"></span>
                MarketQuest
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-sky-400">
                Sim
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-medium">
              Made by <strong className="text-zinc-400">Dev Bhati</strong>
            </span>
          </div>

          {/* Regime Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-semibold ${currentBadge.bg} ${currentBadge.text}`}
            title={`Market regime stays for ~${regimeRemainingDays} more trading days`}
          >
            {currentBadge.icon}
            <span>{currentBadge.label}</span>
          </div>

          {/* Index Benchmark */}
          <div className="hidden lg:flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 px-2.5 py-1 rounded-md text-xs font-mono">
            <span className="text-zinc-500">Quest50:</span>
            <span className="text-white font-bold">{indexValue.toFixed(1)}</span>
            <span className={indexChangePct >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {indexChangePct >= 0 ? `+${indexChangePct.toFixed(2)}%` : `${indexChangePct.toFixed(2)}%`}
            </span>
          </div>
        </div>

        {/* Middle: Day Counter & Simulation Controls */}
        <div className="flex items-center gap-2">
          {/* Day Counter */}
          <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-200">
            Day <strong className="text-white text-sm">{day}</strong>
          </div>

          {/* Next Day Turn Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onNextDay();
            }}
            disabled={isPlaying}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-xs"
            title="Advance 1 trading session"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Next Day</span>
          </button>

          {/* Autoplay Play/Pause */}
          <button
            onClick={() => {
              soundManager.playClick();
              onTogglePlay();
            }}
            className={`p-1.5 rounded-lg border text-xs transition ${
              isPlaying
                ? 'bg-amber-500 text-black border-amber-400 font-bold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850'
            }`}
            title={isPlaying ? 'Pause Auto-Simulation' : 'Start Auto-Simulation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Speed Selector */}
          <div className="hidden sm:flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[11px]">
            {([1, 2, 5] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  soundManager.playClick();
                  onChangeSpeed(s);
                }}
                className={`px-1.5 py-0.5 rounded transition ${
                  speed === s ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition"
            title={soundEnabled ? 'Mute SFX' : 'Unmute SFX'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-600" />}
          </button>

          {/* Reset */}
          <button
            onClick={onResetGame}
            className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-rose-400 transition"
            title="Reset Simulation State"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* AI Coach Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenAIChat();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-sky-950/40"
            title="Ask AI Market Coach"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-200" />
            <span>AI Coach</span>
          </button>
        </div>

        {/* Right: Net Worth Quick Readout */}
        <div className="flex items-center gap-3 text-right">
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-mono">Net Worth</span>
            <div className="text-sm sm:text-base font-bold font-mono text-white">
              ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-1 overflow-x-auto border-t border-zinc-850/80 scrollbar-none py-1">
        <button
          onClick={() => {
            soundManager.playClick();
            onTabChange('market');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'market'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" /> Market Stocks
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            onTabChange('portfolio');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'portfolio'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" /> My Portfolio
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            onTabChange('news');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'news'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" /> News Wire
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            onTabChange('learn');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'learn'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" /> Campaign & Glossary
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            onTabChange('challenges');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'challenges'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" /> Challenges
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            onOpenAIChat();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 ml-auto"
        >
          <Bot className="w-3.5 h-3.5 text-sky-400" /> Ask AI Bot
        </button>
      </div>
    </header>
  );
};
