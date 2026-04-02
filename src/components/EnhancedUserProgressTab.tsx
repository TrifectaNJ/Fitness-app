import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Search, RefreshCw, TrendingUp, User, ChevronRight, 
  Droplets, Weight, Footprints, Flame, Dumbbell, Calendar,
  ArrowLeft, Target, CheckCircle, BarChart3, Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { subDays, format } from 'date-fns';

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

export const EnhancedUserProgressTab: React.FC<UserProgressTabProps> = ({ 
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
  const [weeklyStats, setWeeklyStats] = useState<any>(null);

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
      
      const { data } = await query.order('created_at', { ascending: false });
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add the missing functions from Part2
  const fetchUserProgress = async (userId: string) => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), parseInt(dateFilter));

      const { data: progressEntries } = await supabase
        .from('progress_entries')
        .select(`
          *,
          progress_trackers!inner(tracker_name, unit, daily_goal)
        `)
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: false });

      const trackerMap = {
        water: progressEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('water')
        ) || [],
        weight: progressEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('weight')
        ) || [],
        steps: progressEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('step')
        ) || [],
        calories: progressEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('calorie')
        ) || []
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
        .select(`
          *,
          progress_trackers!inner(tracker_name, unit, daily_goal)
        `)
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
      const { data: assignments } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs(*),
          coach_programs(*)
        `)
        .eq('user_id', userId);

      if (!assignments) return;

      const progressList: WorkoutProgress[] = [];

      for (const assignment of assignments) {
        const program = assignment.programs || assignment.coach_programs;
        if (!program) continue;

        const { data: completions } = await supabase
          .from('day_completions')
          .select('*')
          .eq('user_id', userId)
          .eq('program_id', assignment.program_id || assignment.coach_program_id);

        const totalDays = program.total_days || (program.weeks * 7) || 42;
        const completedDays = completions?.length || 0;
        const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

        progressList.push({
          programId: program.id,
          programName: program.name,
          totalDays,
          completedDays,
          percentage,
          type: assignment.program_id ? 'program' : 'coach_program',
          lastActivity: completions?.[0]?.completed_at
        });
      }

      setWorkoutProgress(progressList);
    } catch (error) {
      console.error('Error fetching workout progress:', error);
    }
  };