import React from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

const GlobalLoadingSpinner: React.FC = () => {
  const isFetching = useIsFetching();

  if (isFetching === 0) return null;

  return (
    <div className="fixed top-4 right-12 z-50 flex items-center justify-center pointer-events-none">
      <div className={cn(
        "bg-white/80 backdrop-blur-sm border rounded-full px-3 py-1 shadow-sm flex items-center gap-2 text-indigo-600 animate-in fade-in slide-in-from-top-2 duration-200"
      )}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs font-medium uppercase tracking-wider">Syncing...</span>
      </div>
    </div>
  );
};

export default GlobalLoadingSpinner;
