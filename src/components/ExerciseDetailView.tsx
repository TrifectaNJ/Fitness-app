import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import { Exercise } from '@/types/fitness';
import { useDesign } from '@/contexts/DesignContext';
import { useExerciseCompletionPersistent } from '@/hooks/useExerciseCompletionPersistent';
import { supabase } from '@/lib/supabase';

interface ExerciseDetailViewProps {
  exercise: Exercise;
  onBack: () => void;
  onComplete?: () => void;
}

const ExerciseDetailView: React.FC<ExerciseDetailViewProps> = ({ exercise, onBack, onComplete }) => {
  const { settings } = useDesign();
  const [timer, setTimer] = useState(exercise.duration || 0);
  const [isRunning, setIsRunning] = useState(false);
  const [initialTime] = useState(exercise.duration || 0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Auto-complete and return when timer finishes
            if (onComplete) {
              setTimeout(() => {
                onComplete();
              }, 500); // Small delay to show completion
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timer, onComplete, onBack]);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Workout
        </Button>
      </div>

      {/* Video/Media Section - Prioritize video over image */}
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
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-3xl font-bold" style={{ color: settings.primaryColor }}>
            {exercise.reps || exercise.duration || 5}
          </div>
          <div className="text-sm text-gray-600">
            {exercise.reps ? 'Reps' : 'Duration'}
          </div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-3xl font-bold" style={{ color: settings.primaryColor }}>
            {exercise.sets || 1}
          </div>
          <div className="text-sm text-gray-600">Sets</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-3xl font-bold" style={{ color: settings.primaryColor }}>
            {exercise.restTime || 60}
          </div>
          <div className="text-sm text-gray-600">Rest (s)</div>
        </div>
      </div>

      {/* Timer Section */}
      {exercise.duration && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-6xl font-bold mb-4" style={{ color: settings.primaryColor }}>
              {formatTime(timer)}
            </div>
            <div className="flex gap-2 justify-center">
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
          </CardContent>
        </Card>
      )}
      
      {/* Instructions - Show if available */}
      {exercise.instructions && exercise.instructions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>HOW TO PERFORM:</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              {exercise.instructions.map((instruction, index) => (
                <li key={index} className="text-gray-700 leading-relaxed">
                  {instruction}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExerciseDetailView;