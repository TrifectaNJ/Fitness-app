import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Activity, 
  TrendingUp,
  BarChart3,
  Clock,
  Target,
  Bell
} from 'lucide-react';
import { AdminUserProgressCard } from './AdminUserProgressCard';
import { useRealtimeTrackerProgress } from '@/hooks/useRealtimeTrackerProgress';
import { useCoachNotifications } from '@/hooks/useCoachNotifications';

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
    water: { current: number; goal: number; unit: string; entries?: any[] };
    weight: { current: number; goal: number; unit: string; entries?: any[] };
    steps: { current: number; goal: number; unit: string; entries?: any[] };
    calories: { current: number; goal: number; unit: string; entries?: any[] };
  };
  weeklyStats?: {
    totalWorkouts: number;
    avgWater: number;
    weightChange: number;
    avgSteps: number;
    avgCalories?: number;
  };
}

interface AdminProgressDisplaySectionProps {
  selectedUserData: UserProgress;
}

const AdminProgressDisplaySection: React.FC<AdminProgressDisplaySectionProps> = ({ 
  selectedUserData 
}) => {
  const [realtimeData, setRealtimeData] = useState(selectedUserData);
  const { trackerEntries, goalAchievements } = useRealtimeTrackerProgress(selectedUserData.id);
  const { notifications, unreadCount } = useCoachNotifications('admin');

  // Update data when real-time entries come in
  useEffect(() => {
    if (trackerEntries.length > 0) {
      // Update tracker data with latest entries
      const updatedTrackers = { ...selectedUserData.trackers };
      
      trackerEntries.forEach(entry => {
        // Update current values based on latest entries
        const today = new Date().toISOString().split('T')[0];
        const todayEntries = trackerEntries.filter(e => e.date === today);
        
        // This would need proper tracker type mapping from database
        // For now, we'll trigger a re-render to show real-time updates
      });
      
      setRealtimeData({
        ...selectedUserData,
        trackers: updatedTrackers
      });
    }
  }, [trackerEntries, selectedUserData]);

  const displayName = `${selectedUserData.first_name || ''} ${selectedUserData.last_name || ''}`.trim() 
    || selectedUserData.email;

  const calculateWeeklyChange = (trackerType: string) => {
    const stats = selectedUserData.weeklyStats;
    if (!stats) return 0;
    
    switch (trackerType) {
      case 'water':
        return stats.avgWater - (selectedUserData.trackers?.water?.goal || 64) * 0.8;
      case 'weight':
        return stats.weightChange;
      case 'steps':
        return stats.avgSteps - (selectedUserData.trackers?.steps?.goal || 10000) * 0.8;
      case 'calories':
        return (stats.avgCalories || 0) - (selectedUserData.trackers?.calories?.goal || 2000) * 0.8;
      default:
        return 0;
    }
  };

  // Show real-time notifications
  useEffect(() => {
    if (goalAchievements.length > 0) {
      const latestAchievement = goalAchievements[0];
      // Could show toast notification here for goal achievements
    }
  }, [goalAchievements]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{displayName}</h2>
              <p className="text-indigo-100 text-sm">{selectedUserData.email}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                Day {selectedUserData.program_progress?.current_day || 1}
              </div>
              <div className="text-indigo-100 text-sm">
                Week {selectedUserData.program_progress?.current_week || 1} of 6
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="trackers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="trackers" className="flex items-center gap-2 text-sm font-medium">
            <Target className="w-4 h-4" />
            Daily Trackers
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2 text-sm font-medium">
            <BarChart3 className="w-4 h-4" />
            Weekly Progress
          </TabsTrigger>
          <TabsTrigger value="program" className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4" />
            Program Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trackers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedUserData.trackers?.water && (
              <AdminUserProgressCard
                trackerType="water"
                data={selectedUserData.trackers.water}
                weeklyChange={calculateWeeklyChange('water')}
                dailyAverage={selectedUserData.weeklyStats?.avgWater || 0}
              />
            )}
            
            {selectedUserData.trackers?.weight && (
              <AdminUserProgressCard
                trackerType="weight"
                data={selectedUserData.trackers.weight}
                weeklyChange={selectedUserData.weeklyStats?.weightChange || 0}
                dailyAverage={selectedUserData.trackers.weight.current}
              />
            )}
            
            {selectedUserData.trackers?.steps && (
              <AdminUserProgressCard
                trackerType="steps"
                data={selectedUserData.trackers.steps}
                weeklyChange={calculateWeeklyChange('steps')}
                dailyAverage={selectedUserData.weeklyStats?.avgSteps || 0}
              />
            )}
            
            {selectedUserData.trackers?.calories && (
              <AdminUserProgressCard
                trackerType="calories"
                data={selectedUserData.trackers.calories}
                weeklyChange={calculateWeeklyChange('calories')}
                dailyAverage={selectedUserData.weeklyStats?.avgCalories || 0}
              />
            )}
          </div>

          {(!selectedUserData.trackers || Object.keys(selectedUserData.trackers).length === 0) && (
            <Card className="shadow-lg border-0">
              <CardContent className="p-8 text-center">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Progress Tracked</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  This user hasn't started tracking their daily progress yet. 
                  Encourage them to use the tracker tools to monitor their fitness journey.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Avg Water</p>
                    <p className="text-2xl font-bold">
                      {selectedUserData.weeklyStats?.avgWater?.toFixed(1) || 0} oz
                    </p>
                  </div>
                  <div className="text-blue-200">💧</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Weight Change</p>
                    <p className="text-2xl font-bold">
                      {selectedUserData.weeklyStats?.weightChange > 0 ? '+' : ''}
                      {selectedUserData.weeklyStats?.weightChange?.toFixed(1) || 0} lbs
                    </p>
                  </div>
                  <div className="text-purple-200">⚖️</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Avg Steps</p>
                    <p className="text-2xl font-bold">
                      {Math.round(selectedUserData.weeklyStats?.avgSteps || 0)}
                    </p>
                  </div>
                  <div className="text-green-200">👟</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Workouts</p>
                    <p className="text-2xl font-bold">
                      {selectedUserData.weeklyStats?.totalWorkouts || 0}
                    </p>
                  </div>
                  <div className="text-orange-200">🏋️</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="program" className="space-y-6">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                6-Week Program Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-lg">
                    <span className="font-medium text-gray-700">Current Week:</span>
                    <Badge className="bg-indigo-600 text-white">
                      Week {selectedUserData.program_progress?.current_week || 1}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                    <span className="font-medium text-gray-700">Current Day:</span>
                    <Badge className="bg-purple-600 text-white">
                      Day {selectedUserData.program_progress?.current_day || 1}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-gray-800 mb-2">
                      {selectedUserData.program_progress?.completed_workouts || 0}
                    </div>
                    <div className="text-sm text-gray-600">Completed Workouts</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium text-gray-700">
                  <span>Overall Progress</span>
                  <span>
                    {selectedUserData.program_progress?.current_day || 1}/42 days
                  </span>
                </div>
                <Progress 
                  value={((selectedUserData.program_progress?.current_day || 1) / 42) * 100} 
                  className="h-4"
                />
                <div className="text-center text-sm text-gray-600">
                  {(((selectedUserData.program_progress?.current_day || 1) / 42) * 100).toFixed(1)}% Complete
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminProgressDisplaySection;