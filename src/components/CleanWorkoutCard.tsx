import React from 'react';
import { Clock, Lock, Info } from 'lucide-react';

interface CleanWorkoutCardProps {
  title: string;
  duration: string;
  difficulty?: string;
  imageUrl: string;
  onClick: () => void;
  isPremium?: boolean;
}

export const CleanWorkoutCard: React.FC<CleanWorkoutCardProps> = ({
  title,
  duration,
  difficulty,
  imageUrl,
  onClick,
  isPremium = false
}) => {
  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-32 overflow-hidden bg-gray-100">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover"
        />
        {isPremium && (
          <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
            <Lock className="w-4 h-4 text-gray-700" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-1">{title}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{duration}</span>
          </div>
          {difficulty && (
            <div className="flex items-center space-x-1 text-gray-600">
              <Info className="w-4 h-4" />
              <span className="text-xs">{difficulty}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
