import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data from RetinaGuard clinical backend...',
  subMessage,
  size = 'md'
}) => {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl bg-white border border-slate-100 shadow-sm animate-fade-in">
      <div className="relative mb-3">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
          <Loader2 className={`${sizeMap[size]} animate-spin`} />
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-800">{message}</p>
      {subMessage && <p className="text-xs text-slate-500 mt-1 max-w-sm">{subMessage}</p>}
    </div>
  );
};
