import React from 'react';
import { Sparkles, Trophy, TrendingUp, Dumbbell, Repeat, Scale } from 'lucide-react';
import { WorkoutInsightsData } from '../services/workoutProgressService';

interface WorkoutInsightCardProps {
  insights: WorkoutInsightsData;
}

export const WorkoutInsightCard: React.FC<WorkoutInsightCardProps> = ({ insights }) => {
  return (
    <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-black text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-neutral-800 flex flex-col gap-3.5 sm:gap-4 relative overflow-hidden select-none w-full h-auto min-h-0 shrink-0">
      {/* BACKGROUND DECORATIVE GLOW */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 border border-amber-500/30">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-black text-base sm:text-lg text-white uppercase tracking-tight truncate">
              Workout Insights
            </h3>
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider -mt-0.5 truncate">
              Compared to your last exercise session
            </p>
          </div>
        </div>

        {insights.personalRecordsCount > 0 && (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs shrink-0 whitespace-nowrap">
            <Trophy size={13} />
            <span>{insights.personalRecordsCount} PRs</span>
          </span>
        )}
      </div>

      {/* INSIGHTS METRICS GRID */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* EXERCISES IMPROVED */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between min-w-0">
          <div className="flex items-center gap-1.5 text-emerald-400 mb-1 min-w-0">
            <TrendingUp size={14} className="shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 truncate">
              Improved
            </span>
          </div>
          <span className="font-display font-black text-xl sm:text-2xl text-white tracking-tight my-0.5">
            {insights.exercisesImprovedCount}
          </span>
          <span className="text-[10px] text-neutral-400 font-medium truncate">Exercises</span>
        </div>

        {/* PERSONAL RECORDS */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between min-w-0">
          <div className="flex items-center gap-1.5 text-amber-400 mb-1 min-w-0">
            <Trophy size={14} className="shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 truncate">
              PRs Broken
            </span>
          </div>
          <span className="font-display font-black text-xl sm:text-2xl text-amber-300 tracking-tight my-0.5">
            {insights.personalRecordsCount}
          </span>
          <span className="text-[10px] text-neutral-400 font-medium truncate">Records</span>
        </div>

        {/* WEIGHT INCREASED */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between min-w-0">
          <div className="flex items-center gap-1.5 text-blue-400 mb-1 min-w-0">
            <Scale size={14} className="shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 truncate">
              Max Weight
            </span>
          </div>
          <span className="font-display font-black text-xl sm:text-2xl text-white tracking-tight my-0.5">
            {insights.netWeightIncreaseKg > 0 ? `+${insights.netWeightIncreaseKg} kg` : '0 kg'}
          </span>
          <span className="text-[10px] text-neutral-400 font-medium truncate">Overload</span>
        </div>

        {/* WORKOUT VOLUME */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between min-w-0">
          <div className="flex items-center gap-1.5 text-purple-400 mb-1 min-w-0">
            <Dumbbell size={14} className="shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 truncate">
              Volume Gain
            </span>
          </div>
          <span className="font-display font-black text-xl sm:text-2xl text-white tracking-tight my-0.5">
            {insights.netVolumeIncreaseKg > 0
              ? `+${insights.netVolumeIncreaseKg.toLocaleString()} kg`
              : '0 kg'}
          </span>
          <span className="text-[10px] text-neutral-400 font-medium truncate">Total Volume</span>
        </div>
      </div>

      {/* PR BREAKDOWN LIST IF ANY */}
      {insights.prList.length > 0 && (
        <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
            🏆 Records Achieved In This Session:
          </span>
          <div className="flex flex-col gap-1">
            {insights.prList.map((pr, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl"
              >
                <span className="font-bold text-white text-[11px] truncate">{pr.exerciseName}</span>
                <span className="font-mono font-bold text-amber-300 text-xs shrink-0">{pr.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
