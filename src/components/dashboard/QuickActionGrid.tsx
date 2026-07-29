import React from 'react';
import { History, Utensils, LineChart, User } from 'lucide-react';

interface QuickActionGridProps {
  onNavigate: (screen: string) => void;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({ onNavigate }) => {
  const actions = [
    {
      id: 'workout_history',
      title: 'Workout History',
      desc: 'View past logs & routines',
      icon: <History size={20} className="text-neutral-800" />,
      bg: 'bg-white text-neutral-900 border border-border-cool hover:border-neutral-400',
    },
    {
      id: 'nutrition',
      title: 'Nutrition',
      desc: 'Track meals & macros',
      icon: <Utensils size={20} className="text-emerald-700" />,
      bg: 'bg-white text-neutral-900 border border-border-cool hover:border-neutral-400',
    },
    {
      id: 'progress',
      title: 'Progress',
      desc: 'Weight & PR trends',
      icon: <LineChart size={20} className="text-blue-700" />,
      bg: 'bg-white text-neutral-900 border border-border-cool hover:border-neutral-400',
    },
    {
      id: 'profile',
      title: 'Profile',
      desc: 'Settings & account',
      icon: <User size={20} className="text-purple-700" />,
      bg: 'bg-white text-neutral-900 border border-border-cool hover:border-neutral-400',
    },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-500 pl-1">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((act) => (
          <button
            key={act.id}
            onClick={() => onNavigate(act.id)}
            className={`p-4 rounded-3xl flex flex-col justify-between text-left transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98] ${act.bg}`}
          >
            <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center mb-3 shrink-0">
              {act.icon}
            </div>

            <div>
              <span className="font-display font-bold text-sm block leading-snug">
                {act.title}
              </span>
              <span className="text-[11px] font-medium text-neutral-500 block mt-0.5">
                {act.desc}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
