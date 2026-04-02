import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, Users, Activity, Clock, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProgramStatsModalProps {
  programId: string;
  programTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ProgramStats {
  totalWorkouts: number;
  completedWorkouts: number;
  completionRate: number;
  totalExercises: number;
  averageWorkoutDuration: number;
  lastActivity: string;
  weeklyProgress: { week: number; completed: number; total: number }[];
}

export const ProgramStatsModal: React.FC<ProgramStatsModalProps> = ({
  programId,
  programTitle,
  isOpen,
  onClose
}) => {
  const [stats, setStats] = useState<ProgramStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgramStats = async () => {
    if (!programId) return;
    
    try {
      setLoading(true);
      
      // Get program details
      const { data: program } = await supabase
        .from('personalized_workout_programs')
        .select('*')
        .eq('id', programId)
        .single();

      if (!program) return;

      // Get workout completions
      const { data: completions } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', program.user_id);

      // Get total workouts from program structure
      const programData = program.program_data || {};
      const weeks = programData.weeks || [];
      let totalWorkouts = 0;
      let totalExercises = 0;

      weeks.forEach((week: any) => {
        if (week.days) {
          totalWorkouts += week.days.length;
          week.days.forEach((day: any) => {
            if (day.exercises) {
              totalExercises += day.exercises.length;
            }
          });
        }
      });

      const completedWorkouts = completions?.length || 0;
      const completionRate = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

      // Calculate weekly progress
      const weeklyProgress = weeks.map((week: any, index: number) => {
        const weekWorkouts = week.days?.length || 0;
        const weekCompletions = completions?.filter((c: any) => {
          // This is a simplified check - in reality you'd match by week/day
          return true; // Placeholder logic
        }).length || 0;
        
        return {
          week: index + 1,
          completed: Math.min(weekCompletions, weekWorkouts),
          total: weekWorkouts
        };
      });

      const lastActivity = completions?.length > 0 
        ? completions[completions.length - 1].completed_at 
        : program.created_at;

      setStats({
        totalWorkouts,
        completedWorkouts,
        completionRate,
        totalExercises,
        averageWorkoutDuration: 45, // Placeholder
        lastActivity,
        weeklyProgress
      });
    } catch (error) {
      console.error('Error fetching program stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && programId) {
      fetchProgramStats();
    }
  }, [isOpen, programId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Program Statistics - {programTitle}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
                  <div className="text-sm text-gray-600">Total Workouts</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Activity className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.completedWorkouts}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.averageWorkoutDuration}m</div>
                  <div className="text-sm text-gray-600">Avg Duration</div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Workout Completion</span>
                      <span>{stats.completedWorkouts}/{stats.totalWorkouts}</span>
                    </div>
                    <Progress value={stats.completionRate} className="h-2" />
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Last Activity: {new Date(stats.lastActivity).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.weeklyProgress.map((week) => (
                    <div key={week.week} className="flex items-center gap-4">
                      <div className="w-16 text-sm font-medium">Week {week.week}</div>
                      <div className="flex-1">
                        <Progress 
                          value={week.total > 0 ? (week.completed / week.total) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                      <div className="text-sm text-gray-600 w-16 text-right">
                        {week.completed}/{week.total}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No statistics available for this program.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};