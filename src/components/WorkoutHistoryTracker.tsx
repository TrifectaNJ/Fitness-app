import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, Target, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface WorkoutHistory {
  id: string;
  workout_name: string;
  program_name: string;
  completed_at: string;
  exercises_completed: number;
  total_exercises: number;
}

interface WorkoutStats {
  totalWorkouts: number;
  thisWeekWorkouts: number;
  currentStreak: number;
  completionRate: number;
}

const WorkoutHistoryTracker: React.FC = () => {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>([]);
  const [stats, setStats] = useState<WorkoutStats>({
    totalWorkouts: 0,
    thisWeekWorkouts: 0,
    currentStreak: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkoutHistory();
  }, []);

  const fetchWorkoutHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch workout completions from database
      const { data: completions, error } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching workout completions:', error);
        return;
      }

      const history: WorkoutHistory[] = (completions || []).map(completion => ({
        id: completion.id,
        workout_name: completion.workout_name,
        program_name: completion.program_name,
        completed_at: completion.completed_at,
        exercises_completed: completion.exercises_completed,
        total_exercises: completion.total_exercises
      }));

      setWorkoutHistory(history);
      
      // Calculate stats from real data
      const totalWorkouts = history.length;
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const thisWeekWorkouts = history.filter(w => 
        new Date(w.completed_at) > oneWeekAgo
      ).length;
      
      // Calculate completion rate
      const totalExercises = history.reduce((sum, w) => sum + w.total_exercises, 0);
      const completedExercises = history.reduce((sum, w) => sum + w.exercises_completed, 0);
      const completionRate = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;
      
      // Calculate streak (consecutive days with workouts)
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < 30; i++) { // Check last 30 days
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        
        const hasWorkoutOnDate = history.some(w => {
          const workoutDate = new Date(w.completed_at);
          workoutDate.setHours(0, 0, 0, 0);
          return workoutDate.getTime() === checkDate.getTime();
        });
        
        if (hasWorkoutOnDate) {
          currentStreak++;
        } else if (i > 0) { // Don't break on first day (today) if no workout
          break;
        }
      }
      
      setStats({
        totalWorkouts,
        thisWeekWorkouts,
        currentStreak,
        completionRate
      });

    } catch (error) {
      console.error('Error fetching workout history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading workout history...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
            <div className="text-sm text-gray-600">Total Workouts</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{stats.thisWeekWorkouts}</div>
            <div className="text-sm text-gray-600">This Week</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <div className="text-sm text-gray-600">Completion</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workoutHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No workouts completed yet</p>
            ) : (
              workoutHistory.map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{workout.workout_name}</div>
                    <div className="text-sm text-gray-600">{workout.program_name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(workout.completed_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={workout.exercises_completed === workout.total_exercises ? "default" : "secondary"}>
                      {workout.exercises_completed}/{workout.total_exercises}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutHistoryTracker;