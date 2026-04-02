import React from 'react';
import { ArrowLeft, Bell } from 'lucide-react';

interface ModernWelcomeHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export const ModernWelcomeHeader: React.FC<ModernWelcomeHeaderProps> = ({
  title = 'Fitness at Home',
  showBackButton = false,
  onBackClick
}) => {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <button
            onClick={onBackClick}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow-md transition-shadow relative">
        <Bell className="w-5 h-5 text-gray-900" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
      </button>
    </div>
  );
};
