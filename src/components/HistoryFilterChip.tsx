import React, { useRef, useEffect } from 'react';

export type HistoryFilterType =
  | 'all'
  | 'Chest'
  | 'Back'
  | 'Legs'
  | 'Shoulders'
  | 'Arms'
  | 'Core'
  | 'Full Body'
  | 'Cardio'
  | 'Custom'
  | 'today'
  | 'week'
  | 'month';

interface HistoryFilterChipProps {
  activeFilter: HistoryFilterType;
  onSelectFilter: (filter: HistoryFilterType) => void;
}

export const HistoryFilterChip: React.FC<HistoryFilterChipProps> = ({
  activeFilter,
  onSelectFilter,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const filters: { id: HistoryFilterType; label: string }[] = [
    { id: 'all', label: 'All Workouts' },
    { id: 'Chest', label: 'Chest' },
    { id: 'Back', label: 'Back' },
    { id: 'Legs', label: 'Legs' },
    { id: 'Shoulders', label: 'Shoulders' },
    { id: 'Arms', label: 'Arms' },
    { id: 'Core', label: 'Core' },
    { id: 'Full Body', label: 'Full Body' },
    { id: 'Cardio', label: 'Cardio' },
    { id: 'Custom', label: 'Custom' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  // Scroll selected chip into view smoothly when active filter changes or on mount
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const item = activeRef.current;
      const containerLeft = container.scrollLeft;
      const containerRight = containerLeft + container.clientWidth;
      const itemLeft = item.offsetLeft;
      const itemRight = itemLeft + item.clientWidth;

      if (itemLeft < containerLeft) {
        container.scrollTo({ left: itemLeft - 12, behavior: 'smooth' });
      } else if (itemRight > containerRight) {
        container.scrollTo({ left: itemRight - container.clientWidth + 12, behavior: 'smooth' });
      }
    }
  }, [activeFilter]);

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5 w-full max-w-full touch-pan-x"
    >
      {filters.map((f) => {
        const isActive = activeFilter === f.id;
        return (
          <button
            key={f.id}
            ref={isActive ? activeRef : null}
            type="button"
            onClick={() => onSelectFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 whitespace-nowrap transition-all cursor-pointer border ${
              isActive
                ? 'bg-neutral-900 border-neutral-900 text-white shadow-2xs'
                : 'bg-neutral-50 border-border-cool text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
};

