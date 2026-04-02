import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Users, Calendar, Droplets, Weight, Footprints, Flame, Download, TrendingUp } from 'lucide-react';
import EnhancedProgressChart from './EnhancedProgressChart';
import ProgressFilters from './ProgressFilters';

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
  progressData?: any[];
}

const CoachProgressDashboard: React.FC = () => {
  const [assignedUsers, setAssignedUsers] = useState<UserProgress[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('30');
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { userRole, permissions, loading: roleLoading } = useRolePermissions();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && !roleLoading && userRole) {
      fetchAssignedUsers();
    }
  }, [currentUser, userRole, roleLoading]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser({ ...user, ...profile });
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchAssignedUsers = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      console.log('Current user:', currentUser);
      console.log('User role:', userRole);
      
      let users = [];
      
      if (userRole === 'coach') {
        // First get the assignments
        const { data: assignments, error: assignError } = await supabase
          .from('coach_assignments')
          .select('user_id')
          .eq('coach_id', currentUser.id)
          .eq('is_active', true);

        console.log('Coach assignments:', assignments);
        console.log('Assignment error:', assignError);

        if (assignments && assignments.length > 0) {
          const userIds = assignments.map(a => a.user_id);
          
          // Then get the user profiles

          const { data: userProfiles, error: profileError } = await supabase
            .from('user_profiles')
            .select('id, email, first_name, last_name')
            .in('id', userIds);

          console.log('User profiles:', userProfiles);
          console.log('Profile error:', profileError);

          users = userProfiles || [];
        }
      } else if (userRole === 'super_admin' || userRole === 'admin') {
        const { data: allUsersData } = await supabase
          .from('user_profiles')
          .select('id, email, first_name, last_name')
          .eq('role', 'user');
        
        users = allUsersData || [];
      }
      
      console.log('Found users:', users);
      
      const usersWithProgress = await Promise.all(
        users.map(async (user) => {
          const progress = await fetchUserProgress(user.id);
          const progressData = await fetchProgressData(user.id);
          return { ...user, ...progress, progressData };
        })
      );
      
      console.log('Users with progress:', usersWithProgress);
      setAssignedUsers(usersWithProgress);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async (userId: string) => {
    try {
      const { data: trackerData, error } = await supabase
        .from('progress_trackers')
        .select('*')
        .eq('user_id', userId);

      console.log('Tracker data for user', userId, ':', trackerData);
      console.log('Tracker error:', error);

      const program_progress = {
        current_day: 1,
        current_week: 1,
        total_days: 42,
        completed_workouts: 0
      };

      // Create a more flexible mapping for tracker names
      const trackers = trackerData?.reduce((acc, tracker) => {
        let key = tracker.tracker_name.toLowerCase();
        
        // Map tracker names to standard keys
        if (key.includes('water')) key = 'water';
        else if (key.includes('weight')) key = 'weight';  
        else if (key.includes('step')) key = 'steps';
        else if (key.includes('calorie')) key = 'calories';
        
        acc[key] = {
          current: parseFloat(tracker.current_value) || 0,
          goal: parseFloat(tracker.daily_goal) || 0,
          unit: tracker.unit || ''
        };
        return acc;
      }, {});

      console.log('Processed trackers:', trackers);
      return { program_progress, trackers };
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return {};
    }
  };

  const fetchProgressData = async (userId: string) => {
    try {
      const daysBack = dateRange === 'all' ? 365 : parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data } = await supabase
        .from('progress_trackers')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      return data || [];
    } catch (error) {
      console.error('Error fetching progress data:', error);
      return [];
    }
  };

  const exportData = () => {
    const selectedUserData = assignedUsers.find(user => user.id === selectedUser);
    if (!selectedUserData) return;

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Weight,Water,Steps,Calories,Workouts\n"
      + (selectedUserData.progressData || []).map(row => 
          `${row.created_at},${row.weight || 0},${row.water || 0},${row.steps || 0},${row.calories || 0},${row.workouts || 0}`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${(selectedUserData.first_name && selectedUserData.last_name) ? `${selectedUserData.first_name}_${selectedUserData.last_name}` : selectedUserData.email}_progress.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedUserData = assignedUsers.find(user => user.id === selectedUser);
  const filteredUsers = assignedUsers.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">User Progress Dashboard</h1>
      </div>

      <ProgressFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedMetric={selectedMetric}
        onMetricChange={setSelectedMetric}
        onExport={exportData}
        onRefresh={fetchAssignedUsers}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <Card>
        <CardHeader>
          <CardTitle>Select User</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a user to view their progress" />
            </SelectTrigger>
            <SelectContent>
               {filteredUsers.map((user) => {
                 const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
                 return (
                   <SelectItem key={user.id} value={user.id}>
                     {displayName}
                   </SelectItem>
                 );
               })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedUserData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  6-Week Program Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Current Week:</span>
                  <Badge variant="outline">
                    Week {selectedUserData.program_progress?.current_week || 1}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>
                      {selectedUserData.program_progress?.current_day || 1}/42 days
                    </span>
                  </div>
                  <Progress 
                    value={((selectedUserData.program_progress?.current_day || 1) / 42) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Trackers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedUserData.trackers && Object.keys(selectedUserData.trackers).length > 0 ? (
                  <>
                    {selectedUserData.trackers.water && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">Water</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {selectedUserData.trackers.water.current} / {selectedUserData.trackers.water.goal} {selectedUserData.trackers.water.unit}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedUserData.trackers.weight && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Weight className="w-5 h-5 text-green-600" />
                          <span className="font-medium">Weight</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {selectedUserData.trackers.weight.current} {selectedUserData.trackers.weight.unit}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedUserData.trackers.steps && (
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Footprints className="w-5 h-5 text-purple-600" />
                          <span className="font-medium">Steps</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {selectedUserData.trackers.steps.current} / {selectedUserData.trackers.steps.goal} {selectedUserData.trackers.steps.unit}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedUserData.trackers.calories && (
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Flame className="w-5 h-5 text-orange-600" />
                          <span className="font-medium">Calories</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {selectedUserData.trackers.calories.current} / {selectedUserData.trackers.calories.goal} {selectedUserData.trackers.calories.unit}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No progress tracked yet for this user.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {selectedUserData.progressData && selectedUserData.progressData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <EnhancedProgressChart
                data={selectedUserData.progressData}
                type="weight"
                title="Weight Progress"
                color="#10b981"
                unit="lbs"
              />
              <EnhancedProgressChart
                data={selectedUserData.progressData}
                type="water"
                title="Water Intake"
                color="#3b82f6"
                unit="glasses"
              />
              <EnhancedProgressChart
                data={selectedUserData.progressData}
                type="steps"
                title="Daily Steps"
                color="#8b5cf6"
                unit="steps"
              />
            </div>
          )}
        </>
      )}

      {assignedUsers.length === 0 && !loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {userRole === 'coach' ? 'No Users Assigned' : 'No Users Found'}
            </h3>
            <p className="text-gray-500">
              {userRole === 'coach' 
                ? "You don't have any users assigned to you yet."
                : "No users found in the system."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoachProgressDashboard;