import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  TrendingUp,
  User
} from 'lucide-react';
import { ScreenType } from '../types';

interface BottomNavigationProps {
  activeTab: ScreenType;
  onTabChange: (tab: ScreenType) => void;
  onLogout: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'dashboard' as ScreenType, label: 'Home', icon: LayoutDashboard },
    { id: 'workout' as ScreenType, label: 'Workout', icon: Dumbbell },
    { id: 'nutrition' as ScreenType, label: 'Nutrition', icon: Utensils },
    { id: 'progress' as ScreenType, label: 'Progress', icon: TrendingUp },
    { id: 'profile' as ScreenType, label: 'Profile', icon: User },
  ];

  const handleTabClick = (tabId: ScreenType) => {
    onTabChange(tabId);
  };

  const isTabActive = (tabId: ScreenType) => {
    if (tabId === 'workout' && activeTab === 'workout_history') return true;
    if (tabId === 'dashboard' && (activeTab === 'calendar' || activeTab === 'notifications')) return true;
    if (tabId === 'profile' && (activeTab === 'friends' || activeTab === 'settings')) return true;
    return tabId === activeTab;
  };

  return (
    <nav
      aria-label="Bottom Navigation"
      className="relative z-40 grid min-h-[calc(4rem+env(safe-area-inset-bottom))] w-full shrink-0 grid-cols-5 items-stretch border-t border-border-cool bg-white px-1 pt-1 pb-[env(safe-area-inset-bottom)] select-none shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
    >
      {tabs.map((tab) => {
        const active = isTabActive(tab.id);
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
            className="group flex min-w-0 w-full flex-col items-center justify-center py-1 text-center cursor-pointer transition-all duration-150 active:scale-95"
          >
            {/* Icon */}
            <div className="flex items-center justify-center p-0.5">
              <Icon
                size={22}
                strokeWidth={active ? 2.35 : 1.75}
                className={`transition-all duration-150 ${
                  active
                    ? 'text-primary-text scale-105'
                    : 'text-secondary-text group-hover:text-neutral-700'
                }`}
              />
            </div>

            {/* Label */}
            <span
              className={`max-w-full whitespace-nowrap text-[9px] min-[380px]:text-[10px] leading-tight transition-colors duration-150 uppercase tracking-wider ${
                active
                  ? 'font-bold text-primary-text'
                  : 'font-medium text-secondary-text group-hover:text-neutral-700'
              }`}
            >
              {tab.label}
            </span>

            {/* Active Indicator Dot (positioned cleanly below the label with zero overlap) */}
            <div className="h-1 flex items-center justify-center mt-0.5">
              {active && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="w-1 h-1 bg-primary-text rounded-full"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
};
