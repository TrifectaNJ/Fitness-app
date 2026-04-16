import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Dumbbell, TrendingUp, Award, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DayCompletion {
  id: string;
  user_id: string;
  program_id: string;
  program_name: string;
  day_number: number;
  day_title: string;
  total_workouts: number;
  completed_workouts: number;
  completion_percentage: number;
  created_at: string;
}

interface WorkoutHistoryDetailProps {
  onBack: () => void;
}

export const WorkoutHistoryDetail: React.FC<WorkoutHistoryDetailProps> = ({ onBack }) => {
  const [completions, setCompletions] = useState<DayCompletion[]>([]);
  const [stats, setStats] = useState({
    totalDays: 0,
    avgCompletion: 0,
    totalWorkouts: 0,
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

      const { data, error } = await supabase
        .from('day_completions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setCompletions(data);

        const totalDays = data.length;
        const totalWorkouts = data.reduce((sum, d) => sum + (d.completed_workouts || 0), 0);
        const avgCompletion = totalDays > 0
          ? Math.round(data.reduce((sum, d) => sum + (d.completion_percentage || 0), 0) / totalDays)
          : 0;

        // Calculate streak from consecutive days
        let streak = 0;
        const days = new Set(data.map((d) => d.created_at.split('T')[0]));
        const check = new Date();
        if (!days.has(check.toISOString().split('T')[0])) {
          check.setDate(check.getDate() - 1);
        }
        while (days.has(check.toISOString().split('T')[0])) {
          streak++;
          check.setDate(check.getDate() - 1);
        }

        setStats({ totalDays, avgCompletion, totalWorkouts, streak });
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
            <div className="text-2xl font-bold text-blue-600">{stats.totalDays}</div>
            <div className="text-sm text-gray-600">Days Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalWorkouts}</div>
            <div className="text-sm text-gray-600">Total Workouts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.avgCompletion}%</div>
            <div className="text-sm text-gray-600">Avg Completion</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.streak}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Completed Days
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
          ) : completions.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No workouts completed yet</p>
              <p className="text-sm text-gray-500">Start your first workout to see your history here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completions.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {item.day_title || `Day ${item.day_number}`}
                      </h4>
                      <p className="text-xs text-gray-500 mb-1">{item.program_name}</p>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {item.completed_workouts}/{item.total_workouts} workouts
                    </div>
                    <div className="text-xs text-green-600 font-semibold">{item.completion_percentage}% complete</div>
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
