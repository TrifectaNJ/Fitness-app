import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useExerciseCompletionPersistent } from '@/hooks/useExerciseCompletionPersistent';
import { Crown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface WorkoutCompletionButtonProps {
  workoutId: string;
  subsections: any[];
  onComplete?: () => void;
}

const WorkoutCompletionButton: React.FC<WorkoutCompletionButtonProps> = ({
  workoutId,
  subsections,
  onComplete
}) => {
  const [user, setUser] = useState<any>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { 
    isExerciseComplete, 
    markWorkoutComplete,
    completions
  } = useExerciseCompletionPersistent(workoutId, user?.id);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Use useMemo to calculate if all exercises are complete
  // This will automatically recalculate when completions or subsections change
  const allComplete = useMemo(() => {
    if (!subsections || subsections.length === 0) return false;
    
    let totalExercises = 0;
    let completedExercises = 0;
    
    for (const subsection of subsections) {
      if (!subsection.exercises || subsection.exercises.length === 0) continue;
      
      for (const exercise of subsection.exercises) {
        totalExercises++;
        if (isExerciseComplete(exercise.id)) {
          completedExercises++;
        }
      }
    }
    
    console.log(`Completion check: ${completedExercises}/${totalExercises} exercises complete`);
    return totalExercises > 0 && completedExercises === totalExercises;
  }, [completions, subsections, isExerciseComplete]);

  const handleCompleteWorkout = async () => {
    if (!user || isCompleting || !allComplete) return;

    setIsCompleting(true);
    try {
      // Mark workout as complete
      await markWorkoutComplete();
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Don't call onComplete here - wait for user to click "Awesome!"
    } catch (error) {
      console.error('Error completing workout:', error);
    } finally {
      setIsCompleting(false);
    }
  };
  const [isLoading, setIsLoading] = useState(false);

  const handleAwesomeClick = async () => {
    setShowSuccessModal(false);
    setIsLoading(true);
    
    // Show loading screen for 1.5 seconds, then call onComplete
    setTimeout(() => {
      setIsLoading(false);
      if (onComplete) {
        onComplete();
      }
    }, 1500);
  };

  return (
    <>
      <div className="sticky bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={handleCompleteWorkout}
            disabled={isCompleting || !allComplete}
            className={`w-full font-semibold py-4 text-lg rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl ${
              allComplete 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
            size="lg"
          >
            {isCompleting ? 'Completing...' : allComplete ? '🎉 Complete Workout' : 'Complete All Exercises First'}
          </Button>
        </div>
      </div>

      <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-600 text-xl">🎉 Workout Complete!</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Congratulations! You've successfully completed this workout. Great job on finishing all the exercises!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={handleAwesomeClick}
              className="bg-green-600 hover:bg-green-700"
            >
              Awesome!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Loading Screen */}
      {isLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center z-[9999]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto animate-spin">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <p className="text-xl text-gray-600 font-medium">Loading your fitness journey...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkoutCompletionButton;