import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';

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

export const TrackerSummaryCard: React.FC<TrackerSummaryProps> = ({ 
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

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-blue-900">
          {trackerName} Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Goal Progress</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {weeklyStats.daysGoalMet}/{weeklyStats.totalDays}
            </div>
            <Progress value={goalPercentage} className="h-2" />
            <p className="text-xs text-blue-700">
              {goalPercentage.toFixed(0)}% of days completed
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Average</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {weeklyStats.averageValue.toFixed(1)}
            </div>
            <p className="text-xs text-blue-700">{weeklyStats.unit} per day</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
          <span className="text-sm font-medium">Weekly Change:</span>
          <div className="flex items-center gap-1">
            {isPositiveTrend ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={`font-semibold ${
              isPositiveTrend ? 'text-green-600' : 'text-red-600'
            }`}>
              {getChangeLabel()} {Math.abs(weeklyStats.weeklyChange).toFixed(1)} {weeklyStats.unit}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};