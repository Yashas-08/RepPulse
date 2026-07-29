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
    return tabId === activeTab;
  };

  return (
    <nav className="h-16 bg-white border-t border-border-cool flex items-center justify-around px-2 relative z-40 select-none pb-safe">
      {tabs.map((tab) => {
        const active = isTabActive(tab.id);
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center cursor-pointer transition-all active:scale-95"
          >
            <div className={`relative p-1 transition-colors duration-150 ${active ? 'text-primary-text' : 'text-secondary-text'}`}>
              <tab.icon size={24} strokeWidth={active ? 2.2 : 1.8} />
              {active && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-[#111111] rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </div>
            <span className={`text-[10px] font-semibold mt-0.5 transition-colors duration-150 uppercase tracking-widest ${active ? 'text-primary-text' : 'text-secondary-text'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
