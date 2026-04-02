import React from 'react';
import { Clock, Flame, Plus, Lock } from 'lucide-react';

interface PremiumWorkoutCardProps {
  title: string;
  duration: string;
  calories?: string;
  difficulty?: string;
  imageUrl: string;
  onClick: () => void;
  isPremium?: boolean;
}

export const PremiumWorkoutCard: React.FC<PremiumWorkoutCardProps> = ({
  title,
  duration,
  calories,
  difficulty,
  imageUrl,
  onClick,
  isPremium = false
}) => {
  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
      onClick={onClick}
    >
      <div className="relative h-40 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover"
        />
        {isPremium && (
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full p-2">
            <Lock className="w-4 h-4 text-orange-500" />
          </div>
        )}
        {difficulty && (
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-white text-xs font-bold">{difficulty}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-bold text-gray-900 mb-3 line-clamp-1">{title}</h3>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          {calories && (
            <div className="flex items-center space-x-1 text-orange-600">
              <Flame className="w-4 h-4" />
              <span className="font-semibold">{calories}</span>
            </div>
          )}
          <button className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors">
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
