import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, RotateCcw, Check } from 'lucide-react';
import { Exercise } from '@/types/fitness';
import { useDesign } from '@/contexts/DesignContext';
import { useExerciseCompletionPersistent } from '@/hooks/useExerciseCompletionPersistent';
import { supabase } from '@/lib/supabase';

interface ExerciseDetailViewUpdatedProps {
  exercise: Exercise;
  workoutId: string;
  totalSets?: number;
  onBack: () => void;
  onComplete?: () => void;
}

const ExerciseDetailViewUpdated: React.FC<ExerciseDetailViewUpdatedProps> = ({ 
  exercise, 
  workoutId,
  totalSets = 1,
  onBack, 
  onComplete 
}) => {
  const { settings } = useDesign();
  const [timer, setTimer] = useState(exercise.duration || 0);
  const [isRunning, setIsRunning] = useState(false);
  const [initialTime] = useState(exercise.duration || 0);
  const [user, setUser] = useState<any>(null);
  const [currentSet, setCurrentSet] = useState(1);
  const [showCompletion, setShowCompletion] = useState(false);

  const { 
    markExerciseComplete, 
    isExerciseComplete, 
    getExerciseProgress,
    refreshCompletions
  } = useExerciseCompletionPersistent(workoutId, user?.id);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      const progress = getExerciseProgress(exercise.id);
      setCurrentSet(progress.completed + 1);
    }
  }, [user, exercise.id, getExerciseProgress]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Automatically complete the set when timer reaches 0
            setTimeout(() => handleSetComplete(), 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timer]);

  const handleSetComplete = async () => {
    if (!user) return;
    
    console.log('Completing set for exercise:', exercise.id, 'Total sets:', totalSets);
    
    // Mark this set as complete
    const result = await markExerciseComplete(exercise.id, totalSets);
    
    if (result) {
      // Force refresh completions to ensure UI updates
      setTimeout(async () => {
        await refreshCompletions();
        
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('exerciseCompleted', {
          detail: { exerciseId: exercise.id, workoutId }
        }));
        
        // Get updated progress
        const progress = getExerciseProgress(exercise.id);
        console.log('Updated progress:', progress);
        
        if (progress.completed >= totalSets) {
          // All sets completed
          setShowCompletion(true);
          setTimeout(() => {
            if (onComplete) {
              onComplete();
            } else {
              onBack();
            }
          }, 2000);
        } else {
          // More sets to go
          setCurrentSet(progress.completed + 1);
          resetTimer();
        }
      }, 100);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setTimer(initialTime);
    setIsRunning(false);
  };

  const progress = getExerciseProgress(exercise.id);
  const isCompleted = isExerciseComplete(exercise.id);

  if (showCompletion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <div className="bg-green-100 p-8 rounded-full mb-6">
          <Check className="w-16 h-16 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Exercise Complete!</h2>
        <p className="text-green-700">Great job completing {exercise.name}</p>
        <p className="text-sm text-gray-600 mt-2">Returning to workout...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Workout
        </Button>
      </div>



      {/* Completion indicator */}
      {isCompleted && (
        <div className="bg-green-100 rounded-lg p-4">
          <div className="flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-600 font-medium">Exercise Complete!</span>
          </div>
        </div>
      )}

      {/* Video/Media Section */}
      <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
        {exercise.videoUrl ? (
          <video 
            src={exercise.videoUrl} 
            controls
            className="w-full h-full object-cover"
            poster={exercise.imageUrl}
          >
            Your browser does not support the video tag.
          </video>
        ) : exercise.imageUrl ? (
          <img 
            src={exercise.imageUrl} 
            alt={exercise.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-500">Exercise Media</span>
          </div>
        )}
      </div>
      
      {/* Exercise Info */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">{exercise.name}</h1>
        {exercise.description && (
          <p className="text-gray-600 mb-4">{exercise.description}</p>
        )}
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-3xl font-bold" style={{ color: settings.primaryColor }}>
            {exercise.reps || exercise.duration || 30}
          </div>
          <div className="text-sm text-gray-600">
            {exercise.reps ? 'REPS' : 'DURATION'}
          </div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-3xl font-bold" style={{ color: settings.primaryColor }}>
            {exercise.restTime || 60}
          </div>
          <div className="text-sm text-gray-600">REST (S)</div>
        </div>
      </div>

      {/* Timer Section */}
      {exercise.duration && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-6xl font-bold mb-4" style={{ color: settings.primaryColor }}>
              {formatTime(timer)}
            </div>
            <div className="flex gap-2 justify-center mb-4">
              <Button
                onClick={() => setIsRunning(!isRunning)}
                className="px-6 py-2"
                style={{ backgroundColor: settings.primaryColor }}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button
                onClick={resetTimer}
                variant="outline"
                className="px-6 py-2"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
            {timer === 0 && (
              <Button
                onClick={handleSetComplete}
                className="w-full py-3 text-lg font-semibold"
                style={{ backgroundColor: settings.primaryColor }}
              >
                Complete
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Exercise Instructions/Steps */}
      {exercise.instructions && exercise.instructions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Exercise Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              {exercise.instructions.map((instruction, index) => (
                <li key={index} className="leading-relaxed pl-2">
                  {instruction}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Manual Complete for non-timed exercises */}
      {!exercise.duration && (
        <Button
          onClick={handleSetComplete}
          className="w-full py-3 text-lg font-semibold"
          style={{ backgroundColor: settings.primaryColor }}
        >
          Complete
        </Button>
      )}
    </div>
  );
};

export default ExerciseDetailViewUpdated;