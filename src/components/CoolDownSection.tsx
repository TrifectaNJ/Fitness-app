import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Exercise } from '@/types/fitness';
import { supabase } from '@/lib/supabase';
import { Snowflake, Check } from 'lucide-react';
import { useExerciseCompletionPersistent } from '@/hooks/useExerciseCompletionPersistent';
import CleanSubsectionHeader from '@/components/CleanSubsectionHeader';

interface CoolDownSectionProps {
  workoutId: string;
  currentExerciseIndex: number;
  allExercises: Exercise[];
  onExerciseClick: (exercise: Exercise, subsection?: any) => void;
}

interface WorkoutSubsection {
  id: string;
  subsection_title: string;
  repeat_count: number;
  sort_order: number;
  section_key: string;
  exercises: Exercise[];
}

const CoolDownSection: React.FC<CoolDownSectionProps> = ({
  workoutId,
  currentExerciseIndex,
  allExercises,
  onExerciseClick
}) => {
  const [subsections, setSubsections] = useState<WorkoutSubsection[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const { 
    isExerciseComplete, 
    getExerciseProgress, 
    markExerciseComplete, 
    resetExercise,
    loading: completionsLoading,
    refreshCompletions 
  } = useExerciseCompletionPersistent(workoutId, user?.id);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    loadCoolDownSubsections();
  }, [workoutId]);

  useEffect(() => {
    if (user && workoutId) {
      refreshCompletions();
    }
  }, [user, workoutId, refreshCompletions]);

  // Listen for exercise completion events
  useEffect(() => {
    const handleExerciseCompleted = async (event: any) => {
      console.log('Cool-down exercise completed:', event.detail);
      if (user && workoutId) {
        setTimeout(async () => {
          await refreshCompletions();
        }, 200);
      }
    };
    
    window.addEventListener('exerciseCompleted', handleExerciseCompleted);
    return () => window.removeEventListener('exerciseCompleted', handleExerciseCompleted);
  }, [user, workoutId, refreshCompletions]);

  const loadCoolDownSubsections = async () => {
    try {
      const { data: subsectionsData, error: subsectionsError } = await supabase
        .from('workout_subsections')
        .select('*')
        .eq('workout_id', workoutId)
        .eq('section_key', 'cool-down')
        .order('sort_order');

      if (subsectionsError) {
        console.error('Error loading cool-down subsections:', subsectionsError);
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
                id,
                name,
                description,
                image_url,
                video_url,
                instructions,
                duration,
                reps
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
              section_key: subsection.section_key,
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
            section_key: subsection.section_key,
            exercises
          };
        })
      );

      setSubsections(subsectionsWithExercises);
    } catch (error) {
      console.error('Error loading cool-down subsections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseClick = (exercise: Exercise, subsection: WorkoutSubsection) => {
    onExerciseClick(exercise, subsection);
  };

  const handleExerciseToggle = async (exerciseId: string, subsection: WorkoutSubsection) => {
    const isCompleted = isExerciseComplete(exerciseId);
    const totalSets = subsection.repeat_count || 1;

    if (isCompleted) {
      await resetExercise(exerciseId);
    } else {
      for (let i = 0; i < totalSets; i++) {
        await markExerciseComplete(exerciseId, totalSets);
      }
    }
  };

  if (loading || completionsLoading) {
    return (
      <div className="text-center p-4">
        <p>Loading cool-down...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Section Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">COOL-DOWN</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {subsections.length} subsection{subsections.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Subsections */}
      {subsections.map((subsection) => (
        <div key={subsection.id} className="mb-6">
          <CleanSubsectionHeader
            title={subsection.subsection_title}
            instruction={subsection.repeat_count > 1 ? `Repeat ${subsection.repeat_count}x` : ''}
            hasImageContent={subsection.exercises.some(ex => ex.imageUrl || ex.videoUrl)}
            showIcon={!subsection.exercises.some(ex => ex.imageUrl || ex.videoUrl)}
            icon={<Snowflake className="w-4 h-4" />}
          />

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-4">
                {subsection.exercises.map((exercise) => {
                  const isCompleted = isExerciseComplete(exercise.id);
                  const progress = getExerciseProgress(exercise.id);
                  const isCurrent = allExercises[currentExerciseIndex]?.id === exercise.id;
                  const totalSets = subsection.repeat_count || 1;
                  
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
                      onClick={() => handleExerciseClick(exercise, subsection)}
                    >
                      {/* Completion Indicator */}
                      <div 
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExerciseToggle(exercise.id, subsection);
                        }}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCompleted 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 hover:border-green-400'
                        }`}>
                          {isCompleted && <Check className="w-4 h-4" />}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-semibold text-base truncate ${
                            isCurrent ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-slate-800'
                          }`}>
                            {exercise.name}
                          </h4>
                          <div className="flex items-center gap-2">
                            {/* Sets Progress */}
                            {totalSets > 1 && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                  isCompleted
                                    ? 'bg-green-100 text-green-700 border-green-300'
                                    : progress.completed > 0
                                    ? 'bg-orange-100 text-orange-700 border-orange-300'
                                    : 'bg-slate-100 text-slate-600 border-slate-300'
                                }`}
                              >
                                {progress.completed}/{totalSets}
                              </Badge>
                            )}
                            {/* Duration/Reps */}
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
                        </div>
                        {exercise.description && (
                          <p className={`text-sm leading-relaxed ${
                            isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-slate-600'
                          }`}>
                            {exercise.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default CoolDownSection;