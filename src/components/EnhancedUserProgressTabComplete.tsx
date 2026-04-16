import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ArrowLeft, Droplets, Weight, Footprints, 
  Flame, Dumbbell, Target, CheckCircle, BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { subDays, format } from 'date-fns';
import { UserSelectionGrid } from './UserSelectionGrid';
import { UserProgressCharts } from './UserProgressCharts';
import { ProgressFilterControls } from './ProgressFilterControls';
import { useRealtimeTrackerProgress } from '@/hooks/useRealtimeTrackerProgress';
import { RealtimeProgressIndicator, DataUpdateBanner } from './RealtimeProgressIndicator';

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

export const EnhancedUserProgressTabComplete: React.FC<UserProgressTabProps> = ({ 
  userRole = 'user', 
  currentUserId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('30');
  const [programFilter, setProgramFilter] = useState('all');
  const [trackerFilter, setTrackerFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [trackerData, setTrackerData] = useState<TrackerData | null>(null);
  const [workoutProgress, setWorkoutProgress] = useState<WorkoutProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  
  // Real-time hook
  const userIds = selectedUser ? [selectedUser] : users.map(u => u.id);
  const { trackerEntries, workoutProgress: realtimeWorkout, loading: rtLoading, newUpdates, clearNewUpdate } = 
    useRealtimeTrackerProgress(userIds);


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
      
      if (userRole === 'coach' && currentUserId) {
        const { data: assignments } = await supabase
          .from('coach_assignments')
          .select('user_id')
          .eq('coach_id', currentUserId);

        const userIds = assignments?.map(a => a.user_id) || [];
        if (userIds.length > 0) {
          query = query.in('id', userIds);
        } else {
          setUsers([]);
          return;
        }
      }
      
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

      const { data: progressEntries } = await supabase
        .from('progress_entries')
        .select(`*,progress_trackers!inner(tracker_name, unit, daily_goal)`)
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: false });

      const trackerMap = {
        water: progressEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('water')) || [],
        weight: progressEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('weight')) || [],
        steps: progressEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('step')) || [],
        calories: progressEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('calorie')) || []
      };

      setTrackerData(trackerMap);
      await fetchWorkoutProgress(userId);
      await calculateWeeklyStats(userId);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyStats = async (userId: string) => {
    try {
      const weekStart = subDays(new Date(), 7);
      const { data: weekEntries } = await supabase
        .from('progress_entries')
        .select(`*,progress_trackers!inner(tracker_name, unit, daily_goal)`)
        .eq('user_id', userId)
        .gte('date', weekStart.toISOString());

      const stats = {
        totalWater: weekEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('water')
        ).reduce((sum, e) => sum + (e.value || 0), 0) || 0,
        avgSteps: Math.round((weekEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('step')
        ).reduce((sum, e) => sum + (e.value || 0), 0) || 0) / 7),
        totalCalories: weekEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('calorie')
        ).reduce((sum, e) => sum + (e.value || 0), 0) || 0,
        workoutDays: 0
      };

      setWeeklyStats(stats);
    } catch (error) {
      console.error('Error calculating weekly stats:', error);
    }
  };

  const fetchWorkoutProgress = async (userId: string) => {
    try {
      const progressList: WorkoutProgress[] = [];
      const seenIds = new Set<string>();

      // Source 1: coach_programs directly assigned to this user
      const { data: coachPrograms } = await supabase
        .from('coach_programs')
        .select('id, title, duration')
        .eq('assigned_user_id', userId);

      for (const cp of coachPrograms || []) {
        if (seenIds.has(cp.id)) continue;
        seenIds.add(cp.id);

        const [{ data: completions }, { count: cpDayCount }] = await Promise.all([
          supabase
            .from('day_completions')
            .select('id, created_at')
            .eq('user_id', userId)
            .eq('program_id', cp.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('coach_program_days')
            .select('id', { count: 'exact', head: true })
            .eq('coach_program_id', cp.id)
        ]);

        const completedDays = completions?.length || 0;
        const total = cpDayCount || parseInt(cp.duration) || 42;
        const percentage = total > 0 ? Math.min(100, Math.round((completedDays / total) * 100)) : 0;

        progressList.push({
          programId: cp.id,
          programName: cp.title,
          totalDays: total,
          completedDays,
          percentage,
          type: 'coach_program',
          lastActivity: completions?.[0]?.created_at
        });
      }

      // Source 2: all programs from day_completions (programs user has done work on)
      const { data: dayComps } = await supabase
        .from('day_completions')
        .select('program_id, program_name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (dayComps && dayComps.length > 0) {
        const programIdMap = new Map<string, { name: string; lastActivity: string }>();
        for (const dc of dayComps) {
          if (!programIdMap.has(dc.program_id)) {
            programIdMap.set(dc.program_id, { name: dc.program_name, lastActivity: dc.created_at });
          }
        }

        for (const [programId, info] of programIdMap.entries()) {
          if (seenIds.has(programId)) continue;
          seenIds.add(programId);

          const completedDays = dayComps.filter(dc => dc.program_id === programId).length;

          // Try programs table first, then coach_programs
          const { data: programData } = await supabase
            .from('programs')
            .select('id, title, days')
            .eq('id', programId)
            .maybeSingle();

          let total = 42;
          let programName = info.name;
          let type: 'program' | 'coach_program' = 'program';

          if (programData) {
            total = Array.isArray(programData.days) ? programData.days.length : 42;
            programName = programData.title || info.name;
            type = 'program';
          } else {
            const { data: cpData } = await supabase
              .from('coach_programs')
              .select('id, title, duration, assigned_user_id')
              .eq('id', programId)
              .maybeSingle();

            // Skip if program was deleted or unassigned from this user
            if (!cpData) continue;
            if (cpData.assigned_user_id !== userId) continue;

            total = parseInt(cpData.duration) || 42;
            programName = cpData.title || info.name;
            type = 'coach_program';
          }

          const percentage = total > 0 ? Math.min(100, Math.round((completedDays / total) * 100)) : 0;

          progressList.push({
            programId,
            programName,
            totalDays: total,
            completedDays,
            percentage,
            type,
            lastActivity: info.lastActivity
          });
        }
      }

      // Source 3: program_assignments (fallback, may be empty)
      const { data: assignments } = await supabase
        .from('program_assignments')
        .select('*,programs(*),coach_programs(*)')
        .eq('user_id', userId);

      for (const assignment of assignments || []) {
        const program = assignment.programs || assignment.coach_programs;
        if (!program) continue;
        if (seenIds.has(program.id)) continue;
        seenIds.add(program.id);

        const { data: completions } = await supabase
          .from('day_completions')
          .select('id, created_at')
          .eq('user_id', userId)
          .eq('program_id', assignment.program_id || assignment.coach_program_id)
          .order('created_at', { ascending: false });

        const totalDays = assignment.programs
          ? (Array.isArray(program.days) ? program.days.length : 42)
          : (parseInt(program.duration) || 42);
        const completedDays = completions?.length || 0;
        const percentage = totalDays > 0 ? Math.min(100, Math.round((completedDays / totalDays) * 100)) : 0;

        progressList.push({
          programId: program.id,
          programName: program.title || program.name,
          totalDays,
          completedDays,
          percentage,
          type: assignment.program_id ? 'program' : 'coach_program',
          lastActivity: completions?.[0]?.created_at
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

  const selectedUserData = users.find(u => u.id === selectedUser);

  if (!selectedUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">User Progress Dashboard</h2>
          <Badge variant="outline">
            {userRole === 'coach' ? 'Coach View' : 'Admin View'}
          </Badge>
        </div>

        <ProgressFilterControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          programFilter={programFilter}
          onProgramFilterChange={setProgramFilter}
          trackerFilter={trackerFilter}
          onTrackerFilterChange={setTrackerFilter}
          onRefresh={handleRefresh}
          loading={loading}
          totalUsers={users.length}
          selectedUser={selectedUser}
        />

        <UserSelectionGrid
          users={users}
          selectedUser={selectedUser}
          onUserSelect={setSelectedUser}
          loading={loading}
          searchTerm={searchTerm}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DataUpdateBanner count={newUpdates.length} onRefresh={handleRefresh} />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {selectedUserData?.full_name || 'User Progress'}
            </h2>
            <p className="text-gray-500">{selectedUserData?.email}</p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={loading} variant="outline">
          Refresh Data
        </Button>
      </div>


      {weeklyStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Droplets className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Weekly Water</p>
                  <p className="text-2xl font-bold">{weeklyStats.totalWater}L</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Footprints className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Avg Daily Steps</p>
                  <p className="text-2xl font-bold">{weeklyStats.avgSteps.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Flame className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">Weekly Calories</p>
                  <p className="text-2xl font-bold">{weeklyStats.totalCalories.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Dumbbell className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Active Programs</p>
                  <p className="text-2xl font-bold">{workoutProgress.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="charts">
            <BarChart3 className="h-4 w-4 mr-2" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="programs">
            <Target className="h-4 w-4 mr-2" />
            Programs
          </TabsTrigger>
          <TabsTrigger value="details">
            <CheckCircle className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          {trackerData && (
            <UserProgressCharts
              trackerData={trackerData}
              workoutProgress={workoutProgress}
              weeklyStats={weeklyStats}
            />
          )}
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          {workoutProgress.length > 0 ? (
            workoutProgress.map((program) => (
              <Card key={program.programId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{program.programName}</h3>
                      <p className="text-sm text-gray-500">
                        {program.completedDays} of {program.totalDays} days completed
                      </p>
                    </div>
                    <Badge variant={program.type === 'coach_program' ? 'default' : 'secondary'}>
                      {program.percentage}%
                    </Badge>
                  </div>
                  <Progress value={program.percentage} className="mb-2" />
                  {program.lastActivity && (
                    <p className="text-xs text-gray-500">
                      Last activity: {format(new Date(program.lastActivity), 'MMM dd, yyyy')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Assigned</h3>
                <p className="text-gray-500">This user hasn't been assigned any workout programs yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {trackerData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(trackerData).map(([type, data]) => (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="text-sm capitalize flex items-center gap-2">
                      {type === 'water' && <Droplets className="h-4 w-4" />}
                      {type === 'weight' && <Weight className="h-4 w-4" />}
                      {type === 'steps' && <Footprints className="h-4 w-4" />}
                      {type === 'calories' && <Flame className="h-4 w-4" />}
                      {type} Tracker
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-2xl font-bold">
                          {data[0]?.value || 0} {data[0]?.progress_trackers?.unit || ''}
                        </p>
                        <p className="text-sm text-gray-500">
                          Latest entry: {format(new Date(data[0]?.date), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {data.length} entries in selected period
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">No data available</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};