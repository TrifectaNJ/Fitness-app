import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, BarChart3, Droplets, Scale, Activity, Utensils } from 'lucide-react';

interface TrackerSummaryProps {
  trackerName: string;
  weeklyStats: {
    daysGoalMet: number;
    totalDays: number;
    averageValue: number;
    weeklyChange: number;
    unit: string;
  };
}

export const TrackerSummaryCardRedesigned: React.FC<TrackerSummaryProps> = ({ 
  trackerName, 
  weeklyStats 
}) => {
  const goalPercentage = (weeklyStats.daysGoalMet / weeklyStats.totalDays) * 100;
  const isPositiveTrend = weeklyStats.weeklyChange >= 0;
  
  const getChangeLabel = () => {
    if (trackerName.toLowerCase().includes('weight')) {
      return weeklyStats.weeklyChange < 0 ? 'Lost' : 'Gained';
    }
    return weeklyStats.weeklyChange >= 0 ? 'Increased' : 'Decreased';
  };

  const getTrackerIcon = () => {
    if (trackerName.toLowerCase().includes('water')) return <Droplets className="w-5 h-5 text-blue-500" />;
    if (trackerName.toLowerCase().includes('weight')) return <Scale className="w-5 h-5 text-purple-500" />;
    if (trackerName.toLowerCase().includes('step')) return <Activity className="w-5 h-5 text-green-500" />;
    if (trackerName.toLowerCase().includes('calorie')) return <Utensils className="w-5 h-5 text-orange-500" />;
    return <BarChart3 className="w-5 h-5 text-indigo-500" />;
  };

  const getGradientClass = () => {
    if (trackerName.toLowerCase().includes('water')) return 'from-blue-50 via-white to-blue-50/30 border-blue-100';
    if (trackerName.toLowerCase().includes('weight')) return 'from-purple-50 via-white to-purple-50/30 border-purple-100';
    if (trackerName.toLowerCase().includes('step')) return 'from-green-50 via-white to-green-50/30 border-green-100';
    if (trackerName.toLowerCase().includes('calorie')) return 'from-orange-50 via-white to-orange-50/30 border-orange-100';
    return 'from-indigo-50 via-white to-indigo-50/30 border-indigo-100';
  };

  const getProgressColor = () => {
    if (goalPercentage >= 80) return 'bg-green-500';
    if (goalPercentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className={`bg-gradient-to-br ${getGradientClass()} shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
          {getTrackerIcon()}
          <span>Weekly Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Goal Achievement</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {weeklyStats.daysGoalMet}
                </span>
                <span className="text-lg text-gray-500">
                  / {weeklyStats.totalDays} days
                </span>
              </div>
              <Progress 
                value={goalPercentage} 
                className="h-2.5 bg-gray-100" 
              />
              <p className="text-sm text-gray-600 font-medium">
                {goalPercentage.toFixed(0)}% completion rate
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Daily Average</span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {weeklyStats.averageValue.toFixed(1)}
              </div>
              <p className="text-sm text-gray-600">
                {weeklyStats.unit} per day
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-gray-100">
          <span className="text-sm font-medium text-gray-700">Weekly Trend:</span>
          <div className="flex items-center gap-2">
            {isPositiveTrend ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`font-semibold text-sm ${
              isPositiveTrend ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {getChangeLabel()} {Math.abs(weeklyStats.weeklyChange).toFixed(1)} {weeklyStats.unit}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};