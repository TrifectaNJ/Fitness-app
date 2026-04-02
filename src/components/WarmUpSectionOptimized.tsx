import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Exercise } from '@/types/fitness';
import { Dumbbell, Check } from 'lucide-react';
import { useExerciseCompletionPersistent } from '@/hooks/useExerciseCompletionPersistent';
import CleanSubsectionHeader from '@/components/CleanSubsectionHeader';

interface WarmUpSubsection {
  id: string;
  subsection_title: string;
  repeat_count: number;
  sort_order: number;
  section_key: string;
  exercises: Exercise[];
}

interface WarmUpSectionOptimizedProps {
  workoutId: string;
  currentExerciseIndex: number;
  allExercises: Exercise[];
  onExerciseClick: (exercise: Exercise, subsection?: any) => void;
  subsections: WarmUpSubsection[];
  userId: string;
}

const WarmUpSectionOptimized: React.FC<WarmUpSectionOptimizedProps> = ({
  workoutId,
  currentExerciseIndex,
  allExercises,
  onExerciseClick,
  subsections,
  userId
}) => {
  const { 
    isExerciseComplete, 
    getExerciseProgress, 
    markExerciseComplete, 
    resetExercise
  } = useExerciseCompletionPersistent(workoutId, userId);

  const handleExerciseClick = (exercise: Exercise, subsection: WarmUpSubsection) => {
    onExerciseClick(exercise, subsection);
  };

  const handleExerciseToggle = async (exerciseId: string, subsection: WarmUpSubsection) => {
    const isCompleted = isExerciseComplete(exerciseId);
    const totalSets = subsection.repeat_count;

    if (isCompleted) {
      await resetExercise(exerciseId);
    } else {
      for (let i = 0; i < totalSets; i++) {
        await markExerciseComplete(exerciseId, totalSets);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">WARM-UP</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {subsections.length} subsection{subsections.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {subsections.map((subsection) => (
        <div key={subsection.id} className="mb-6">
          <CleanSubsectionHeader
            title={subsection.subsection_title}
            instruction=""
            hasImageContent={subsection.exercises.some(ex => ex.imageUrl || ex.videoUrl)}
            showIcon={!subsection.exercises.some(ex => ex.imageUrl || ex.videoUrl)}
            icon={<Dumbbell className="w-4 h-4" />}
          />

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-4">
                {subsection.exercises.map((exercise) => {
                  const isCompleted = isExerciseComplete(exercise.id);
                  const progress = getExerciseProgress(exercise.id);
                  const isCurrent = allExercises[currentExerciseIndex]?.id === exercise.id;
                  const totalSets = subsection.repeat_count;
                  
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
                      
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 ml-3 mr-4">
                        <div className="w-14 h-14 rounded-lg overflow-hidden shadow-sm">
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
                              <Dumbbell className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
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

export default WarmUpSectionOptimized;