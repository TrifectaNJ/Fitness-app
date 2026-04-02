import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Exercise } from '@/types/fitness';
import { supabase } from '@/lib/supabase';
import { Clock, Target, Check, Play } from 'lucide-react';
import { useExerciseCompletionPersistent } from '@/hooks/useExerciseCompletionPersistent';

interface ModernWorkoutDisplayProps {
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

const ModernWorkoutDisplay: React.FC<ModernWorkoutDisplayProps> = ({
  workoutId,
  currentExerciseIndex,
  allExercises,
  onExerciseClick,
  onComplete
}) => {
  const [subsections, setSubsections] = useState<WorkoutSubsection[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const { 
    isExerciseComplete, 
    markExerciseComplete,
    resetExercise,
    completions
  } = useExerciseCompletionPersistent(workoutId, user?.id);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    loadWorkoutSubsections();
  }, [workoutId]);

  const loadWorkoutSubsections = async () => {
    try {
      const { data: subsectionsData, error } = await supabase
        .from('workout_subsections')
        .select('*')
        .eq('workout_id', workoutId)
        .order('sort_order');

      if (error) {
        console.error('Error loading subsections:', error);
        return;
      }

      const subsectionsWithExercises = await Promise.all(
        (subsectionsData || []).map(async (subsection) => {
          const { data: exercisesData } = await supabase
            .from('workout_subsection_exercises')
            .select(`
              *,
              exercise_library!inner(
                id, name, description, image_url, video_url, instructions, duration, reps
              )
            `)
            .eq('subsection_id', subsection.id)
            .order('sort_order');

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

  const totalExercises = subsections.reduce((total, subsection) => total + subsection.exercises.length, 0);
  const completedCount = subsections.reduce((total, subsection) => {
    return total + subsection.exercises.filter(ex => isExerciseComplete(ex.id)).length;
  }, 0);

  const toggleExerciseComplete = async (exerciseId: string) => {
    if (isExerciseComplete(exerciseId)) {
      await resetExercise(exerciseId);
    } else {
      await markExerciseComplete(exerciseId, 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Today's Workout</h1>
        <p className="text-gray-600">Complete each exercise to finish your workout</p>
        <div className="flex justify-center gap-4 mt-4">
          <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
            <Target className="w-4 h-4 mr-1" />
            {completedCount}/{totalExercises} Complete
          </Badge>
        </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-6">
        {subsections.map((subsection) => (
          <div key={subsection.id}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {subsection.subsection_title}
              {subsection.repeat_count > 1 && (
                <span className="text-sm text-gray-500 ml-2">
                  (Repeat {subsection.repeat_count}x)
                </span>
              )}
            </h2>
            
            <div className="space-y-3">
              {subsection.exercises.map((exercise, index) => {
                const isCompleted = isExerciseComplete(exercise.id);
                const isCurrent = allExercises[currentExerciseIndex]?.id === exercise.id;
                
                return (
                  <Card 
                    key={exercise.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isCurrent 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : isCompleted
                        ? 'bg-green-50 border-green-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onExerciseClick(exercise)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              isCompleted 
                                ? 'bg-green-500 text-white' 
                                : isCurrent
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className={`font-semibold ${
                              isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                            }`}>
                              {exercise.name}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              {exercise.duration && (
                                <span className="flex items-center gap-1 text-sm text-gray-600">
                                  <Clock className="w-3 h-3" />
                                  {exercise.duration}s
                                </span>
                              )}
                              {exercise.reps && (
                                <span className="flex items-center gap-1 text-sm text-gray-600">
                                  <Target className="w-3 h-3" />
                                  {exercise.reps} reps
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onExerciseClick(exercise);
                            }}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          
                          <div 
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                              isCompleted 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-300 hover:border-green-400'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExerciseComplete(exercise.id);
                            }}
                          >
                            {isCompleted && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Complete Button */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t p-4 mt-8">
        <Button 
          onClick={onComplete}
          disabled={completedCount < totalExercises}
          className={`w-full py-3 text-lg font-semibold ${
            completedCount >= totalExercises 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {completedCount >= totalExercises ? '🎉 Complete Workout' : 'Complete All Exercises First'}
        </Button>
      </div>
    </div>
  );
};

export default ModernWorkoutDisplay;