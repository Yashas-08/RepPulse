import React from 'react';
import { Search, X } from 'lucide-react';

interface HistorySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const HistorySearchBar: React.FC<HistorySearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search workout or exercise name...',
}) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
        <Search size={18} />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 bg-neutral-50 border border-border-cool rounded-xl text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all shadow-2xs"
      />

      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
          aria-label="Clear search query"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
