import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Droplets, Scale, Activity, Utensils } from 'lucide-react';

interface AutoTrackerCardsProps {
  onTrackerClick: (trackerName: string) => void;
}

export const AutoTrackerCards: React.FC<AutoTrackerCardsProps> = ({ onTrackerClick }) => {
  const trackers = [
    {
      id: 'water',
      title: 'Water Tracker',
      description: 'Track your daily water intake',
      icon: <Droplets className="w-5 h-5 text-blue-600" />,
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100'
    },
    {
      id: 'weight',
      title: 'Weight Tracker',
      description: 'Monitor your weight progress',
      icon: <Scale className="w-5 h-5 text-purple-600" />,
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100'
    },
    {
      id: 'steps',
      title: 'Step Tracker',
      description: 'Count your daily steps',
      icon: <Activity className="w-5 h-5 text-green-600" />,
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100'
    },
    {
      id: 'calories',
      title: 'Calorie Tracker',
      description: 'Track your calorie intake',
      icon: <Utensils className="w-5 h-5 text-orange-600" />,
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {trackers.map((tracker) => (
        <Card 
          key={tracker.id}
          className={`${tracker.bgColor} border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer group`}
          onClick={() => onTrackerClick(tracker.title)}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${tracker.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {tracker.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">{tracker.title}</h3>
                  <p className="text-gray-600 text-sm">{tracker.description}</p>
                  <p className="text-xs text-orange-600 mt-1 font-semibold">Tap to track →</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
