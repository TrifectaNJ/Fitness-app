import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Exercise } from '@/types/fitness';

interface ExerciseItemProps {
  exercise: Exercise;
  isCompleted: boolean;
  onComplete: () => void;
  onExerciseClick: (exercise: Exercise) => void;
}

const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  isCompleted,
  onComplete,
  onExerciseClick
}) => {
  return (
    <Card className={`border-l-4 border-l-red-500 ${isCompleted ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden cursor-pointer"
            onClick={() => onExerciseClick(exercise)}
          >
            {exercise.imageUrl ? (
              <img 
                src={exercise.imageUrl} 
                alt={exercise.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs text-gray-500">IMG</span>
              </div>
            )}
          </div>
          <div className="flex-1 cursor-pointer" onClick={() => onExerciseClick(exercise)}>
            <h4 className="font-medium">{exercise.name}</h4>
            <p className="text-sm text-gray-600">
              {exercise.duration ? `${exercise.duration}s` : `${exercise.reps} reps`}
            </p>
            {exercise.description && (
              <p className="text-xs text-gray-500 mt-1">{exercise.description}</p>
            )}
            {/* Show exercise steps/instructions */}
            {exercise.instructions && exercise.instructions.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-gray-700">Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 pl-2">
                  {exercise.instructions.map((instruction, index) => (
                    <li key={index} className="leading-relaxed">
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
          <Button
            onClick={onComplete}
            variant={isCompleted ? "default" : "outline"}
            size="sm"
            className={`${isCompleted ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-green-50'}`}
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseItem;