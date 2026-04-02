import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Workout, Exercise } from '@/types/fitness';
import { ArrowLeft } from 'lucide-react';
import ExerciseDetailView from './ExerciseDetailView';
import ModernExerciseDetailView from './ModernExerciseDetailView';
import WorkoutPlayerDisplayUpdated from './WorkoutPlayerDisplayUpdated';
import ExerciseItem from './ExerciseItem';
import { supabase } from '@/lib/supabase';

interface WorkoutPlayerProps {
  workout: Workout;
  onBack: () => void;
  onComplete?: () => void;
  programId?: string;
  dayId?: string;
}

const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({ workout, onBack, onComplete, programId, dayId }) => {
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<any>(null);
  const [hasWorkoutSubsections, setHasWorkoutSubsections] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
    checkForWorkoutSubsections();
  }, [workout.id]);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      // Load existing exercise completions for this workout
      await loadExerciseCompletions(user.id);
    }
  };

  const loadExerciseCompletions = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('exercise_completions')
        .select('exercise_id')
        .eq('user_id', userId)
        .eq('workout_id', workout.id);

      if (data) {
        const completedSet = new Set(data.map(item => item.exercise_id));
        setCompletedExercises(completedSet);
      }
    } catch (error) {
      console.error('Error loading exercise completions:', error);
    }
  };

  const checkForWorkoutSubsections = async () => {
    try {
      const { data } = await supabase
        .from('workout_subsections')
        .select('id')
        .eq('workout_id', workout.id)
        .limit(1);

      const hasSubsections = data && data.length > 0;
      setHasWorkoutSubsections(hasSubsections);
      
      if (!hasSubsections) {
        const exercises = workout.exercises || 
          [...(workout.warmUpExercises || []), ...(workout.mainExercises || []), ...(workout.coolDownExercises || [])]
            .sort((a, b) => a.order - b.order);
        setAllExercises(exercises);
      }
    } catch (error) {
      console.error('Error checking workout subsections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseClick = (exercise: Exercise, subsection?: any) => {
    setSelectedExercise(exercise);
    setSelectedSubsection(subsection);
    setShowExerciseDetail(true);
  };

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

  const areAllExercisesComplete = () => {
    return allExercises.length > 0 && completedExercises.size === allExercises.length;
  };

  // Check if all exercises in subsection-based workouts are complete
  const areAllSubsectionExercisesComplete = () => {
    // This will be handled by WorkoutPlayerDisplayUpdated
    return false; // Let the updated component handle completion
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <p>Loading workout...</p>
      </div>
    );
  }

  if (showExerciseDetail && selectedExercise) {
    // Use the updated component for workouts with subsections
    // Use the updated component for workouts with subsections
    if (hasWorkoutSubsections && selectedSubsection) {
      return (
        <ModernExerciseDetailView 
          exercise={selectedExercise}
          workoutId={workout.id}
          totalSets={selectedSubsection.repeat_count || 1}
          onBack={() => { 
            setShowExerciseDetail(false); 
            setSelectedExercise(null);
            setSelectedSubsection(null);
          }}
          onComplete={() => {
            setShowExerciseDetail(false);
            setSelectedExercise(null);
            setSelectedSubsection(null);
            window.dispatchEvent(new CustomEvent('exerciseCompleted'));
          }}
        />
      );
    }
    
    // Use original component for legacy workouts
    return (
      <ExerciseDetailView 
        exercise={selectedExercise} 
        onBack={() => { 
          setShowExerciseDetail(false); 
          setSelectedExercise(null); 
        }}
        onComplete={() => {
          toggleExerciseComplete(selectedExercise.id);
          setShowExerciseDetail(false);
          setSelectedExercise(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {hasWorkoutSubsections ? (
        <WorkoutPlayerDisplayUpdated 
          workoutId={workout.id}
          currentExerciseIndex={0}
          allExercises={allExercises}
          onExerciseClick={handleExerciseClick}
          onComplete={onComplete}
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exercise List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allExercises.length === 0 ? (
                  <p className="text-gray-500">No exercises found for this workout.</p>
                ) : (
                  allExercises.map((exercise) => (
                    <ExerciseItem
                      key={exercise.id}
                      exercise={exercise}
                      isCompleted={completedExercises.has(exercise.id)}
                      onComplete={() => toggleExerciseComplete(exercise.id)}
                      onExerciseClick={handleExerciseClick}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          {allExercises.length > 0 && areAllExercisesComplete() && (
            <div className="text-center py-8">
              <div className="text-2xl font-bold text-green-600 mb-4">🎉 All Exercises Complete!</div>
              <Button 
                onClick={onComplete}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
              >
                Complete Workout
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkoutPlayer;