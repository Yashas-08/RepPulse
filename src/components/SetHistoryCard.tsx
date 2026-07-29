import React from 'react';

interface SetHistoryCardProps {
  setNumber: number;
  weight: number;
  reps: number;
}

export const SetHistoryCard: React.FC<SetHistoryCardProps> = ({ setNumber, weight, reps }) => {
  return (
    <div className="flex items-center justify-between bg-neutral-50 border border-neutral-200/80 rounded-xl px-3.5 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-md bg-neutral-200/80 text-neutral-700 font-bold text-[10px] flex items-center justify-center shrink-0">
          #{setNumber}
        </span>
        <span className="font-semibold text-neutral-600 uppercase text-[10px] tracking-wider">
          Set {setNumber}
        </span>
      </div>

      <div className="flex items-center gap-3 font-mono font-bold text-neutral-900">
        <span className="bg-white px-2 py-0.5 rounded border border-neutral-200 shadow-2xs">
          {weight} kg
        </span>
        <span className="text-neutral-300">×</span>
        <span className="bg-white px-2 py-0.5 rounded border border-neutral-200 shadow-2xs">
          {reps} reps
        </span>
      </div>
    </div>
  );
};
