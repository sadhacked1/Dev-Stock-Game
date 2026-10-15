import React, { useState } from 'react';
import { ShieldCheck, Info, X } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] text-zinc-400 py-1.5 px-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>
            <strong className="text-zinc-300">Educational Simulation:</strong> MarketQuest uses fictional companies and virtual money. It does not provide financial or investment advice, and virtual results do not reflect or guarantee real-world trading performance.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden md:inline text-zinc-500 font-medium">
            Made by <strong className="text-zinc-400">Dev Bhati</strong>
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="text-zinc-500 hover:text-zinc-300 transition"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
