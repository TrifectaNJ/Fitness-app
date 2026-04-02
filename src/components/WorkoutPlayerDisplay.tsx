import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Exercise } from '@/types/fitness';
import { supabase } from '@/lib/supabase';
import { Checkbox } from '@/components/ui/checkbox';
import { Dumbbell } from 'lucide-react';
import CleanSubsectionHeader from '@/components/CleanSubsectionHeader';
interface WorkoutPlayerDisplayProps {
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

const WorkoutPlayerDisplay: React.FC<WorkoutPlayerDisplayProps> = ({
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

  const handleExerciseComplete = (exerciseId: string) => {
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

  const handleWorkoutComplete = () => {
    setIsWorkoutComplete(true);
    if (onComplete) {
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  };

  const getSectionTitle = (key: string) => {
    switch (key) {
      case 'warm-up':
      case 'warmup': 
        return 'WARM-UP';
      case 'main-workout':
      case 'main': 
        return 'MAIN WORKOUT';
      case 'cool-down':
      case 'cooldown': 
        return 'COOL-DOWN';
      default: 
        return key.toUpperCase().replace('-', ' ');
    }
  };

  const getTotalExercises = () => {
    if (subsections.length > 0) {
      return subsections.reduce((total, subsection) => total + subsection.exercises.length, 0);
    } else if (allExercises && allExercises.length > 0) {
      return allExercises.length;
    }
    return 0;
  };

  const areAllExercisesComplete = () => {
    const totalExercises = getTotalExercises();
    return totalExercises > 0 && completedExercises.size === totalExercises;
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <p>Loading workout sections...</p>
      </div>
    );
  }

  if (subsections.length === 0) {
    // Fallback to using allExercises if no subsections found
    if (allExercises && allExercises.length > 0) {
      // Group exercises by their section (assuming they have a section property or we group them by order)
      const groupedExercises = {
        warmup: allExercises.filter(ex => ex.section === 'warmup' || ex.order < 100),
        main: allExercises.filter(ex => ex.section === 'main' || (ex.order >= 100 && ex.order < 900)),
        cooldown: allExercises.filter(ex => ex.section === 'cooldown' || ex.order >= 900)
      };

      const sectionOrder = ['warmup', 'main', 'cooldown'];
      const orderedSections = sectionOrder.filter(key => groupedExercises[key].length > 0);

      return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {orderedSections.map((sectionKey, sectionIndex) => {
            const exercises = groupedExercises[sectionKey];
            
            return (
              <div key={sectionKey}>
                {/* Section Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      {getSectionTitle(sectionKey)}
                    </h2>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {exercises.length} EXERCISE{exercises.length !== 1 ? 'S' : ''}
                    </span>
                  </div>
                </div>

                {/* Exercise List */}
                <div className="space-y-3 mb-8">
                  {exercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => onExerciseClick(exercise)}
                    >
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {exercise.imageUrl ? (
                          <img
                            src={exercise.imageUrl}
                            alt={exercise.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Dumbbell className="w-8 h-8 text-gray-400" />
                        )}
                      </div>

                      {/* Exercise Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base mb-1">
                          {exercise.name}
                        </h3>
                        {exercise.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {exercise.description}
                          </p>
                        )}
                        {exercise.duration && (
                          <div className="mt-2">
                            <span className="text-orange-500 font-medium text-sm">
                              {exercise.duration}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Checkbox */}
                      <div 
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExerciseComplete(exercise.id);
                        }}
                      >
                        <Checkbox
                          checked={completedExercises.has(exercise.id)}
                          className="w-6 h-6 rounded-full border-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section Divider */}
                {sectionIndex < orderedSections.length - 1 && (
                  <div className="border-t border-gray-200 my-8"></div>
                )}
              </div>
            );
          })}

          {/* Complete Workout Button */}
          <div className="sticky bottom-0 bg-white pt-6 pb-4 border-t border-gray-200">
            <Button
              onClick={handleWorkoutComplete}
              disabled={!areAllExercisesComplete() || isWorkoutComplete}
              className={`
                w-full py-4 text-lg font-bold rounded-full transition-all duration-200
                ${isWorkoutComplete 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : areAllExercisesComplete() 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isWorkoutComplete ? '✅ Workout Completed!' : 'Complete Workout'}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Exercise List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No workout sections found.</p>
        </CardContent>
      </Card>
    );
  }

  // Group exercises by section
  const groupedSections = subsections.reduce((acc, subsection) => {
    const sectionKey = subsection.section_key;
    if (!acc[sectionKey]) {
      acc[sectionKey] = {
        exercises: [],
        subsections: []
      };
    }
    acc[sectionKey].subsections.push(subsection);
    return acc;
  }, {} as Record<string, { exercises: Exercise[], subsections: WorkoutSubsection[] }>);

  // Define subsection ordering within each section
  const getSubsectionOrder = (sectionKey: string, subsectionTitle: string) => {
    const normalizedTitle = subsectionTitle.toLowerCase().trim();
    
    if (sectionKey === 'warm-up') {
      if (normalizedTitle.includes('foam rolling')) return 1;
      if (normalizedTitle.includes('mobility')) return 2;
      if (normalizedTitle.includes('prep')) return 3;
      if (normalizedTitle.includes('prime')) return 4;
    } else if (sectionKey === 'main-workout') {
      if (normalizedTitle.includes('main lifts')) return 1;
      if (normalizedTitle.includes('accessory lifts')) return 2;
      if (normalizedTitle.includes('finisher')) return 3;
    }
    
    return 999; // Default for unmatched subsections
  };

  // Sort subsections within each section
  Object.keys(groupedSections).forEach(sectionKey => {
    groupedSections[sectionKey].subsections.sort((a, b) => {
      const orderA = getSubsectionOrder(sectionKey, a.subsection_title);
      const orderB = getSubsectionOrder(sectionKey, b.subsection_title);
      return orderA - orderB;
    });
    
    // Now populate exercises in the correct order
    groupedSections[sectionKey].exercises = [];
    groupedSections[sectionKey].subsections.forEach(subsection => {
      groupedSections[sectionKey].exercises.push(...subsection.exercises);
    });
  });

  const sectionOrder = ['warm-up', 'main-workout', 'cool-down'];
  const orderedSections = sectionOrder.filter(key => groupedSections[key]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {orderedSections.map((sectionKey, sectionIndex) => {
        const section = groupedSections[sectionKey];
        const totalExercises = section.exercises.length;
        
        return (
          <div key={sectionKey}>
            {/* Section Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {getSectionTitle(sectionKey)}
                </h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {section.subsections.length} subsection{section.subsections.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Subsections with exercises */}
            {section.subsections.map((subsection, subsectionIndex) => (
              <div key={subsection.id} className="mb-6">
                {/* Subsection Header */}
                <CleanSubsectionHeader
                  title={subsection.subsection_title}
                  instruction={subsection.repeat_count > 1 ? `Repeat ${subsection.repeat_count}x` : ''}
                  hasImageContent={subsection.exercises.some(ex => ex.imageUrl || ex.videoUrl)}
                  showIcon={!subsection.exercises.some(ex => ex.imageUrl || ex.videoUrl)}
                  icon={<Dumbbell className="w-4 h-4" />}
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
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
              </div>
            ))}

            {/* Section Divider */}
            {sectionIndex < orderedSections.length - 1 && (
              <div className="border-t border-gray-200 my-8"></div>
            )}
          </div>
        );
      })}

      {/* Complete Workout Button */}
      <div className="sticky bottom-0 bg-white pt-6 pb-4 border-t border-gray-200">
        <Button
          onClick={handleWorkoutComplete}
          disabled={!areAllExercisesComplete() || isWorkoutComplete}
          className={`
            w-full py-4 text-lg font-bold rounded-full transition-all duration-200
            ${isWorkoutComplete 
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : areAllExercisesComplete() 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isWorkoutComplete ? '✅ Workout Completed!' : 'Complete Workout'}
        </Button>
      </div>
    </div>
  );
};

export default WorkoutPlayerDisplay;