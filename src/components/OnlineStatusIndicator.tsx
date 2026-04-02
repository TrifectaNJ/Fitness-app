import React from 'react';

interface OnlineStatusIndicatorProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({ 
  status, 
  size = 'sm' 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline':
      default: return 'bg-gray-400';
    }
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'sm': return 'w-2 h-2';
      case 'md': return 'w-3 h-3';
      case 'lg': return 'w-4 h-4';
      default: return 'w-2 h-2';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'busy': return 'Busy';
      case 'offline':
      default: return 'Offline';
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div 
        className={`rounded-full ${getSizeClass(size)} ${getStatusColor(status)}`}
        title={getStatusText(status)}
      />
    </div>
  );
};