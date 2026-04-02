import React from 'react';
import { Droplets, Scale, Activity, Utensils, ChevronRight } from 'lucide-react';

interface ModernTrackerCardsProps {
  onTrackerClick: (trackerName: string) => void;
}

export const ModernTrackerCards: React.FC<ModernTrackerCardsProps> = ({ onTrackerClick }) => {
  const trackers = [
    {
      id: 'water',
      title: 'Water Tracker',
      value: '6/8',
      unit: 'glasses',
      icon: <Droplets className="w-6 h-6" />,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      progress: 75
    },
    {
      id: 'weight',
      title: 'Weight Tracker',
      value: '72.5',
      unit: 'kg',
      icon: <Scale className="w-6 h-6" />,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      progress: 60
    },
    {
      id: 'steps',
      title: 'Step Tracker',
      value: '8,432',
      unit: 'steps',
      icon: <Activity className="w-6 h-6" />,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      progress: 84
    },
    {
      id: 'calories',
      title: 'Calorie Tracker',
      value: '1,850',
      unit: 'kcal',
      icon: <Utensils className="w-6 h-6" />,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      progress: 92
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {trackers.map((tracker) => (
        <div 
          key={tracker.id}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-300"
          onClick={() => onTrackerClick(tracker.title)}
        >
          <div className={`w-12 h-12 ${tracker.bgColor} rounded-xl flex items-center justify-center ${tracker.iconColor} mb-3`}>
            {tracker.icon}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">{tracker.title}</h3>
          <div className="flex items-baseline space-x-1 mb-2">
            <span className="text-2xl font-bold text-gray-900">{tracker.value}</span>
            <span className="text-xs text-gray-500">{tracker.unit}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${tracker.iconColor.replace('text-', 'bg-')}`} style={{ width: `${tracker.progress}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  );
};
