import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Droplets, Weight, Footprints, Flame, 
  Calendar, Target, CheckCircle2, Clock
} from 'lucide-react';

interface UserProgressUIProps {
  selectedUserData: any;
  userRole: string;
}

export const UserProgressUI: React.FC<UserProgressUIProps> = ({ selectedUserData, userRole }) => {
  if (!selectedUserData) return null;

  return (
    <div className="space-y-6">
      {/* User Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {selectedUserData.first_name} {selectedUserData.last_name}
              </CardTitle>
              <p className="text-gray-500">{selectedUserData.email}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">
                {userRole === 'coach' ? 'Your Student' : 'User'}
              </Badge>
              <Badge variant={selectedUserData.last_activity !== 'Never' ? 'default' : 'secondary'}>
                {selectedUserData.last_activity !== 'Never' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trackers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Daily Trackers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Water Tracker */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Water</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {selectedUserData.trackers.water.current} / {selectedUserData.trackers.water.goal} glasses
                </div>
                <div className="text-sm text-gray-500">
                  {selectedUserData.trackers.water.entries} entries today
                </div>
              </div>
            </div>

            {/* Weight Tracker */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Weight className="w-5 h-5 text-green-600" />
                <span className="font-medium">Weight</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {selectedUserData.trackers.weight.current} lbs
                </div>
                <div className="text-sm text-gray-500">
                  Weekly change: {selectedUserData.weekly_progress.weight_change > 0 ? '+' : ''}{selectedUserData.weekly_progress.weight_change} lbs
                </div>
              </div>
            </div>

            {/* Steps Tracker */}
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Footprints className="w-5 h-5 text-purple-600" />
                <span className="font-medium">Steps</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {selectedUserData.trackers.steps.current.toLocaleString()} / {selectedUserData.trackers.steps.goal.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  Weekly avg: {selectedUserData.weekly_progress.steps_avg.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Calories Tracker */}
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-600" />
                <span className="font-medium">Calories</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {selectedUserData.trackers.calories.current} / {selectedUserData.trackers.calories.goal} cal
                </div>
                <div className="text-sm text-gray-500">
                  Weekly avg: {selectedUserData.weekly_progress.calories_avg} cal
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Program Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Program Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Overall Completion</span>
                <span className="font-semibold">
                  {selectedUserData.programs.completion_rate.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={selectedUserData.programs.completion_rate} 
                className="h-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedUserData.programs.total}
                </div>
                <div className="text-sm text-gray-500">Total Programs</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {selectedUserData.programs.completed}
                </div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
            </div>

            {selectedUserData.coach_programs.assigned > 0 && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span className="font-medium">Coach Programs</span>
                </div>
                <div className="text-sm text-gray-600">
                  {selectedUserData.coach_programs.assigned} assigned
                  {selectedUserData.coach_programs.coach_name && (
                    <span className="ml-2">by {selectedUserData.coach_programs.coach_name}</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              Last activity: {selectedUserData.last_activity !== 'Never' ? 
                new Date(selectedUserData.last_activity).toLocaleDateString() : 'Never'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};