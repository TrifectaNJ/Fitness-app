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

  const getInstructionText = (subsection: WorkoutSubsection) => {
    if (subsection.repeat_count > 1) {
      return `Repeat ${subsection.repeat_count}x`;
    }
    return '';
  };

  const totalExercises = subsections.reduce((total, subsection) => total + subsection.exercises.length, 0);
  const completedCount = completedExercises.size;

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="space-y-6">
          {subsections.map((subsection) => {
            const hasImageContent = subsection.exercises.some(ex => ex.imageUrl || ex.videoUrl);
            
            return (
              <div key={subsection.id} className="space-y-3">
                <CleanSubsectionHeader
                  title={subsection.subsection_title}
                  instruction={getInstructionText(subsection)}
                  showIcon={!hasImageContent}
                />
                
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 rounded-xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {subsection.exercises.map((exercise) => {
                        const isCompleted = completedExercises.has(exercise.id);
                        const isCurrent = allExercises[currentExerciseIndex]?.id === exercise.id;
                        
                        return (
                          <div
                            key={exercise.id}
                            className={`group flex items-center space-x-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:shadow-md ${
                              isCurrent 
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md' 
                                : isCompleted
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                                : 'bg-white border-slate-200 hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 hover:border-slate-300'
                            }`}
                            onClick={() => onExerciseClick(exercise)}
                          >
                            <div className="flex-shrink-0">
                              <Checkbox
                                checked={isCompleted}
                                onChange={(checked) => {
                                  if (checked) {
                                    setCompletedExercises(prev => new Set([...prev, exercise.id]));
                                  } else {
                                    setCompletedExercises(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(exercise.id);
                                      return newSet;
                                    });
                                  }
                                }}
                                className="w-5 h-5"
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className={`font-semibold text-base truncate ${
                                  isCurrent ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-slate-800'
                                }`}>
                                  {exercise.name}
                                </h4>
                                {(exercise.reps || exercise.duration) && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                      isCurrent 
                                        ? 'bg-blue-100 text-blue-700 border-blue-300' 
                                        : isCompleted
                                        ? 'bg-green-100 text-green-700 border-green-300'
                                        : 'bg-slate-100 text-slate-600 border-slate-300'
                                    }`}
                                  >
                                    {exercise.reps ? `${exercise.reps} reps` : `${exercise.duration}s`}
                                  </Badge>
                                )}
                              </div>
                              {exercise.description && (
                                <p className={`text-sm leading-relaxed ${
                                  isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-slate-600'
                                }`}>
                                  {exercise.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex-shrink-0 ml-3">
                              {isCurrent && (
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                  <Play className="w-4 h-4 text-blue-600 fill-current" />
                                </div>
                              )}
                              {isCompleted && !isCurrent && (
                                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                                  <CheckCircle2 className="w-4 h-4 text-green-600 fill-current" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                </div>
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalWorkoutDisplay;