import React from 'react';

interface GreetingSectionProps {
  greeting: string;
  displayName: string;
}

export const GreetingSection: React.FC<GreetingSectionProps> = ({ greeting, displayName }) => {
  return (
    <div className="flex flex-col gap-2 pt-1 pb-2">
      <h1 className="font-display font-black text-3xl sm:text-4xl text-neutral-900 tracking-tight leading-none">
        {greeting},{' '}
        <span className="text-neutral-900">{displayName}</span>
      </h1>
      <p className="text-sm text-neutral-500 font-medium tracking-tight">
        Ready to build momentum today?
      </p>
    </div>
  );
};
