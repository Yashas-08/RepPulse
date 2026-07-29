import React, { useState, useEffect } from 'react';
import { ScreenType } from '../types';

interface PhoneFrameProps {
  children: React.ReactNode;
  activeScreen: ScreenType;
  onScreenChange: (screen: ScreenType) => void;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  activeScreen,
  onScreenChange,
}) => {
  const [time, setTime] = useState('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const isDarkScreen = activeScreen === 'splash';
  const statusBarBg = isDarkScreen ? 'bg-black border-b border-neutral-900' : 'bg-white';
  const statusTextClass = isDarkScreen ? 'text-white/90' : 'text-primary-text';
  const homeBarBg = isDarkScreen ? 'bg-black' : 'bg-white';
  const homeIndicatorBg = isDarkScreen ? 'bg-neutral-800' : 'bg-slate-300';

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 md:p-10 font-sans">
      
      {/* Simulated Mobile Phone Frame Centered */}
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Soft shadow background element */}
        <div className="absolute inset-4 bg-white/5 blur-3xl rounded-[48px] pointer-events-none" />

        {/* The Outer Phone Hardware Shell */}
        <div className="w-[375px] h-[812px] bg-slate-950 border-[10px] border-slate-900 rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden select-none">
          
          {/* 1. STATUS BAR (iOS Style) */}
          <div className={`h-11 ${statusBarBg} ${statusTextClass} flex items-center justify-between px-6 shrink-0 relative z-50 transition-colors duration-300`}>
            {/* Clock */}
            <span className="text-xs font-bold font-sans">
              {time}
            </span>

            {/* Dynamic Island Camera Notch */}
            <div className="absolute left-1/2 -translate-x-1/2 w-[110px] h-6 bg-black rounded-full top-2 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900/80 absolute right-4 border border-slate-950/20" />
            </div>

            {/* Indicators */}
            <div className="flex items-center gap-1.5">
              {/* Cellular Signal Icon */}
              <svg className="w-4 h-3 text-current" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="16" width="3" height="4" rx="0.5" />
                <rect x="7" y="12" width="3" height="8" rx="0.5" />
                <rect x="12" y="8" width="3" height="12" rx="0.5" />
                <rect x="17" y="4" width="3" height="16" rx="0.5" />
              </svg>
              {/* Battery Icon */}
              <div className={`w-5 h-2.5 border ${isDarkScreen ? 'border-white/40' : 'border-primary-text/40'} rounded-sm p-[1px] flex items-center`}>
                <div className={`h-full w-full ${isDarkScreen ? 'bg-white' : 'bg-primary-text'} rounded-2xs`} />
              </div>
            </div>
          </div>

          {/* 2. THE ACTUAL APPLICATION (PORTLET) */}
          <div className="flex-1 flex flex-col overflow-hidden relative bg-bg-snow">
            {children}
          </div>

          {/* 3. HOME INDICATOR BAR (iOS Style Bottom Area) */}
          <div className={`h-5 ${homeBarBg} flex items-center justify-center shrink-0 relative z-50 pb-1 transition-colors duration-300`}>
            <div className={`w-32 h-1 ${homeIndicatorBg} rounded-full transition-colors duration-300`} />
          </div>
        </div>
      </div>

    </div>
  );
};
