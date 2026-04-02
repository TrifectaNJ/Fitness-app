import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Droplets, Weight, Footprints, Flame, TrendingUp, Activity } from 'lucide-react';

interface UserProgress {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  program_progress?: {
    current_day: number;
    current_week: number;
    total_days: number;
    completed_workouts: number;
  };
  trackers?: {
    water: { current: number; goal: number; unit: string };
    weight: { current: number; goal: number; unit: string };
    steps: { current: number; goal: number; unit: string };
    calories: { current: number; goal: number; unit: string };
  };
  weeklyStats?: {
    totalWorkouts: number;
    avgWater: number;
    weightChange: number;
    avgSteps: number;
  };
}

interface ProgressDisplaySectionProps {
  selectedUserData: UserProgress;
}

const ProgressDisplaySection: React.FC<ProgressDisplaySectionProps> = ({ selectedUserData }) => {
  return (
    <>
      {/* Weekly Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Workouts</p>
                <p className="text-2xl font-bold">{selectedUserData.weeklyStats?.totalWorkouts || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Weight Change</p>
                <p className="text-2xl font-bold">
                  {selectedUserData.weeklyStats?.weightChange > 0 ? '+' : ''}
                  {selectedUserData.weeklyStats?.weightChange?.toFixed(1) || 0} lbs
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Avg Steps</p>
                <p className="text-2xl font-bold">{Math.round(selectedUserData.weeklyStats?.avgSteps || 0)}</p>
              </div>
              <Footprints className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Avg Water</p>
                <p className="text-2xl font-bold">{selectedUserData.weeklyStats?.avgWater?.toFixed(1) || 0}</p>
              </div>
              <Droplets className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program Progress & Daily Trackers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              6-Week Program Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Current Week:</span>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                Week {selectedUserData.program_progress?.current_week || 1}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Current Day:</span>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Day {selectedUserData.program_progress?.current_day || 1}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span className="font-semibold">
                  {selectedUserData.program_progress?.current_day || 1}/42 days
                </span>
              </div>
              <Progress 
                value={((selectedUserData.program_progress?.current_day || 1) / 42) * 100} 
                className="h-3"
              />
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed Workouts:</span>
                <span className="font-semibold text-lg">
                  {selectedUserData.program_progress?.completed_workouts || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-t-lg">
            <CardTitle>Daily Trackers</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {selectedUserData.trackers && Object.keys(selectedUserData.trackers).length > 0 ? (
              <>
                {selectedUserData.trackers.water && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-3">
                      <Droplets className="w-6 h-6 text-blue-600" />
                      <span className="font-medium text-gray-700">Water</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {selectedUserData.trackers.water.current} / {selectedUserData.trackers.water.goal} {selectedUserData.trackers.water.unit}
                      </div>
                      <Progress 
                        value={(selectedUserData.trackers.water.current / selectedUserData.trackers.water.goal) * 100} 
                        className="w-20 h-2 mt-1"
                      />
                    </div>
                  </div>
                )}
                {selectedUserData.trackers.weight && (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-3">
                      <Weight className="w-6 h-6 text-green-600" />
                      <span className="font-medium text-gray-700">Weight</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {selectedUserData.trackers.weight.current} {selectedUserData.trackers.weight.unit}
                      </div>
                    </div>
                  </div>
                )}
                {selectedUserData.trackers.steps && (
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-3">
                      <Footprints className="w-6 h-6 text-purple-600" />
                      <span className="font-medium text-gray-700">Steps</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {selectedUserData.trackers.steps.current} / {selectedUserData.trackers.steps.goal}
                      </div>
                      <Progress 
                        value={(selectedUserData.trackers.steps.current / selectedUserData.trackers.steps.goal) * 100} 
                        className="w-20 h-2 mt-1"
                      />
                    </div>
                  </div>
                )}
                {selectedUserData.trackers.calories && (
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex items-center gap-3">
                      <Flame className="w-6 h-6 text-orange-600" />
                      <span className="font-medium text-gray-700">Calories</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {selectedUserData.trackers.calories.current} / {selectedUserData.trackers.calories.goal}
                      </div>
                      <Progress 
                        value={(selectedUserData.trackers.calories.current / selectedUserData.trackers.calories.goal) * 100} 
                        className="w-20 h-2 mt-1"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-lg font-medium">No progress tracked yet</p>
                <p className="text-sm">This user hasn't started tracking their progress.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ProgressDisplaySection;