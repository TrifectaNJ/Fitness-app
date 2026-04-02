import React from 'react';
import { Droplets, Scale, Activity, Flame, ChevronRight } from 'lucide-react';

interface TrackerCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: string;
  progress: number;
  color: string;
  onClick: () => void;
}

const TrackerCard: React.FC<TrackerCardProps> = ({ icon, title, subtitle, value, progress, color, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-500 mb-3">{subtitle}</p>
      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className="text-sm text-gray-500">Goal: 8</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color.replace('bg-', 'bg-opacity-100 bg-')}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

interface ModernTrackerSectionProps {
  onTrackerClick: (tracker: string) => void;
}

export const ModernTrackerSection: React.FC<ModernTrackerSectionProps> = ({ onTrackerClick }) => {
  const trackers = [
    { icon: <Droplets className="w-6 h-6 text-blue-600" />, title: 'Water Tracker', subtitle: 'Track your daily water intake', value: '6/8', progress: 75, color: 'bg-blue-50', name: 'Water Tracker' },
    { icon: <Scale className="w-6 h-6 text-purple-600" />, title: 'Weight Tracker', subtitle: 'Monitor your weight progress', value: '72.5 kg', progress: 60, color: 'bg-purple-50', name: 'Weight Tracker' },
    { icon: <Activity className="w-6 h-6 text-green-600" />, title: 'Step Tracker', subtitle: 'Count your daily steps', value: '8,432', progress: 84, color: 'bg-green-50', name: 'Step Tracker' },
    { icon: <Flame className="w-6 h-6 text-orange-600" />, title: 'Calorie Tracker', subtitle: 'Track your calorie intake', value: '1,850', progress: 70, color: 'bg-orange-50', name: 'Calorie Tracker' }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {trackers.map((tracker, index) => (
        <TrackerCard key={index} {...tracker} onClick={() => onTrackerClick(tracker.name)} />
      ))}
    </div>
  );
};
