import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Droplets, Weight, Footprints, Flame } from 'lucide-react';

interface TrackerData {
  water: any[];
  weight: any[];
  steps: any[];
  calories: any[];
}

interface UserProgressChartsProps {
  trackerData: TrackerData;
  workoutProgress: any[];
  weeklyStats: any;
}

export const UserProgressCharts: React.FC<UserProgressChartsProps> = ({
  trackerData,
  workoutProgress,
  weeklyStats
}) => {
  const getDataSummary = (data: any[], label: string) => {
    if (data.length === 0) return { latest: 0, avg: 0, trend: 'stable' };
    
    const latest = data[0]?.value || 0;
    const avg = data.reduce((sum, item) => sum + (item.value || 0), 0) / data.length;
    const trend = data.length > 1 && latest > (data[1]?.value || 0) ? 'up' : 'down';
    
    return { latest, avg: Math.round(avg), trend };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Water Intake Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            Water Intake Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trackerData.water.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {getDataSummary(trackerData.water, 'Water').latest}L
                  </span>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-sm text-gray-500">
                  <p>Average: {getDataSummary(trackerData.water, 'Water').avg}L</p>
                  <p>{trackerData.water.length} entries in period</p>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No water data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Steps Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Footprints className="h-4 w-4 text-green-500" />
            Daily Steps Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trackerData.steps.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-green-600">
                    {getDataSummary(trackerData.steps, 'Steps').latest.toLocaleString()}
                  </span>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-sm text-gray-500">
                  <p>Average: {getDataSummary(trackerData.steps, 'Steps').avg.toLocaleString()}</p>
                  <p>{trackerData.steps.length} entries in period</p>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No steps data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weight Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Weight className="h-4 w-4 text-purple-500" />
            Weight Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trackerData.weight.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-purple-600">
                    {getDataSummary(trackerData.weight, 'Weight').latest}kg
                  </span>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-sm text-gray-500">
                  <p>Average: {getDataSummary(trackerData.weight, 'Weight').avg}kg</p>
                  <p>{trackerData.weight.length} entries in period</p>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No weight data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workout Progress Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Program Completion Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workoutProgress.length > 0 ? (
              <>
                <div className="text-2xl font-bold text-indigo-600">
                  {Math.round(workoutProgress.reduce((sum, p) => sum + p.percentage, 0) / workoutProgress.length)}%
                </div>
                <div className="text-sm text-gray-500">
                  <p>Average completion across {workoutProgress.length} programs</p>
                  <p>
                    {workoutProgress.filter(p => p.percentage >= 80).length} programs nearly complete
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No workout programs assigned
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};