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

export const BeginnerFriendlyTrackerGoal: React.FC<TrackerGoalCardProps> = ({
  trackerName,
  dailyGoal,
  unit,
  onUpdateGoal
}) => {
  const isWaterTracker = trackerName.toLowerCase().includes('water');
  const isWeightTracker = trackerName.toLowerCase().includes('weight');
  const isStepTracker = trackerName.toLowerCase().includes('step');
  const isCalorieTracker = trackerName.toLowerCase().includes('calorie');

  const getTrackerConfig = () => {
    if (isWaterTracker) return {
      name: 'Water',
      icon: <Droplets className="w-12 h-12 text-blue-600" />,
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      goalText: 'Daily Water Goal',
      motivationText: 'Stay hydrated every day! 💧',
      emoji: '💧',
      description: 'per day'
    };
    if (isWeightTracker) return {
      name: 'Weight',
      icon: <Scale className="w-12 h-12 text-purple-600" />,
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      goalText: 'Target Weight',
      motivationText: 'Small steps, big results! ⚖️',
      emoji: '⚖️',
      description: 'target'
    };
    if (isStepTracker) return {
      name: 'Steps',
      icon: <Activity className="w-12 h-12 text-green-600" />,
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-200',
      goalText: 'Daily Step Goal',
      motivationText: 'Keep moving forward! 👟',
      emoji: '👟',
      description: 'per day'
    };
    if (isCalorieTracker) return {
      name: 'Calories',
      icon: <Utensils className="w-12 h-12 text-orange-600" />,
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      borderColor: 'border-orange-200',
      goalText: 'Daily Calorie Goal',
      motivationText: 'Fuel your body right! 🍎',
      emoji: '🍎',
      description: 'per day'
    };
    return {
      name: trackerName,
      icon: <Target className="w-12 h-12 text-gray-600" />,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      goalText: 'Daily Goal',
      motivationText: 'You can do this! 💪',
      emoji: '📊',
      description: 'per day'
    };
  };

  const config = getTrackerConfig();

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2 shadow-lg`}>
      <CardHeader className="pb-4 text-center">
        <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold text-gray-800">
          <Target className="w-6 h-6 text-gray-600" />
          <span>Your Goal</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-6">
        {/* Goal Icon */}
        <div className="flex justify-center">
          {config.icon}
        </div>
        
        {/* Goal Value */}
        <div className="space-y-3">
          <div className="text-6xl font-bold text-gray-900">
            {dailyGoal || 0}
          </div>
          <div className="space-y-1">
            <p className="text-xl font-semibold text-gray-700">
              {isWeightTracker ? `${unit} target` : `${unit} ${config.description}`}
            </p>
            <p className="text-base text-gray-600">
              {config.goalText}
            </p>
          </div>
        </div>

        {/* Motivation Message */}
        <div className="bg-white/70 rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-base text-gray-700 font-medium">
            {config.motivationText}
          </p>
        </div>

        {/* Change Goal Button */}
        <Button 
          onClick={onUpdateGoal}
          variant="outline"
          className="w-full h-12 border-2 border-gray-300 hover:bg-white/80 font-semibold text-base rounded-xl hover:border-gray-400 transition-all duration-200"
        >
          <Edit3 className="w-5 h-5 mr-2" />
          Change Goal
        </Button>
      </CardContent>
    </Card>
  );
};