import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Droplets, Scale, Activity, Utensils, Edit3 } from 'lucide-react';

interface TrackerGoalCardProps {
  trackerName: string;
  dailyGoal: number;
  unit: string;
  onUpdateGoal: () => void;
}

export const SimplifiedTrackerGoalCard: React.FC<TrackerGoalCardProps> = ({
  trackerName,
  dailyGoal,
  unit,
  onUpdateGoal
}) => {
  const getTrackerIcon = () => {
    if (trackerName.toLowerCase().includes('water')) return <Droplets className="w-6 h-6 text-blue-600" />;
    if (trackerName.toLowerCase().includes('weight')) return <Scale className="w-6 h-6 text-purple-600" />;
    if (trackerName.toLowerCase().includes('step')) return <Activity className="w-6 h-6 text-green-600" />;
    if (trackerName.toLowerCase().includes('calorie')) return <Utensils className="w-6 h-6 text-orange-600" />;
    return <Target className="w-6 h-6 text-blue-600" />;
  };

  const getCardStyle = () => {
    if (trackerName.toLowerCase().includes('water')) return 'bg-blue-50 border-blue-200';
    if (trackerName.toLowerCase().includes('weight')) return 'bg-purple-50 border-purple-200';
    if (trackerName.toLowerCase().includes('step')) return 'bg-green-50 border-green-200';
    if (trackerName.toLowerCase().includes('calorie')) return 'bg-orange-50 border-orange-200';
    return 'bg-blue-50 border-blue-200';
  };

  const getMotivationalMessage = () => {
    if (trackerName.toLowerCase().includes('water')) return 'Stay hydrated, stay healthy!';
    if (trackerName.toLowerCase().includes('weight')) return 'Every step counts towards your goal!';
    if (trackerName.toLowerCase().includes('step')) return 'Keep moving forward!';
    if (trackerName.toLowerCase().includes('calorie')) return 'Fuel your body right!';
    return 'You can do this!';
  };

  return (
    <Card className={`${getCardStyle()} shadow-sm`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg font-medium text-gray-800">
          <Target className="w-5 h-5 text-gray-600" />
          <span>Daily Goal</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-6">
        <div className="space-y-4">
          {getTrackerIcon()}
          
          <div className="space-y-2">
            <div className="text-4xl font-bold text-gray-900">
              {dailyGoal || 0}
            </div>
            <p className="text-lg text-gray-600">
              {unit} per day
            </p>
          </div>
          
          <p className="text-sm text-gray-500 italic">
            {getMotivationalMessage()}
          </p>
        </div>

        <Button 
          onClick={onUpdateGoal}
          variant="outline"
          className="w-full h-10 border-gray-300 hover:bg-white/80"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Update Goal
        </Button>
      </CardContent>
    </Card>
  );
};