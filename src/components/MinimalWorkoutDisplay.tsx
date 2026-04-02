import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Exercise } from '@/types/fitness';
import { supabase } from '@/lib/supabase';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, Target, CheckCircle2, Play, Activity } from 'lucide-react';
import CleanSubsectionHeader from '@/components/CleanSubsectionHeader';

interface MinimalWorkoutDisplayProps {
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

const MinimalWorkoutDisplay: React.FC<MinimalWorkoutDisplayProps> = ({
  workoutId,
  currentExerciseIndex,
  allExercises,
  onExerciseClick,
  onComplete
}) => {
  const [subsections, setSubsections] = useState<WorkoutSubsection[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

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
  const completedCount = completedExercises.size;
  const progressPercentage = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

  const toggleExerciseComplete = (exerciseId: string) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-gray-700" />
              <h1 className="text-xl font-semibold text-gray-900">Workout Session</h1>
            </div>
            <Badge variant="outline" className="text-gray-700">
              <Target className="h-3 w-3 mr-1" />
              {completedCount}/{totalExercises}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Simple Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="space-y-6">
          {subsections.map((subsection) => {
            const completedInSection = subsection.exercises.filter(ex => 
              completedExercises.has(ex.id)
            ).length;
            const isCompleted = completedInSection === subsection.exercises.length;
            const isActive = subsection.exercises.some(ex => 
              allExercises[currentExerciseIndex]?.id === ex.id
            );

            return (
              <div key={subsection.id} className="space-y-3">
                <CleanSubsectionHeader
                  title={subsection.subsection_title}
                  instruction={subsection.repeat_count > 1 ? `Repeat ${subsection.repeat_count}x` : ''}
                  hasImageContent={subsection.exercises.some(ex => ex.imageUrl || ex.videoUrl)}
                />
                
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {subsection.exercises.map((exercise, exerciseIndex) => {
                        const isExerciseCompleted = completedExercises.has(exercise.id);
                        const isCurrentExercise = allExercises[currentExerciseIndex]?.id === exercise.id;
                        
                        return (
                          <div
                            key={exercise.id}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                              isCurrentExercise
                                ? 'border-blue-300 bg-blue-50'
                                : isExerciseCompleted
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => onExerciseClick(exercise)}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                                isCurrentExercise
                                  ? 'bg-blue-500 text-white'
                                  : isExerciseCompleted
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {exerciseIndex + 1}
                              </span>
                              
                              <div>
                                <h4 className={`font-medium ${
                                  isExerciseCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                                }`}>
                                  {exercise.name}
                                </h4>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                  {exercise.duration && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {exercise.duration}s
                                    </span>
                                  )}
                                  {exercise.reps && (
                                    <span>{exercise.reps} reps</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExerciseClick(exercise);
                                }}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              
                              <Checkbox
                                checked={isExerciseCompleted}
                                onCheckedChange={() => toggleExerciseComplete(exercise.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Completion */}
        {progressPercentage === 100 && (
          <Card className="mt-6 bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <h2 className="text-xl font-semibold mb-2 text-green-900">Workout Complete!</h2>
              <p className="text-green-700 mb-4">Great job completing all exercises.</p>
              {onComplete && (
                <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
                  Finish
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MinimalWorkoutDisplay;