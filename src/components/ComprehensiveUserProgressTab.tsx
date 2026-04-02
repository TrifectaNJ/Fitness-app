import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  Search, RefreshCw, TrendingUp, User, ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { subDays } from 'date-fns';
import UserProgressDetail from './UserProgressDetail';
interface UserProgressTabProps {
  userRole?: string;
  currentUserId?: string;
}

interface TrackerData {
  water: any[];
  weight: any[];
  steps: any[];
  calories: any[];
}

interface WorkoutProgress {
  programId: string;
  programName: string;
  totalDays: number;
  completedDays: number;
  percentage: number;
  type: 'program' | 'coach_program';
  lastActivity?: string;
}

export const ComprehensiveUserProgressTab: React.FC<UserProgressTabProps> = ({ 
  userRole = 'user', 
  currentUserId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('30');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [trackerData, setTrackerData] = useState<TrackerData | null>(null);
  const [workoutProgress, setWorkoutProgress] = useState<WorkoutProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchUsers();
  }, [userRole, currentUserId]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserProgress(selectedUser);
    }
  }, [selectedUser, dateFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('user_profiles').select('*');
      
      // Role-based filtering
      if (userRole === 'coach' && currentUserId) {
        const { data: assignments } = await supabase
          .from('user_assignments')
          .select('assigned_user_id')
          .eq('coach_id', currentUserId);
        
        const userIds = assignments?.map(a => a.assigned_user_id) || [];
        if (userIds.length > 0) {
          query = query.in('id', userIds);
        } else {
          setUsers([]);
          setLoading(false);
          return;
        }
      }
      // Admin and Super Admin can see all users
      
      const { data } = await query.order('created_at', { ascending: false });
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async (userId: string) => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), parseInt(dateFilter));

      // Fetch tracker data
      const [water, weight, steps, calories] = await Promise.all([
        supabase
          .from('water_intake')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate.toISOString())
          .order('date', { ascending: false }),
        supabase
          .from('weight_entries')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate.toISOString())
          .order('date', { ascending: false }),
        supabase
          .from('steps_entries')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate.toISOString())
          .order('date', { ascending: false }),
        supabase
          .from('calorie_entries')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate.toISOString())
          .order('date', { ascending: false })
      ]);

      setTrackerData({
        water: water.data || [],
        weight: weight.data || [],
        steps: steps.data || [],
        calories: calories.data || []
      });

      // Fetch workout progress
      await fetchWorkoutProgress(userId);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkoutProgress = async (userId: string) => {
    try {
      // Fetch user's assigned programs
      const { data: userPrograms } = await supabase
        .from('user_programs')
        .select(`
          *,
          program:programs(*),
          coach_program:coach_programs(*)
        `)
        .eq('user_id', userId);

      if (!userPrograms) return;

      const progressList: WorkoutProgress[] = [];

      for (const up of userPrograms) {
        const program = up.program || up.coach_program;
        if (!program) continue;

        // Get completion data
        const { data: completions } = await supabase
          .from('workout_completions')
          .select('*')
          .eq('user_id', userId)
          .eq('program_id', up.program_id || up.coach_program_id);

        const totalDays = program.weeks * 7;
        const completedDays = completions?.length || 0;
        const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

        progressList.push({
          programId: program.id,
          programName: program.name,
          totalDays,
          completedDays,
          percentage,
          type: up.program_id ? 'program' : 'coach_program',
          lastActivity: completions?.[0]?.completed_at
        });
      }

      setWorkoutProgress(progressList);
    } catch (error) {
      console.error('Error fetching workout progress:', error);
    }
  };

  const handleRefresh = () => {
    if (selectedUser) {
      fetchUserProgress(selectedUser);
    } else {
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUserData = users.find(u => u.id === selectedUser);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Progress Tracking</h1>
                <p className="text-sm text-gray-500">
                  {userRole === 'coach' ? 'View your assigned users progress' : 'View all users progress'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleRefresh} variant="outline" size="icon">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {!selectedUser && (
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail View */}
      {selectedUser && selectedUserData && (
        <UserProgressDetail
          user={selectedUserData}
          trackerData={trackerData}
          workoutProgress={workoutProgress}
          onBack={() => setSelectedUser(null)}
        />
      )}

      {/* User Selection Grid */}
      {!selectedUser && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((user) => (
            <Card 
              key={user.id} 
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
              onClick={() => setSelectedUser(user.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user.full_name?.[0] || user.email?.[0] || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{user.full_name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <Badge variant="outline" className="mt-1">
                      {user.role || 'User'}
                    </Badge>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!selectedUser && filteredUsers.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-500">
              {userRole === 'coach' 
                ? "You don't have any assigned users yet." 
                : "No users match your search criteria."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComprehensiveUserProgressTab;