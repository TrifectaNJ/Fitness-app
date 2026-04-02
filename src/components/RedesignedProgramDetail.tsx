import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FitnessProgram } from '@/types/fitness';
import { Clock, Star, Play, ArrowLeft, CheckCircle, RotateCcw, Calendar, Target } from 'lucide-react';
import WorkoutPlayer from './WorkoutPlayer';
import DayWorkoutsList from './DayWorkoutsList';
import { supabase } from '@/lib/supabase';

interface RedesignedProgramDetailProps {
  program: FitnessProgram;
  onBack: () => void;
  onStartProgram?: () => void;
}

const RedesignedProgramDetail: React.FC<RedesignedProgramDetailProps> = ({ 
  program, 
  onBack, 
  onStartProgram 
}) => {
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [isPlayingWorkout, setIsPlayingWorkout] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [showDayWorkouts, setShowDayWorkouts] = useState(false);
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set());
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [loadingCompletions, setLoadingCompletions] = useState(true);

  useEffect(() => {
    loadCompletedWorkouts();
  }, [program.id]);

  const loadCompletedWorkouts = async () => {
    setLoadingCompletions(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: completions } = await supabase
        .from('workout_completions')
        .select('workout_name, program_id, day_number')
        .eq('user_id', user.id)
        .eq('program_id', program.id);

      const { data: dayCompletions } = await supabase
        .from('day_completions')
        .select('program_id, day_number')
        .eq('user_id', user.id)
        .eq('program_id', program.id);

      if (completions) {
        const completedSet = new Set<string>();
        completions.forEach(completion => {
          const workoutKey = `${completion.program_id}-${completion.day_number}-${completion.workout_name}`;
          completedSet.add(workoutKey);
        });
        setCompletedWorkouts(completedSet);
      }

      if (dayCompletions) {
        const completedDaysSet = new Set<string>();
        dayCompletions.forEach(completion => {
          const dayKey = `${completion.program_id}-${completion.day_number}`;
          completedDaysSet.add(dayKey);
        });
        setCompletedDays(completedDaysSet);
      }
    } catch (error) {
      console.error('Error loading completed workouts:', error);
    } finally {
      setLoadingCompletions(false);
    }
  };