import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Dumbbell, Info } from 'lucide-react';
import { Exercise } from '@/types/fitness';

interface EnhancedExerciseItemProps {
  exercise: Exercise;
  isCompleted: boolean;
  onComplete: () => void;
  onExerciseClick: (exercise: Exercise) => void;
}

const EnhancedExerciseItem: React.FC<EnhancedExerciseItemProps> = ({
  exercise,
  isCompleted,
  onComplete,
  onExerciseClick
}) => {
  return (
    <Card 
      className={`
        group cursor-pointer transition-all duration-200 
        ${isCompleted ? 'bg-green-50 border-green-200 shadow-sm' : 'hover:shadow-md hover:bg-gray-50'}
        border rounded-xl overflow-hidden
      `}
      onClick={() => onExerciseClick(exercise)}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-4 p-4">
          {/* Thumbnail */}
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
            {exercise.imageUrl ? (
              <img 
                src={exercise.imageUrl} 
                alt={exercise.name}
                className="w-full h-full object-cover"
              />
            ) : exercise.videoUrl ? (
              <video 
                src={exercise.videoUrl}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <Dumbbell className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
            )}
          </div>
          
          {/* Exercise Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-base md:text-lg truncate">
              {exercise.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-orange-600">
                {exercise.duration ? `0:${String(exercise.duration).padStart(2, '0')}` : `${exercise.reps} reps`}
              </span>
            </div>
            {exercise.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {exercise.description}
              </p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onExerciseClick(exercise);
              }}
            >
              <Info className="w-4 h-4 text-gray-500" />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              variant={isCompleted ? "default" : "outline"}
              size="sm"
              className={`
                w-8 h-8 p-0 rounded-full transition-all
                ${isCompleted 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'border-gray-300 hover:bg-green-50 hover:border-green-300'
                }
              `}
            >
              <Check className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedExerciseItem;