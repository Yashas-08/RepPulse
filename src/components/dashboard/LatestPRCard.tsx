import React from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import { LatestPRData } from '../../services/dashboardAnalyticsService';

interface LatestPRCardProps {
  latestPR: LatestPRData | null;
}

export const LatestPRCard: React.FC<LatestPRCardProps> = ({ latestPR }) => {
  if (!latestPR) return null;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-1.5 pl-1">
        <Sparkles size={14} className="text-amber-500" />
        <h3 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-500">
          Latest Personal Record
        </h3>
      </div>

      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-3xl p-5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Trophy size={20} />
          </div>

          <div className="flex flex-col">
            <span className="font-display font-bold text-base text-neutral-900">
              {latestPR.exerciseName}
            </span>
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide mt-0.5">
              {latestPR.recordType}
            </span>
          </div>
        </div>

        <div className="bg-neutral-900 text-white px-3.5 py-1.5 rounded-xl font-mono font-bold text-base shadow-2xs">
          {latestPR.value}
        </div>
      </div>
    </div>
  );
};
