import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Exercise } from '@/types/fitness';
import { supabase } from '@/lib/supabase';
import { Checkbox } from '@/components/ui/checkbox';
import { Dumbbell, Clock, Target, CheckCircle2, Play, Timer, Zap, Trophy, Star } from 'lucide-react';
import CleanSubsectionHeader from '@/components/CleanSubsectionHeader';
import { useExerciseCompletionPersistent } from '@/hooks/useExerciseCompletionPersistent';
interface ProfessionalWorkoutDisplayV3Props {
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

const ProfessionalWorkoutDisplayV3: React.FC<ProfessionalWorkoutDisplayV3Props> = ({
  workoutId,
  currentExerciseIndex,
  allExercises,
  onExerciseClick,
  onComplete
}) => {
  const [subsections, setSubsections] = useState<WorkoutSubsection[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Use the same completion tracking as WorkoutCompletionButton
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
  // Calculate completion using the persistent hook with useMemo for reactivity
  const { totalExercises, completedCount, progressPercentage } = useMemo(() => {
    const total = subsections.reduce((total, subsection) => total + subsection.exercises.length, 0);
    const completed = subsections.reduce((total, subsection) => {
      return total + subsection.exercises.filter(ex => isExerciseComplete(ex.id)).length;
    }, 0);
    const progress = total > 0 ? (completed / total) * 100 : 0;
    
    console.log('Completion stats updated:', { total, completed, progress });
    return { totalExercises: total, completedCount: completed, progressPercentage: progress };
  }, [subsections, completions, isExerciseComplete]);
  const estimatedDuration = subsections.reduce((total, subsection) => {
    return total + subsection.exercises.reduce((subTotal, exercise) => {
      return subTotal + (exercise.duration || 60);
    }, 0);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Luxurious Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-purple-200 shadow-lg">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-xl shadow-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Elite Workout Experience
                </h1>
                <p className="text-gray-600 font-medium">Elevate your performance to new heights</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-4 py-2">
                <Timer className="h-4 w-4 mr-2" />
                {Math.round(estimatedDuration / 60)} minutes
              </Badge>
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 px-4 py-2">
                <Star className="h-4 w-4 mr-2" />
                {completedCount}/{totalExercises} Complete
              </Badge>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Workout Progress</span>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="relative">
              <Progress value={progressPercentage} className="h-3 bg-gray-200" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full opacity-80" 
                   style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Premium Workout Content */}
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="space-y-10">
          {subsections.map((subsection, sectionIndex) => {
            const completedInSection = subsection.exercises.filter(ex => 
              isExerciseComplete(ex.id)
            ).length;
            const isCompleted = completedInSection === subsection.exercises.length;
            const isActive = subsection.exercises.some(ex => 
              allExercises[currentExerciseIndex]?.id === ex.id
            );

            return (
              <div key={subsection.id} className="space-y-6">
                <CleanSubsectionHeader
                  title={subsection.subsection_title}
                  instruction={subsection.repeat_count > 1 ? `Repeat ${subsection.repeat_count}x` : ''}
                  hasImageContent={subsection.exercises.some(ex => ex.imageUrl || ex.videoUrl)}
                />
                
                <Card className="border-0 shadow-2xl bg-white/70 backdrop-blur-md overflow-hidden rounded-2xl">
                  <CardContent className="p-0">
                    <div className="grid gap-4 p-8">
                      {subsection.exercises.map((exercise, exerciseIndex) => {
                        const isExerciseCompleted = isExerciseComplete(exercise.id);
                        const isCurrentExercise = allExercises[currentExerciseIndex]?.id === exercise.id;
                        return (
                          <div
                            key={exercise.id}
                            className={`group relative p-6 rounded-2xl border-2 transition-all duration-500 cursor-pointer transform hover:scale-[1.02] ${
                              isCurrentExercise
                                ? 'border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50 shadow-xl'
                                : isExerciseCompleted
                                ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg'
                                : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-xl'
                            }`}
                            onClick={() => onExerciseClick(exercise)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-6">
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold shadow-lg ${
                                  isCurrentExercise
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                    : isExerciseCompleted
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                    : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700'
                                }`}>
                                  {exerciseIndex + 1}
                                </div>
                                
                                <div className="flex-1">
                                  <h4 className={`text-lg font-bold ${
                                    isExerciseCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                                  }`}>
                                    {exercise.name}
                                  </h4>
                                  <div className="flex items-center gap-6 mt-2">
                                    {exercise.duration && (
                                      <span className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                        <Clock className="h-4 w-4" />
                                        <span className="font-medium">{exercise.duration}s</span>
                                      </span>
                                    )}
                                    {exercise.reps && (
                                      <span className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                        <Zap className="h-4 w-4" />
                                        <span className="font-medium">{exercise.reps} reps</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <Button
                                  variant="ghost"
                                  size="lg"
                                  className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onExerciseClick(exercise);
                                  }}
                                >
                                  <Play className="h-5 w-5" />
                                </Button>
                                
                                <Checkbox
                                  checked={isExerciseCompleted}
                                  onCheckedChange={() => toggleExerciseComplete(exercise.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-6 h-6"
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
        </div>

        {/* Smart Complete Workout Button */}
        <div className="sticky bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg mt-8">
          <div className="max-w-5xl mx-auto">
            <Button 
              onClick={onComplete}
              disabled={completedCount < totalExercises}
              className={`w-full font-semibold py-4 text-lg rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl ${
                completedCount >= totalExercises 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
              size="lg"
            >
              {completedCount >= totalExercises ? '🎉 Complete Workout' : 'Complete All Exercises First'}
            </Button>
          </div>
        </div>

        {/* Premium Completion Section */}
        {progressPercentage === 100 && (
          <Card className="mt-12 border-0 shadow-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-3xl overflow-hidden">
            <CardContent className="p-12 text-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm" />
              <div className="relative z-10">
                <Trophy className="h-20 w-20 mx-auto mb-6 animate-pulse" />
                <h2 className="text-4xl font-bold mb-4">Exceptional Achievement!</h2>
                <p className="text-purple-100 text-lg mb-8 max-w-md mx-auto">
                  You've conquered every challenge and completed this elite workout with excellence.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfessionalWorkoutDisplayV3;