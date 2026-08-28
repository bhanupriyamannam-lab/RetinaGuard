import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = true,
  className = '',
  theme = 'light'
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14'
  };

  const titleSizes = {
    sm: 'text-sm font-bold',
    md: 'text-base font-bold',
    lg: 'text-xl font-extrabold tracking-tight',
    xl: 'text-2xl font-black tracking-tight'
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Eye + Shield + Retinal Pattern Icon */}
      <div className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-navy-900 shadow-md shadow-brand-600/20 text-white flex-shrink-0 ${iconSizes[size]}`}>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4/5 h-4/5">
          {/* Shield Outline */}
          <path 
            d="M24 4L9 9.5V21C9 30.5 15.4 39.3 24 44C32.6 39.3 39 30.5 39 21V9.5L24 4Z" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="opacity-90"
          />
          {/* Retinal Eye Vessel Arc */}
          <path 
            d="M15 24C17.5 19 21.5 16.5 24 16.5C26.5 16.5 30.5 19 33 24C30.5 29 26.5 31.5 24 31.5C21.5 31.5 17.5 29 15 24Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
          {/* Optic Disc Core */}
          <circle cx="24" cy="24" r="3.5" fill="#60a5fa" />
          <circle cx="24" cy="24" r="1.5" fill="#ffffff" />
          {/* Retinal Branching Vessels */}
          <path d="M21 24C19 23 18 20.5 17.5 19.5" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M27 24C29 25 30.5 27 31 28.5" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`tracking-tight font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} ${titleSizes[size]}`}>
              RETINA<span className="text-brand-600">GUARD</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200/60 ml-0.5">
              AI
            </span>
          </div>
          {showSubtitle && (
            <span className={`text-[11px] font-medium leading-none tracking-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              AI-assisted retinal screening
            </span>
          )}
        </div>
      )}
    </div>
  );
};
