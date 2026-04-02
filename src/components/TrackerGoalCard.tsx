import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Edit3, Droplets, Scale, Activity, Utensils } from 'lucide-react';

interface TrackerGoalCardProps {
  trackerName: string;
  dailyGoal: number;
  unit: string;
  onUpdateGoal: () => void;
}

export const TrackerGoalCard: React.FC<TrackerGoalCardProps> = ({
  trackerName,
  dailyGoal,
  unit,
  onUpdateGoal
}) => {
  const getTrackerIcon = () => {
    if (trackerName.toLowerCase().includes('water')) return <Droplets className="w-5 h-5 text-blue-500" />;
    if (trackerName.toLowerCase().includes('weight')) return <Scale className="w-5 h-5 text-purple-500" />;
    if (trackerName.toLowerCase().includes('step')) return <Activity className="w-5 h-5 text-green-500" />;
    if (trackerName.toLowerCase().includes('calorie')) return <Utensils className="w-5 h-5 text-orange-500" />;
    return <Target className="w-5 h-5 text-indigo-500" />;
  };

  const getGradientClass = () => {
    if (trackerName.toLowerCase().includes('water')) return 'from-blue-50 via-white to-blue-50/30 border-blue-100';
    if (trackerName.toLowerCase().includes('weight')) return 'from-purple-50 via-white to-purple-50/30 border-purple-100';
    if (trackerName.toLowerCase().includes('step')) return 'from-green-50 via-white to-green-50/30 border-green-100';
    if (trackerName.toLowerCase().includes('calorie')) return 'from-orange-50 via-white to-orange-50/30 border-orange-100';
    return 'from-indigo-50 via-white to-indigo-50/30 border-indigo-100';
  };

  const getMotivationalMessage = () => {
    if (trackerName.toLowerCase().includes('water')) return 'Stay hydrated, stay healthy!';
    if (trackerName.toLowerCase().includes('weight')) return 'Every step counts towards your goal!';
    if (trackerName.toLowerCase().includes('step')) return 'Keep moving forward!';
    if (trackerName.toLowerCase().includes('calorie')) return 'Fuel your body right!';
    return 'You\'ve got this!';
  };

  return (
    <Card className={`bg-gradient-to-br ${getGradientClass()} shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
          <Target className="w-5 h-5 text-gray-600" />
          <span>Daily Goal</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center">
            {getTrackerIcon()}
          </div>
          <div className="space-y-1">
            <div className="text-4xl font-bold text-gray-900">
              {dailyGoal}
            </div>
            <div className="text-lg text-gray-600 font-medium">
              {unit} per day
            </div>
          </div>
          <p className="text-sm text-gray-600 italic">
            {getMotivationalMessage()}
          </p>
        </div>
        
        <Button 
          onClick={onUpdateGoal}
          variant="outline"
          className="w-full h-11 font-medium border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors duration-200"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Update Goal
        </Button>
      </CardContent>
    </Card>
  );
};