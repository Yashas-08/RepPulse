import React from 'react';
import { History, SearchX, PlusCircle } from 'lucide-react';

interface EmptyHistoryStateProps {
  type: 'no_history' | 'no_search_results';
  onActionClick: () => void;
}

export const EmptyHistoryState: React.FC<EmptyHistoryStateProps> = ({
  type,
  onActionClick,
}) => {
  const isNoHistory = type === 'no_history';

  return (
    <div className="bg-neutral-50 border border-border-cool rounded-3xl p-8 flex flex-col items-center justify-center text-center my-4 shadow-2xs">
      <div className="w-14 h-14 rounded-2xl bg-white border border-border-cool text-neutral-500 flex items-center justify-center mb-4 shadow-xs">
        {isNoHistory ? <History size={28} /> : <SearchX size={28} />}
      </div>

      <h3 className="font-display font-bold text-base text-neutral-900 uppercase tracking-tight">
        {isNoHistory ? 'No workouts yet.' : 'No workouts found.'}
      </h3>

      <p className="text-xs text-neutral-500 font-medium mt-1 max-w-[240px] leading-relaxed">
        {isNoHistory
          ? 'You have not logged any workout sessions yet. Start your first workout to build history.'
          : 'No workouts match your current search query or active date filter.'}
      </p>

      <button
        onClick={onActionClick}
        className="mt-5 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95 transition-all"
      >
        {isNoHistory ? (
          <>
            <PlusCircle size={16} />
            <span>Start Your First Workout</span>
          </>
        ) : (
          <span>Clear Search & Filters</span>
        )}
      </button>
    </div>
  );
};
