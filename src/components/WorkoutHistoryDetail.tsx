import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Dumbbell, TrendingUp, Award } from 'lucide-react';
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

interface WorkoutHistoryDetailProps {
  onBack: () => void;
}

export const WorkoutHistoryDetail: React.FC<WorkoutHistoryDetailProps> = ({ onBack }) => {
  const [workouts, setWorkouts] = useState<WorkoutCompletion[]>([]);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalMinutes: 0,
    averageDuration: 0,
    completionRate: 0,
    streak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkoutHistory();
  }, []);

  const fetchWorkoutHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: completions, error } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      if (completions) {
        setWorkouts(completions);
        
        // Calculate comprehensive stats
        const totalWorkouts = completions.length;
        const totalMinutes = completions.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
        const avgDuration = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;
        const completionRate = completions.length > 0 ? 
          Math.round((completions.reduce((sum, w) => sum + w.exercises_completed, 0) / 
                     completions.reduce((sum, w) => sum + w.total_exercises, 0)) * 100) : 0;

        // Calculate streak
        let streak = 0;
        const now = new Date();
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

        setStats({
          totalWorkouts,
          totalMinutes,
          averageDuration: avgDuration,
          completionRate,
          streak
        });
      }
    } catch (error) {
      console.error('Error fetching workout history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workout History</h2>
          <p className="text-gray-600">Track your fitness journey and progress</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalWorkouts}</div>
            <div className="text-sm text-gray-600">Total Workouts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalMinutes}</div>
            <div className="text-sm text-gray-600">Total Minutes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.averageDuration}</div>
            <div className="text-sm text-gray-600">Avg Duration</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.streak}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* Workout History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Recent Workouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : workouts.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No workouts completed yet</p>
              <p className="text-sm text-gray-500">Start your first workout to see your history here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{workout.workout_name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(workout.completed_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{workout.duration_minutes || 0} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {workout.exercises_completed}/{workout.total_exercises} exercises
                    </div>
                    <div className="text-xs text-gray-500">{formatTime(workout.completed_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};