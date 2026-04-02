import React from 'react';
import { Clock, Info, Lock, Plus } from 'lucide-react';

interface PremiumWorkoutCardV2Props {
  title: string;
  duration: string;
  imageUrl: string;
  isPremium?: boolean;
  difficulty?: string;
  onClick?: () => void;
}

export const PremiumWorkoutCardV2: React.FC<PremiumWorkoutCardV2Props> = ({
  title,
  duration,
  imageUrl,
  isPremium = false,
  difficulty,
  onClick
}) => {
  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-32 object-cover"
        />
        {isPremium && (
          <div className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      <div className="p-4 flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{duration}</span>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button className="w-10 h-10 bg-gray-100 hover:bg-orange-500 hover:text-white rounded-full flex items-center justify-center transition-all">
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
