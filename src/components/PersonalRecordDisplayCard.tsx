import React, { useEffect, useState, useCallback } from 'react';
import { Trophy, Scale, Hash, Layers, RefreshCw, AlertTriangle } from 'lucide-react';
import { PersonalRecordService, PersonalRecordData } from '../services/personalRecordService';

interface PersonalRecordDisplayCardProps {
  userId?: string;
  exerciseName: string;
  className?: string;
}

export const PersonalRecordDisplayCard: React.FC<PersonalRecordDisplayCardProps> = ({
  userId = 'guest',
  exerciseName,
  className = '',
}) => {
  const [prData, setPrData] = useState<PersonalRecordData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPR = useCallback(async () => {
    if (!exerciseName) {
      setPrData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await PersonalRecordService.getExercisePersonalRecord(userId, exerciseName);
      if (res.success) {
        setPrData(res.data);
      } else {
        setErrorMsg(res.error || 'Unable to load personal records.');
      }
    } catch {
      setErrorMsg('Unable to load personal records.');
    }
    setIsLoading(false);
  }, [userId, exerciseName]);

  useEffect(() => {
    fetchPR();
  }, [fetchPR]);

  if (isLoading) {
    return (
      <div className={`bg-neutral-50/80 border border-neutral-200 rounded-2xl p-3 flex items-center justify-between text-neutral-400 ${className}`}>
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-amber-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Loading Personal Record...
          </span>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-2 text-amber-900 text-xs ${className}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <AlertTriangle size={15} className="text-amber-600 shrink-0" />
          <span className="truncate">{errorMsg}</span>
        </div>
        <button
          onClick={fetchPR}
          className="flex items-center gap-1 font-bold bg-amber-200/80 hover:bg-amber-300 px-2.5 py-1 rounded-lg text-amber-950 transition-colors shrink-0 cursor-pointer text-[11px]"
        >
          <RefreshCw size={11} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const hasWeight = prData && prData.highest_weight > 0;
  const hasReps = prData && prData.highest_reps > 0;
  const hasVolume = prData && prData.highest_volume > 0;
  const hasAnyPR = hasWeight || hasReps || hasVolume;

  if (!hasAnyPR) {
    return (
      <div className={`bg-neutral-50 border border-neutral-200/70 rounded-2xl p-3 flex items-center gap-2.5 text-neutral-500 ${className}`}>
        <div className="w-7 h-7 rounded-lg bg-neutral-200/70 text-neutral-400 flex items-center justify-center shrink-0">
          <Trophy size={14} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Personal Record
          </span>
          <span className="text-xs font-medium text-neutral-600">
            No personal record yet.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-3.5 flex flex-col gap-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Trophy size={13} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
            Personal Record
          </span>
        </div>
        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
          {exerciseName}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-0.5">
        {/* HIGHEST WEIGHT */}
        <div className="bg-white/80 border border-amber-200/60 rounded-xl p-2 flex flex-col">
          <div className="flex items-center gap-1 text-amber-700 mb-0.5">
            <Scale size={11} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
              Max Weight
            </span>
          </div>
          <span className="font-display font-black text-xs text-neutral-900">
            {hasWeight ? `${prData.highest_weight} kg` : '-'}
          </span>
        </div>

        {/* HIGHEST REPS */}
        <div className="bg-white/80 border border-amber-200/60 rounded-xl p-2 flex flex-col">
          <div className="flex items-center gap-1 text-emerald-700 mb-0.5">
            <Hash size={11} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
              Max Reps
            </span>
          </div>
          <span className="font-display font-black text-xs text-neutral-900">
            {hasReps ? `${prData.highest_reps} reps` : '-'}
          </span>
        </div>

        {/* HIGHEST VOLUME */}
        <div className="bg-white/80 border border-amber-200/60 rounded-xl p-2 flex flex-col">
          <div className="flex items-center gap-1 text-blue-700 mb-0.5">
            <Layers size={11} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
              Max Volume
            </span>
          </div>
          <span className="font-display font-black text-xs text-neutral-900 truncate">
            {hasVolume ? `${prData.highest_volume} kg` : '-'}
          </span>
        </div>
      </div>
    </div>
  );
};
