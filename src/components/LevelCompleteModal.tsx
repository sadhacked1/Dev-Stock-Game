import React from 'react';
import { CampaignLevel } from '../types/game';
import { Trophy, CheckCircle2, ArrowRight, Sparkles, X } from 'lucide-react';
import { soundManager } from '../services/sound';

interface LevelCompleteModalProps {
  level: CampaignLevel | null;
  onClose: () => void;
  onOpenQuiz: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  level,
  onClose,
  onOpenQuiz,
}) => {
  if (!level) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-zinc-950 border border-emerald-500/50 rounded-2xl max-w-md w-full shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-600/50 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
          <Trophy className="w-7 h-7" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Objectives Completed!
          </span>
          <h2 className="text-xl font-black text-white mt-1">
            Level {level.id}: {level.title}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {level.topic}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-left text-xs space-y-2">
          <span className="font-bold text-zinc-300 block">Accomplished:</span>
          {level.objectives.map((obj) => (
            <div key={obj.id} className="flex items-start gap-2 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{obj.text}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenQuiz();
            }}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
          >
            <Sparkles className="w-4 h-4" /> Take Knowledge Checkpoint Quiz
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-lg text-xs transition"
          >
            Continue Trading
          </button>
        </div>
      </div>
    </div>
  );
};
