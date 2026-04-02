import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dumbbell, Calendar, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface WorkoutCompletion {
  id: string;
  user_id: string;
  program_id: string;
  workout_name: string;
  completed_at: string;
  duration_minutes: number;
  exercises_completed: number;
  total_exercises: number;
}

interface WorkoutTrackerCardProps {
  onViewDetails: () => void;
}

export const WorkoutTrackerCard: React.FC<WorkoutTrackerCardProps> = ({ onViewDetails }) => {
  const [workoutStats, setWorkoutStats] = useState({
    totalWorkouts: 0,
    thisWeek: 0,
    averageDuration: 0,
    streak: 0
  });
  const [recentWorkout, setRecentWorkout] = useState<WorkoutCompletion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkoutData();
    // Refresh data every 30 seconds to catch new completions
    const interval = setInterval(fetchWorkoutData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWorkoutData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all workout completions for the user
      const { data: completions, error } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      if (completions && completions.length > 0) {
        // Calculate stats
        const totalWorkouts = completions.length;
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const thisWeekWorkouts = completions.filter(w => 
          new Date(w.completed_at) >= weekAgo
        ).length;

        const avgDuration = completions.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) / totalWorkouts;

        // Calculate streak (consecutive days with workouts)
        let streak = 0;
        const sortedDates = completions.map(w => new Date(w.completed_at).toDateString());
        const uniqueDates = [...new Set(sortedDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        for (let i = 0; i < uniqueDates.length; i++) {
          const currentDate = new Date(uniqueDates[i]);
          const expectedDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          
          if (currentDate.toDateString() === expectedDate.toDateString()) {
            streak++;
          } else {
            break;
          }
        }

        setWorkoutStats({
          totalWorkouts,
          thisWeek: thisWeekWorkouts,
          averageDuration: Math.round(avgDuration),
          streak
        });

        setRecentWorkout(completions[0]);
      }
    } catch (error) {
      console.error('Error fetching workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
          onClick={onViewDetails}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Workout Tracker</h4>
            <p className="text-sm text-gray-500">Track your fitness progress</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{workoutStats.totalWorkouts}</div>
            <div className="text-xs text-gray-500">Total Workouts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{workoutStats.thisWeek}</div>
            <div className="text-xs text-gray-500">This Week</div>
          </div>
        </div>
      )}
    </div>
  );
};
