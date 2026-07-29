import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const NotFoundScreen: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col bg-white h-full justify-center px-6">
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-neutral-50 border border-neutral-150 flex items-center justify-center text-neutral-800 mb-5">
          <ShieldAlert size={20} strokeWidth={1.8} />
        </div>
        <h3 className="font-display font-black text-sm text-neutral-950 uppercase tracking-wide">
          Route Unavailable
        </h3>
        <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed max-w-[240px]">
          This page is not active or is restricted in the current modular layout. Select a valid navigation tab to continue.
        </p>
      </div>
    </div>
  );
};
