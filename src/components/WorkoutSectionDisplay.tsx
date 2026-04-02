import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { WorkoutSection, Exercise } from '@/types/fitness';

interface WorkoutSectionDisplayProps {
  section: WorkoutSection;
  onExerciseClick: (exercise: Exercise) => void;
  currentExerciseIndex?: number;
  completedExercises?: number[];
}

const WorkoutSectionDisplay: React.FC<WorkoutSectionDisplayProps> = ({
  section,
  onExerciseClick,
  currentExerciseIndex = -1,
  completedExercises = []
}) => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">{section.section_title}</CardTitle>
          {section.repeat_count && section.repeat_count > 0 && (
            <Badge variant="outline" className="text-sm">
              Repeat {section.repeat_count} Times
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {section.exercises.map((exercise, index) => {
            const globalIndex = currentExerciseIndex;
            const isActive = globalIndex === index;
            const isCompleted = completedExercises.includes(index);
            
            return (
              <div
                key={exercise.id}
                onClick={() => onExerciseClick(exercise)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  isActive ? 'border-purple-200 bg-purple-50' : 
                  isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
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
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-500">IMG</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-lg">{exercise.name}</div>
                    <div className="text-sm text-gray-600">
                      {exercise.sets || 1} sets × {exercise.reps || exercise.duration} {exercise.reps ? 'reps' : 'sec'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {isActive && (
                      <Badge variant="default" className="bg-purple-500">
                        Current
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutSectionDisplay;