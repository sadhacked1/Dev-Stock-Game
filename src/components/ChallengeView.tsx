import React from 'react';
import { ChallengeScenario } from '../types/game';
import { CHALLENGE_SCENARIOS } from '../constants/curriculum';
import {
  Trophy,
  Flame,
  ShieldAlert,
  TrendingUp,
  Clock,
  Target,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '../services/sound';

interface ChallengeViewProps {
  currentChallengeId: string | null;
  onStartChallenge: (scenario: ChallengeScenario) => void;
  onExitChallenge: () => void;
}

export const ChallengeView: React.FC<ChallengeViewProps> = ({
  currentChallengeId,
  onStartChallenge,
  onExitChallenge,
}) => {
  return (
    <div className="space-y-4">
      {/* Active Challenge Alert Banner if in a challenge */}
      {currentChallengeId && (
        <div className="bg-amber-950/40 border border-amber-600/50 rounded-xl p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Active Challenge Mode Running</span>
              <span className="text-zinc-400">
                Objectives and duration are locked for performance evaluation.
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onExitChallenge();
            }}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-bold transition"
          >
            Exit to Free Play
          </button>
        </div>
      )}

      {/* Intro Header */}
      <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Challenge Scenarios & High-Pressure Gauntlets
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Fixed historical-style scenarios to test your risk management, momentum trading, and crash survival.
          </p>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {CHALLENGE_SCENARIOS.map((scenario) => {
          const isActive = currentChallengeId === scenario.id;

          return (
            <div
              key={scenario.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                isActive
                  ? 'bg-amber-950/20 border-amber-500 shadow-lg shadow-amber-950/30'
                  : 'bg-zinc-950 border-zinc-850 hover:border-zinc-750'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    scenario.difficulty === 'hard'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800/50'
                      : scenario.difficulty === 'normal'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                  }`}>
                    {scenario.difficulty} Difficulty
                  </span>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{scenario.durationDays} Days</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white">{scenario.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{scenario.briefing}</p>

                {/* Requirements metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-zinc-900/60 p-2 rounded border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 block">Starting Capital</span>
                    <span className="font-mono font-bold text-white">${scenario.startingCash.toLocaleString()}</span>
                  </div>
                  <div className="bg-zinc-900/60 p-2 rounded border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 block">Target Net Worth</span>
                    <span className="font-mono font-bold text-emerald-400">${scenario.targetNetWorth.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-zinc-900 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">
                  Initial Regime: <strong className="uppercase text-zinc-300">{scenario.startingRegime}</strong>
                </span>

                <button
                  onClick={() => {
                    soundManager.playClick();
                    onStartChallenge(scenario);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-500 text-black'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                >
                  {isActive ? 'Scenario In Progress' : 'Start Challenge'} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
