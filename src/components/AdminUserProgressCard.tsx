import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Droplets, 
  Scale, 
  Activity, 
  Utensils,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target
} from 'lucide-react';

interface TrackerData {
  current: number;
  goal: number;
  unit: string;
  entries?: any[];
}

interface UserProgressCardProps {
  trackerType: 'water' | 'weight' | 'steps' | 'calories';
  data: TrackerData;
  weeklyChange?: number;
  dailyAverage?: number;
}

export const AdminUserProgressCard: React.FC<UserProgressCardProps> = ({
  trackerType,
  data,
  weeklyChange = 0,
  dailyAverage = 0
}) => {
  const getTrackerConfig = () => {
    switch (trackerType) {
      case 'water':
        return {
          name: 'Water',
          icon: <Droplets className="w-6 h-6 text-blue-600" />,
          bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
          borderColor: 'border-blue-200',
          progressColor: 'bg-blue-600',
          emoji: '💧',
          unit: 'oz',
          showGoal: true
        };
      case 'weight':
        return {
          name: 'Weight',
          icon: <Scale className="w-6 h-6 text-purple-600" />,
          bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
          borderColor: 'border-purple-200',
          progressColor: 'bg-purple-600',
          emoji: '⚖️',
          unit: 'lbs',
          showGoal: false
        };
      case 'steps':
        return {
          name: 'Steps',
          icon: <Activity className="w-6 h-6 text-green-600" />,
          bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
          borderColor: 'border-green-200',
          progressColor: 'bg-green-600',
          emoji: '👟',
          unit: 'steps',
          showGoal: true
        };
      case 'calories':
        return {
          name: 'Calories',
          icon: <Utensils className="w-6 h-6 text-orange-600" />,
          bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
          borderColor: 'border-orange-200',
          progressColor: 'bg-orange-600',
          emoji: '🍎',
          unit: 'calories',
          showGoal: true
        };
      default:
        return {
          name: 'Tracker',
          icon: <Target className="w-6 h-6 text-gray-600" />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          progressColor: 'bg-gray-600',
          emoji: '📊',
          unit: data.unit,
          showGoal: true
        };
    }
  };

  const config = getTrackerConfig();
  const progressPercentage = config.showGoal ? (data.current / data.goal) * 100 : 0;
  const isWeightTracker = trackerType === 'weight';

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2 shadow-lg hover:shadow-xl transition-all duration-200`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.emoji}</span>
            <span className="text-lg font-bold text-gray-800">{config.name}</span>
          </div>
          {!isWeightTracker && (
            <Badge variant="outline" className="bg-white/70 text-gray-700 border-gray-300">
              Daily Goal
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Value Display */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-gray-800">
            {data.current.toLocaleString()}
            <span className="text-lg text-gray-600 ml-1">{config.unit}</span>
          </div>
          
          {config.showGoal && (
            <div className="text-sm text-gray-600">
              of {data.goal.toLocaleString()} {config.unit} goal
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {config.showGoal && (
          <div className="space-y-2">
            <Progress 
              value={Math.min(progressPercentage, 100)} 
              className="h-3 bg-white/70"
            />
            <div className="text-center text-sm text-gray-600 font-medium">
              {progressPercentage.toFixed(1)}% Complete
            </div>
          </div>
        )}

        {/* Weekly Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
              <Calendar className="w-4 h-4" />
              Daily Avg
            </div>
            <div className="font-semibold text-gray-800">
              {dailyAverage.toFixed(1)} {config.unit}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
              {weeklyChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              Weekly Change
            </div>
            <div className={`font-semibold ${weeklyChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {weeklyChange >= 0 ? '+' : ''}{weeklyChange.toFixed(1)} {config.unit}
            </div>
          </div>
        </div>

        {/* Entry Count */}
        <div className="text-center pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {data.entries?.length || 0} entries this month
          </div>
        </div>
      </CardContent>
    </Card>
  );
};