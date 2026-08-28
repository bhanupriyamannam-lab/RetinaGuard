import React from 'react';
import { AlertCircle, RefreshCw, ServerOff } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isNetworkError?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load clinical data',
  message = 'An unexpected error occurred while communicating with the backend API.',
  onRetry,
  isNetworkError = false
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-xl bg-red-50/50 border border-red-200/80 shadow-sm animate-fade-in my-4">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3 shadow-inner">
        {isNetworkError ? <ServerOff className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
      </div>
      <h4 className="text-base font-bold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-600 mt-1 max-w-md">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-lg transition-all shadow-sm shadow-blue-500/20"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Connection
        </button>
      )}
    </div>
  );
};
