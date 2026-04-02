import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import { Exercise } from '@/types/fitness';
import { useExerciseCompletionPersistent } from '@/hooks/useExerciseCompletionPersistent';
import { supabase } from '@/lib/supabase';

interface ModernExerciseDetailViewProps {
  exercise: Exercise;
  workoutId: string;
  totalSets?: number;
  onBack: () => void;
  onComplete?: () => void;
}

const ModernExerciseDetailView: React.FC<ModernExerciseDetailViewProps> = ({ 
  exercise, 
  workoutId,
  totalSets = 1,
  onBack, 
  onComplete 
}) => {
  const [timer, setTimer] = useState(exercise.duration || 30);
  const [isRunning, setIsRunning] = useState(false);
  const [initialTime] = useState(exercise.duration || 30);
  const [user, setUser] = useState<any>(null);
  const [currentSet, setCurrentSet] = useState(1);

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
    let interval: NodeJS.Timeout;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setIsRunning(false);
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
    
    await markExerciseComplete(exercise.id, totalSets);
    
    setTimeout(async () => {
      await refreshCompletions();
      
      window.dispatchEvent(new CustomEvent('exerciseCompleted', {
        detail: { exerciseId: exercise.id, workoutId }
      }));
      
      const progress = getExerciseProgress(exercise.id);
      
      if (progress.completed >= totalSets) {
        if (onComplete) {
          onComplete();
        } else {
          onBack();
        }
      } else {
        setCurrentSet(progress.completed + 1);
        resetTimer();
      }
    }, 100);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workout
          </Button>
        </div>
      </div>

      {/* Video Section */}
      <div className="bg-black">
        <div className="max-w-4xl mx-auto">
          {exercise.videoUrl ? (
            <video 
              src={exercise.videoUrl} 
              controls
              className="w-full aspect-video"
              poster={exercise.imageUrl}
            />
          ) : exercise.imageUrl ? (
            <img 
              src={exercise.imageUrl} 
              alt={exercise.name}
              className="w-full aspect-video object-cover"
            />
          ) : (
            <div className="w-full aspect-video bg-gray-800 flex items-center justify-center">
              <span className="text-white text-lg">Exercise Video</span>
            </div>
          )}
        </div>
      </div>

      {/* Exercise Info */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{exercise.name}</h1>
          <p className="text-gray-600 text-lg">{exercise.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {exercise.duration || 30}
            </div>
            <div className="text-gray-500 text-sm uppercase tracking-wide">Duration</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">60</div>
            <div className="text-gray-500 text-sm uppercase tracking-wide">Rest (s)</div>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center mb-8">
          <div className="text-8xl font-bold text-blue-600 mb-6">
            {formatTime(timer)}
          </div>
          <div className="flex justify-center gap-4 mb-6">
            <Button
              onClick={() => setIsRunning(!isRunning)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-full"
            >
              {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            <Button
              onClick={resetTimer}
              variant="outline"
              size="lg"
              className="px-8 py-4 rounded-full"
            >
              <RotateCcw className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Instructions */}
        {exercise.instructions && exercise.instructions.length > 0 && (
          <div className="bg-white rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Exercise Steps</h3>
            <ol className="space-y-3">
              {exercise.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start">
                  <span className="bg-gray-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 leading-relaxed">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Complete Button */}
        <Button
          onClick={handleSetComplete}
          className="w-full py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Complete
        </Button>
      </div>
    </div>
  );
};

export default ModernExerciseDetailView;