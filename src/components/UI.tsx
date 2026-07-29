import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { ButtonProps, CardProps, InputProps } from '../types';

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  id,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-sans font-semibold tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-text/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer rounded-2xl';
  
  const variants = {
    primary: 'bg-primary-text text-white hover:bg-neutral-800 border-none',
    secondary: 'bg-white text-primary-text border border-border-cool hover:bg-neutral-50 hover:border-neutral-300',
    danger: 'bg-danger-coral text-white hover:bg-red-600 border-none',
    ghost: 'text-secondary-text hover:text-primary-text hover:bg-neutral-50',
  };

  const sizes = {
    sm: 'h-10 px-5 text-xs',
    md: 'h-[52px] px-6 text-base',
    lg: 'h-14 px-8 text-base',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      id={id}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  id,
  ...props
}) => {
  return (
    <div
      id={id}
      className={`bg-card-pure border border-border-cool rounded-2xl p-5 ${
        hoverable ? 'transition-all duration-200 hover:border-divider-silver hover:shadow-xs' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  rightElement,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || React.useId();
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium uppercase tracking-wider text-secondary-text pl-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-4 text-secondary-text pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full h-[52px] bg-white text-primary-text border border-border-cool rounded-2xl px-4 ${
            icon ? 'pl-11' : ''
          } ${
            rightElement ? 'pr-12' : ''
          } text-sm placeholder:text-secondary-text/60 focus:outline-none focus:border-primary-text focus:ring-2 focus:ring-primary-text/5 transition-all duration-150`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-1.5 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <span className="text-xs font-medium text-danger-coral mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
};

interface NavbarProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({ title, onBack, rightAction }) => {
  return (
    <header className="h-14 bg-white border-b border-border-cool px-4 flex items-center justify-between sticky top-0 z-40 select-none">
      <div className="flex items-center gap-2 min-w-[50px]">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-text hover:bg-bg-snow active:scale-95 transition-all cursor-pointer"
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>
      <h1 className="font-display font-bold text-base text-primary-text tracking-tight uppercase">
        {title}
      </h1>
      <div className="flex items-center justify-end min-w-[50px]">
        {rightAction || <div className="w-8 h-8" />}
      </div>
    </header>
  );
};

export const SectionTitle: React.FC<{
  title: string;
  subtitle?: string;
  className?: string;
  tag?: string;
}> = ({ title, subtitle, className = '', tag }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {tag && (
        <div className="self-start px-2.5 py-1 bg-bg-snow border border-border-cool rounded-full text-[10px] font-bold uppercase tracking-wider text-secondary-text mb-1">
          {tag}
        </div>
      )}
      <h2 className="font-display font-bold text-xl text-primary-text tracking-tight uppercase">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs text-secondary-text tracking-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export const PageContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`flex-1 flex flex-col bg-bg-snow overflow-y-auto no-scrollbar pb-24 ${className}`}>
      {children}
    </div>
  );
};

export const Footer: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <footer className={`py-6 px-4 text-center border-t border-border-cool bg-white mt-auto ${className}`}>
      <p className="font-display font-bold text-xs tracking-wider uppercase text-primary-text">
        RepPulse
      </p>
      <p className="text-[10px] text-secondary-text mt-1 uppercase tracking-widest">
        Every Rep Counts &bull; Version 1.0
      </p>
    </footer>
  );
};
