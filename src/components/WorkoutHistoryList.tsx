import React, { useState, useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { SavedWorkoutRecord } from '../services/workoutSaveService';
import { HistorySearchBar } from './HistorySearchBar';
import { HistoryFilterChip, HistoryFilterType } from './HistoryFilterChip';
import { WorkoutHistoryCard } from './WorkoutHistoryCard';
import { EmptyHistoryState } from './EmptyHistoryState';

export type SortOrderType =
  | 'newest'
  | 'oldest'
  | 'longest'
  | 'shortest'
  | 'most_exercises'
  | 'least_exercises';

interface WorkoutHistoryListProps {
  records: SavedWorkoutRecord[];
  onSelectRecord: (record: SavedWorkoutRecord) => void;
  onStartNewWorkout: () => void;
  onDeleteRecord?: (recordId: string) => Promise<void> | void;
}

export const WorkoutHistoryList: React.FC<WorkoutHistoryListProps> = ({
  records,
  onSelectRecord,
  onStartNewWorkout,
  onDeleteRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<HistoryFilterType>('all');
  const [sortOrder, setSortOrder] = useState<SortOrderType>('newest');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Filter & Search Logic
  const filteredAndSortedRecords = useMemo(() => {
    let result = [...records];

    // 1. Search Query Filter (Workout Name, Category, or Exercise Name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((r) => {
        const matchesName = (r.workout_name || '').toLowerCase().includes(query);
        const matchesCategory = (r.category_title || '').toLowerCase().includes(query);
        const matchesExercise = r.exercises_data?.some(
          (ex) =>
            (ex.name || '').toLowerCase().includes(query) ||
            (ex.region_name || '').toLowerCase().includes(query)
        );
        return matchesName || matchesCategory || matchesExercise;
      });
    }

    // 2. Active Category / Date Filter
    if (activeFilter !== 'all') {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      if (activeFilter === 'today') {
        result = result.filter((r) => {
          const rDateStr = (r.workout_date || r.created_at || '').split('T')[0];
          return rDateStr === todayStr;
        });
      } else if (activeFilter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        result = result.filter((r) => {
          const rDate = new Date(r.workout_date || r.created_at || Date.now());
          return rDate >= oneWeekAgo;
        });
      } else if (activeFilter === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(now.getDate() - 30);
        result = result.filter((r) => {
          const rDate = new Date(r.workout_date || r.created_at || Date.now());
          return rDate >= oneMonthAgo;
        });
      } else {
        // Category or Muscle group filter (Chest, Back, Legs, Shoulders, Arms, Core, Cardio, Custom)
        const filterLower = activeFilter.toLowerCase();
        result = result.filter((r) => {
          const catMatch = (r.category_title || '').toLowerCase().includes(filterLower);
          const nameMatch = (r.workout_name || '').toLowerCase().includes(filterLower);
          const exMatch = r.exercises_data?.some(
            (ex) =>
              (ex.region_name || '').toLowerCase().includes(filterLower) ||
              (ex.name || '').toLowerCase().includes(filterLower)
          );
          return catMatch || nameMatch || exMatch;
        });
      }
    }

    // 3. Sorting Logic (Step 7)
    result.sort((a, b) => {
      const timeA = new Date(a.created_at || a.workout_date || Date.now()).getTime();
      const timeB = new Date(b.created_at || b.workout_date || Date.now()).getTime();

      switch (sortOrder) {
        case 'oldest':
          return timeA - timeB;
        case 'longest':
          return (b.duration_minutes || 0) - (a.duration_minutes || 0);
        case 'shortest':
          return (a.duration_minutes || 0) - (b.duration_minutes || 0);
        case 'most_exercises':
          return (b.total_exercises || 0) - (a.total_exercises || 0);
        case 'least_exercises':
          return (a.total_exercises || 0) - (b.total_exercises || 0);
        case 'newest':
        default:
          return timeB - timeA;
      }
    });

    return result;
  }, [records, searchQuery, activeFilter, sortOrder]);

  // Handle Clear Search & Filters
  const handleClearSearchAndFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
    setSortOrder('newest');
  };

  if (records.length === 0) {
    return <EmptyHistoryState type="no_history" onActionClick={onStartNewWorkout} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* SEARCH BAR */}
      <HistorySearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* FILTER CHIPS & SORT DROPDOWN */}
      <div className="flex flex-col gap-2.5">
        <HistoryFilterChip
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
        />

        <div className="flex items-center justify-between gap-2 border-t border-neutral-100 pt-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            Filter & Sort
          </span>

          {/* SORT SELECTOR */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ArrowUpDown size={13} className="text-neutral-400 shrink-0" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrderType)}
              className="bg-neutral-50 border border-border-cool rounded-lg px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-700 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="longest">Longest Duration</option>
              <option value="shortest">Shortest Duration</option>
              <option value="most_exercises">Most Exercises</option>
              <option value="least_exercises">Least Exercises</option>
            </select>
          </div>
        </div>
      </div>

      {/* LIST OR EMPTY RESULTS */}
      {filteredAndSortedRecords.length === 0 ? (
        <EmptyHistoryState
          type="no_search_results"
          onActionClick={handleClearSearchAndFilters}
        />
      ) : (
        <div className="flex flex-col gap-3 mt-1">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              Showing {filteredAndSortedRecords.length} {filteredAndSortedRecords.length === 1 ? 'Workout' : 'Workouts'}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {filteredAndSortedRecords.map((record) => (
              <WorkoutHistoryCard
                key={record.id}
                record={record}
                isExpanded={expandedRecordId === record.id}
                onToggleExpand={() =>
                  setExpandedRecordId((prev) => (prev === record.id ? null : record.id))
                }
                onViewDetails={() => onSelectRecord(record)}
                onDeleteRecord={async (id) => {
                  if (onDeleteRecord) {
                    await onDeleteRecord(id);
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

