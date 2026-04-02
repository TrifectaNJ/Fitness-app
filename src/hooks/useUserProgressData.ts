import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ProgressEntry {
  id: string;
  user_id: string;
  tracker_id: string;
  value: number;
  date: string;
  created_at: string;
}

export interface ProgressTracker {
  id: string;
  user_id: string;
  tracker_name: string;
  daily_goal: number;
  unit: string;
  current_value: number;
  created_at: string;
}

export interface WorkoutCompletion {
  id: string;
  user_id: string;
  program_id: string;
  workout_id: string;
  completed_at: string;
  duration_minutes?: number;
}

export interface UserProgressData {
  userId: string;
  userName: string;
  userEmail: string;
  water: {
    today: number;
    goal: number;
    unit: string;
    entries: ProgressEntry[];
    weeklyData: number[];
    progress: number;
    trend: 'up' | 'down' | 'stable';
  };
  weight: {
    current: number;
    goal: number;
    unit: string;
    entries: ProgressEntry[];
    weeklyData: number[];
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  steps: {
    today: number;
    goal: number;
    unit: string;
    entries: ProgressEntry[];
    weeklyData: number[];
    progress: number;
    trend: 'up' | 'down' | 'stable';
  };
  calories: {
    today: number;
    goal: number;
    unit: string;
    entries: ProgressEntry[];
    weeklyData: number[];
    progress: number;
    trend: 'up' | 'down' | 'stable';
  };
  workouts: {
    thisWeek: number;
    thisMonth: number;
    completions: WorkoutCompletion[];
    weeklyData: number[];
    streak: number;
  };
}

export function useUserProgressData(userId?: string, dateRange: number = 30) {
  const [progressData, setProgressData] = useState<UserProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchUserProgressData();

    // Set up real-time subscriptions
    const entriesChannel = supabase
      .channel('progress_entries_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'progress_entries', filter: `user_id=eq.${userId}` },
        () => fetchUserProgressData()
      )
      .subscribe();

    const trackersChannel = supabase
      .channel('progress_trackers_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'progress_trackers', filter: `user_id=eq.${userId}` },
        () => fetchUserProgressData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(entriesChannel);
      supabase.removeChannel(trackersChannel);
    };
  }, [userId, dateRange]);

  const fetchUserProgressData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Get user info
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();

      // Get date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      const today = new Date().toISOString().split('T')[0];

      // Fetch all progress trackers for this user
      const { data: trackers } = await supabase
        .from('progress_trackers')
        .select('*')
        .eq('user_id', userId);

      // Fetch all progress entries for this user in date range
      const { data: entries } = await supabase
        .from('progress_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      // Fetch workout completions
      const { data: workoutCompletions } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: false });

      // Process data for each tracker type
      const processTrackerData = (trackerName: string) => {
        const tracker = trackers?.find(t => t.tracker_name.toLowerCase() === trackerName.toLowerCase());
        const trackerEntries = entries?.filter(e => e.tracker_id === tracker?.id) || [];
        
        // Get today's total
        const todayEntries = trackerEntries.filter(e => e.date === today);
        const todayTotal = todayEntries.reduce((sum, e) => sum + e.value, 0);
        
        // Get weekly data (last 7 days)
        const weeklyData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayEntries = trackerEntries.filter(e => e.date === dateStr);
          return dayEntries.reduce((sum, e) => sum + e.value, 0);
        }).reverse();

        // Calculate trend
        const recentAvg = weeklyData.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const olderAvg = weeklyData.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (recentAvg > olderAvg * 1.1) trend = 'up';
        else if (recentAvg < olderAvg * 0.9) trend = 'down';

        return {
          today: todayTotal,
          goal: tracker?.daily_goal || 0,
          unit: tracker?.unit || '',
          entries: trackerEntries,
          weeklyData,
          progress: tracker?.daily_goal ? Math.min((todayTotal / tracker.daily_goal) * 100, 100) : 0,
          trend
        };
      };

      // Process weight data (different logic for current vs goal)
      const processWeightData = () => {
        const tracker = trackers?.find(t => t.tracker_name.toLowerCase() === 'weight');
        const trackerEntries = entries?.filter(e => e.tracker_id === tracker?.id) || [];
        
        // Get most recent weight
        const currentWeight = trackerEntries.length > 0 ? trackerEntries[0].value : 0;
        
        // Get weekly data
        const weeklyData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayEntry = trackerEntries.find(e => e.date === dateStr);
          return dayEntry?.value || 0;
        }).reverse();

        // Calculate change from a week ago
        const weekAgoWeight = weeklyData[0] || currentWeight;
        const change = currentWeight - weekAgoWeight;

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (change > 0.5) trend = 'up';
        else if (change < -0.5) trend = 'down';

        return {
          current: currentWeight,
          goal: tracker?.daily_goal || 0,
          unit: tracker?.unit || 'lbs',
          entries: trackerEntries,
          weeklyData,
          change,
          trend
        };
      };

      // Process workout data
      const processWorkoutData = () => {
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        thisWeekStart.setHours(0, 0, 0, 0);

        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        thisMonthStart.setHours(0, 0, 0, 0);

        const thisWeekCompletions = workoutCompletions?.filter(w => 
          new Date(w.completed_at) >= thisWeekStart
        ) || [];

        const thisMonthCompletions = workoutCompletions?.filter(w => 
          new Date(w.completed_at) >= thisMonthStart
        ) || [];

        // Weekly workout data (last 7 days)
        const weeklyData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);
          
          return workoutCompletions?.filter(w => {
            const completedAt = new Date(w.completed_at);
            return completedAt >= date && completedAt < nextDay;
          }).length || 0;
        }).reverse();

        // Calculate streak
        let streak = 0;
        const sortedCompletions = [...(workoutCompletions || [])].sort((a, b) => 
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        );

        if (sortedCompletions.length > 0) {
          const completionDates = new Set(
            sortedCompletions.map(w => new Date(w.completed_at).toDateString())
          );
          
          let currentDate = new Date();
          while (completionDates.has(currentDate.toDateString())) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          }
        }

        return {
          thisWeek: thisWeekCompletions.length,
          thisMonth: thisMonthCompletions.length,
          completions: workoutCompletions || [],
          weeklyData,
          streak
        };
      };

      const progressData: UserProgressData = {
        userId,
        userName: userData?.full_name || 'Unknown User',
        userEmail: userData?.email || '',
        water: processTrackerData('water'),
        weight: processWeightData(),
        steps: processTrackerData('steps'),
        calories: processTrackerData('calories'),
        workouts: processWorkoutData()
      };

      setProgressData(progressData);
      setError(null);
    } catch (err) {
      console.error('Error fetching user progress data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { progressData, loading, error, refetch: fetchUserProgressData };
}