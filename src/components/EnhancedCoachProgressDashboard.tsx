import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Droplets,
  Scale,
  Activity,
  Utensils,
  Users,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { TrackerSummaryCard } from './TrackerSummaryCard';
import { ProgressChart } from './ProgressChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Users, Calendar, Droplets, Weight, Footprints, Flame, Download, TrendingUp, Search, RefreshCw, BarChart3 } from 'lucide-react';
import AdminProgressDisplaySection from './AdminProgressDisplaySection';

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
  weeklyStats?: {
    totalWorkouts: number;
    avgWater: number;
    weightChange: number;
    avgSteps: number;
  };
}

const EnhancedCoachProgressDashboard: React.FC = () => {
  const [assignedUsers, setAssignedUsers] = useState<UserProgress[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('30');
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
  }, [currentUser, userRole, roleLoading, dateRange]); // Added dateRange dependency

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
      let users = [];
      
      if (userRole === 'coach') {
        const { data: assignments } = await supabase
          .from('coach_assignments')
          .select('user_id')
          .eq('coach_id', currentUser.id)
          .eq('is_active', true);

        if (assignments && assignments.length > 0) {
          const userIds = assignments.map(a => a.user_id);
          const { data: userProfiles } = await supabase
            .from('user_profiles')
            .select('id, email, first_name, last_name')
            .in('id', userIds);
          users = userProfiles || [];
        }
      } else if (userRole === 'super_admin' || userRole === 'admin') {
        const { data: allUsersData } = await supabase
          .from('user_profiles')
          .select('id, email, first_name, last_name')
          .eq('role', 'user');
        users = allUsersData || [];
      }
      
      const usersWithProgress = await Promise.all(
        users.map(async (user) => {
          const progress = await fetchUserProgress(user.id);
          const progressData = await fetchProgressData(user.id, dateRange);
          const weeklyStats = await calculateWeeklyStats(user.id);
          return { ...user, ...progress, progressData, weeklyStats };
        })
      );
      
      setAssignedUsers(usersWithProgress);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchUserProgress = async (userId: string) => {
    try {
      // Fetch tracker configurations
      const { data: trackersData } = await supabase
        .from('progress_trackers')
        .select('*')
        .eq('user_id', userId);

      // Fetch recent progress entries (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: entriesData } = await supabase
        .from('progress_entries')
        .select(`
          *,
          progress_trackers!inner(tracker_name, unit, daily_goal)
        `)
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      // Fetch program progress from user_purchases or programs table
      const { data: purchaseData } = await supabase
        .from('user_purchases')
        .select('program_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      let program_progress = {
        current_day: 1,
        current_week: 1,
        total_days: 42,
        completed_workouts: 0
      };

      if (purchaseData && purchaseData.length > 0) {
        const purchaseDate = new Date(purchaseData[0].created_at);
        const daysSincePurchase = Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
        program_progress = {
          current_day: Math.min(daysSincePurchase + 1, 42),
          current_week: Math.min(Math.ceil((daysSincePurchase + 1) / 7), 6),
          total_days: 42,
          completed_workouts: Math.floor(daysSincePurchase * 0.8) // Estimate based on days
        };
      }

      // Process tracker data into organized format using actual entries
      const trackers = {};
      
      // Initialize default trackers
      const defaultTrackers = ['Water', 'Weight', 'Steps', 'Calories'];
      defaultTrackers.forEach(name => {
        const key = name.toLowerCase();
        const tracker = trackersData?.find(t => t.tracker_name.toLowerCase().includes(key));
        const recentEntries = entriesData?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes(key)
        ) || [];
        
        const latestEntry = recentEntries[0];
        
        trackers[key] = {
          current: latestEntry?.value || 0,
          goal: tracker?.daily_goal || (key === 'water' ? 64 : key === 'steps' ? 10000 : key === 'calories' ? 2000 : 150),
          unit: tracker?.unit || (key === 'water' ? 'oz' : key === 'weight' ? 'lbs' : key === 'steps' ? 'steps' : 'calories'),
          entries: recentEntries
        };
      });

      return { program_progress, trackers };
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return {};
    }
  };

  const fetchProgressData = async (userId: string, dateRange: string = '30') => {
    try {
      const daysBack = dateRange === 'all' ? 365 : parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data } = await supabase
        .from('progress_entries')
        .select(`
          *,
          progress_trackers!inner(tracker_name, unit, daily_goal)
        `)
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      return data || [];
    } catch (error) {
      console.error('Error fetching progress data:', error);
      return [];
    }
  };

  const calculateWeeklyStats = async (userId: string) => {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: weekEntries } = await supabase
        .from('progress_entries')
        .select(`
          *,
          progress_trackers!inner(tracker_name, unit, daily_goal)
        `)
        .eq('user_id', userId)
        .gte('date', weekAgo.toISOString().split('T')[0]);

      const waterEntries = weekEntries?.filter(e => 
        e.progress_trackers.tracker_name.toLowerCase().includes('water')
      ) || [];
      
      const stepEntries = weekEntries?.filter(e => 
        e.progress_trackers.tracker_name.toLowerCase().includes('step')
      ) || [];

      const weightEntries = weekEntries?.filter(e => 
        e.progress_trackers.tracker_name.toLowerCase().includes('weight')
      ) || [];

      // Calculate averages
      const avgWater = waterEntries.length > 0 
        ? waterEntries.reduce((sum, e) => sum + e.value, 0) / waterEntries.length 
        : 0;

      const avgSteps = stepEntries.length > 0 
        ? stepEntries.reduce((sum, e) => sum + e.value, 0) / stepEntries.length 
        : 0;

      // Calculate weight change (latest vs earliest this week)
      const weightChange = weightEntries.length >= 2 
        ? weightEntries[weightEntries.length - 1].value - weightEntries[0].value
        : 0;

      const stats = {
        totalWorkouts: Math.floor(weekEntries?.length / 4) || 0, // Estimate based on entries
        avgWater,
        weightChange,
        avgSteps
      };

      return stats;
    } catch (error) {
      console.error('Error calculating weekly stats:', error);
      return { totalWorkouts: 0, avgWater: 0, weightChange: 0, avgSteps: 0 };
    }
  };
  const exportData = () => {
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
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Progress Analytics</h1>
            <p className="text-gray-600">Track and analyze user performance</p>
          </div>
        </div>
        <Button onClick={fetchAssignedUsers} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Enhanced Filters */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportData} disabled={!selectedUser} className="gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Selection */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select User ({filteredUsers.length} found)
          </CardTitle>
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

      {/* Progress Display */}
      {selectedUserData && (
        <AdminProgressDisplaySection selectedUserData={selectedUserData} />
      )}

      {/* No Users Message */}
      {assignedUsers.length === 0 && !loading && (
        <Card className="shadow-lg border-0">
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {userRole === 'coach' ? 'No Users Assigned' : 'No Users Found'}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {userRole === 'coach' 
                ? "You don't have any users assigned to you yet. Contact your administrator to get users assigned."
                : "No users found in the system. Users need to be registered first."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedCoachProgressDashboard;