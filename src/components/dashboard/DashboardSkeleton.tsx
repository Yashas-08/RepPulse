import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="px-5 py-6 flex flex-col gap-6 animate-pulse">
      {/* Primary Workout Card Skeleton */}
      <div className="bg-neutral-100 border border-neutral-200/80 rounded-3xl p-6 h-[140px] flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="h-4 bg-neutral-200 rounded-md w-1/3" />
          <div className="h-6 w-20 bg-neutral-200 rounded-full" />
        </div>
        <div className="h-12 bg-neutral-200 rounded-2xl w-full" />
      </div>

      {/* Today's Summary Skeleton */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-5 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="h-3 bg-neutral-200 rounded-md w-1/4" />
          <div className="h-3 bg-neutral-200 rounded-md w-1/6" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-20 bg-neutral-100 rounded-2xl border border-neutral-200/50" />
          <div className="h-20 bg-neutral-100 rounded-2xl border border-neutral-200/50" />
          <div className="h-20 bg-neutral-100 rounded-2xl border border-neutral-200/50" />
        </div>
      </div>

      {/* Streak Skeleton */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-5 h-28 flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <div className="h-3 bg-neutral-200 rounded-md w-1/3" />
          <div className="h-5 w-24 bg-neutral-200 rounded-full" />
        </div>
        <div className="h-8 bg-neutral-200 rounded-md w-1/2" />
      </div>

      {/* Latest Workout Skeleton */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-5 h-24 flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-neutral-200 shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-4 bg-neutral-200 rounded-md w-2/3" />
          <div className="h-3 bg-neutral-200 rounded-md w-1/2" />
        </div>
      </div>

      {/* Quick Actions Skeleton Grid */}
      <div className="flex flex-col gap-2.5">
        <div className="h-3 bg-neutral-200 rounded-md w-1/4" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 bg-neutral-100 rounded-3xl border border-neutral-200" />
          <div className="h-28 bg-neutral-100 rounded-3xl border border-neutral-200" />
          <div className="h-28 bg-neutral-100 rounded-3xl border border-neutral-200" />
          <div className="h-28 bg-neutral-100 rounded-3xl border border-neutral-200" />
        </div>
      </div>
    </div>
  );
};
