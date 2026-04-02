import React from 'react';
import { ChevronRight, Droplets, Scale, Activity, Utensils } from 'lucide-react';

interface PremiumTrackerCardProps {
  onTrackerClick: (trackerName: string) => void;
}

export const PremiumTrackerCard: React.FC<PremiumTrackerCardProps> = ({ onTrackerClick }) => {
  const trackers = [
    {
      id: 'water',
      title: 'Water Tracker',
      description: 'Track your daily water intake',
      icon: <Droplets className="w-6 h-6" />,
      bgColor: 'from-blue-50 to-blue-100',
      iconBg: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      id: 'weight',
      title: 'Weight Tracker',
      description: 'Monitor your weight progress',
      icon: <Scale className="w-6 h-6" />,
      bgColor: 'from-purple-50 to-purple-100',
      iconBg: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      id: 'steps',
      title: 'Step Tracker',
      description: 'Count your daily steps',
      icon: <Activity className="w-6 h-6" />,
      bgColor: 'from-green-50 to-green-100',
      iconBg: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      id: 'calories',
      title: 'Calorie Tracker',
      description: 'Track your calorie intake',
      icon: <Utensils className="w-6 h-6" />,
      bgColor: 'from-orange-50 to-orange-100',
      iconBg: 'bg-orange-500',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {trackers.map((tracker) => (
        <div 
          key={tracker.id}
          className={`bg-gradient-to-br ${tracker.bgColor} rounded-2xl p-5 cursor-pointer transform hover:scale-[1.02] transition-all duration-300 shadow-md hover:shadow-xl`}
          onClick={() => onTrackerClick(tracker.title)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-14 h-14 ${tracker.iconBg} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                {tracker.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{tracker.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{tracker.description}</p>
                <p className={`text-xs ${tracker.textColor} font-bold`}>Tap to track →</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 ${tracker.textColor}`} />
          </div>
        </div>
      ))}
    </div>
  );
};
