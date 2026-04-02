import React, { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { Activity, TrendingUp } from 'lucide-react';

interface RealtimeProgressIndicatorProps {
  isNew: boolean;
  onClear: () => void;
  autoHideDuration?: number;
}

export function RealtimeProgressIndicator({ 
  isNew, 
  onClear, 
  autoHideDuration = 5000 
}: RealtimeProgressIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isNew) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onClear();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [isNew, onClear, autoHideDuration]);

  if (!visible) return null;

  return (
    <div className="absolute -top-1 -right-1 z-10">
      <Badge 
        variant="default" 
        className="bg-green-500 text-white animate-pulse shadow-lg"
      >
        <Activity className="w-3 h-3 mr-1" />
        New
      </Badge>
    </div>
  );
}

interface DataUpdateBannerProps {
  count: number;
  onRefresh?: () => void;
}

export function DataUpdateBanner({ count, onRefresh }: DataUpdateBannerProps) {
  if (count === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between animate-slide-down">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          {count} new update{count > 1 ? 's' : ''} available
        </span>
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Refresh
        </button>
      )}
    </div>
  );
}
