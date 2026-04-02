import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Exercise } from '@/types/fitness';
import { supabase } from '@/lib/supabase';
import { Checkbox } from '@/components/ui/checkbox';
import { Dumbbell, Clock, Target, CheckCircle2, Play } from 'lucide-react';
import CleanSubsectionHeader from '@/components/CleanSubsectionHeader';

interface ProfessionalWorkoutDisplayProps {
  workoutId: string;
  currentExerciseIndex: number;
  allExercises: Exercise[];
  onExerciseClick: (exercise: Exercise) => void;
  onComplete?: () => void;
}

interface WorkoutSubsection {
  id: string;
  subsection_title: string;
  repeat_count: number;
  sort_order: number;
  section_key: string;
  exercises: Exercise[];
}

const ProfessionalWorkoutDisplay: React.FC<ProfessionalWorkoutDisplayProps> = ({
  workoutId,
  currentExerciseIndex,
  allExercises,
  onExerciseClick,
  onComplete
}) => {
  const [subsections, setSubsections] = useState<WorkoutSubsection[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [isWorkoutComplete, setIsWorkoutComplete] = useState(false);

  useEffect(() => {
    loadWorkoutSubsections();
  }, [workoutId]);

  const loadWorkoutSubsections = async () => {
    try {
      const { data: subsectionsData, error: subsectionsError } = await supabase
        .from('workout_subsections')
        .select('*')
        .eq('workout_id', workoutId)
        .order('sort_order');

      if (subsectionsError) {
        console.error('Error loading subsections:', subsectionsError);
        return;
      }

      if (!subsectionsData || subsectionsData.length === 0) {
        setSubsections([]);
        setLoading(false);
        return;
      }

      const subsectionsWithExercises = await Promise.all(
        subsectionsData.map(async (subsection) => {
          const { data: exercisesData, error: exercisesError } = await supabase
            .from('workout_subsection_exercises')
            .select(`
              *,
              exercise_library!inner(
                id, name, description, image_url, video_url, instructions, duration, reps
              )
            `)
            .eq('subsection_id', subsection.id)
            .order('sort_order');

          if (exercisesError) {
            console.error('Error loading exercises:', exercisesError);
            return {
              id: subsection.id,
              subsection_title: subsection.subsection_title,
              repeat_count: subsection.repeat_count || 1,
              sort_order: subsection.sort_order,
              section_key: subsection.section_key || 'main',
              exercises: []
            };
          }

          const exercises = (exercisesData || []).map((ex: any) => ({
            id: ex.exercise_library.id,
            name: ex.exercise_library.name,
            description: ex.exercise_library.description || '',
            imageUrl: ex.exercise_library.image_url,
            videoUrl: ex.exercise_library.video_url,
            instructions: ex.exercise_library.instructions || [],
            reps: ex.reps || ex.exercise_library.reps,
            duration: ex.duration || ex.exercise_library.duration,
            order: ex.sort_order || 0
          }));

          return {
            id: subsection.id,
            subsection_title: subsection.subsection_title,
            repeat_count: subsection.repeat_count || 1,
            sort_order: subsection.sort_order,
            section_key: subsection.section_key || 'main',
            exercises
          };
        })
      );

      setSubsections(subsectionsWithExercises);
    } catch (error) {
      console.error('Error loading workout subsections:', error);
    } finally {
      setLoading(false);
    }
  };