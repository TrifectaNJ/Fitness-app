import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Exercise } from '@/types/fitness';
import { supabase } from '@/lib/supabase';
import { Checkbox } from '@/components/ui/checkbox';
import { Dumbbell, Clock, Target, CheckCircle2, Play, Timer, Zap } from 'lucide-react';
import CleanSubsectionHeader from '@/components/CleanSubsectionHeader';

interface ProfessionalWorkoutDisplayV2Props {
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

const ProfessionalWorkoutDisplayV2: React.FC<ProfessionalWorkoutDisplayV2Props> = ({
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

  const estimatedDuration = subsections.reduce((total, subsection) => {
    return total + subsection.exercises.reduce((subTotal, exercise) => {
      return subTotal + (exercise.duration || 60);
    }, 0);
  }, 0);

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Professional Workout</h1>
                <p className="text-sm text-gray-600">Transform your fitness journey</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Timer className="h-3 w-3 mr-1" />
                {Math.round(estimatedDuration / 60)}min
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Target className="h-3 w-3 mr-1" />
                {completedCount}/{totalExercises}
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2 bg-gray-100" />
          </div>
        </div>
      </div>

      {/* Enhanced Workout Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {subsections.map((subsection, sectionIndex) => {
            const completedInSection = subsection.exercises.filter(ex => 
              completedExercises.has(ex.id)
            ).length;
            const isCompleted = completedInSection === subsection.exercises.length;
            const isActive = subsection.exercises.some(ex => 
              allExercises[currentExerciseIndex]?.id === ex.id
            );

            return (
              <div key={subsection.id} className="space-y-4">
                <CleanSubsectionHeader
                  title={subsection.subsection_title}
                  instruction={subsection.repeat_count > 1 ? `Repeat ${subsection.repeat_count}x` : ''}
                  hasImageContent={subsection.exercises.some(ex => ex.imageUrl || ex.videoUrl)}
                />
                
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid gap-3 p-6">
                      {subsection.exercises.map((exercise, exerciseIndex) => {
                        const isExerciseCompleted = completedExercises.has(exercise.id);
                        const isCurrentExercise = allExercises[currentExerciseIndex]?.id === exercise.id;
                        
                        return (
                          <div
                            key={exercise.id}
                            className={`group relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                              isCurrentExercise
                                ? 'border-blue-400 bg-blue-50 shadow-md'
                                : isExerciseCompleted
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                            }`}
                            onClick={() => onExerciseClick(exercise)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                  isCurrentExercise
                                    ? 'bg-blue-500 text-white'
                                    : isExerciseCompleted
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {exerciseIndex + 1}
                                </div>
                                
                                <div className="flex-1">
                                  <h4 className={`font-semibold ${
                                    isExerciseCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                                  }`}>
                                    {exercise.name}
                                  </h4>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                    {exercise.duration && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {exercise.duration}s
                                      </span>
                                    )}
                                    {exercise.reps && (
                                      <span className="flex items-center gap-1">
                                        <Zap className="h-3 w-3" />
                                        {exercise.reps} reps
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
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

        {/* Enhanced Completion Section */}
        {progressPercentage === 100 && (
          <Card className="mt-8 border-0 shadow-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Workout Complete!</h2>
              <p className="text-green-100 mb-6">Outstanding work! You've completed all exercises.</p>
              {onComplete && (
                <Button 
                  onClick={onComplete}
                  className="bg-white text-green-600 hover:bg-green-50"
                  size="lg"
                >
                  Finish Workout
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfessionalWorkoutDisplayV2;