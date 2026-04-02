import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Calendar, Dumbbell, Clock, Play, ChevronRight } from 'lucide-react';

interface PersonalizedProgram {
  id: string;
  title: string;
  description: string;
  exercises: Array<{
    exercise_id: string;
    exercise: {
      name: string;
      description: string;
      category: string;
      muscle_groups: string[];
    };
    sets: number;
    reps: string;
    rest_seconds: number;
    notes: string;
    order: number;
  }>;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  creator_profile?: { name: string };
}

interface PersonalizedProgramCardProps {
  program: PersonalizedProgram;
  onStartWorkout?: (program: PersonalizedProgram) => void;
}

export const PersonalizedProgramCard: React.FC<PersonalizedProgramCardProps> = ({ 
  program, 
  onStartWorkout 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatRestTime = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    return `${seconds}s`;
  };

  const totalExercises = program.exercises?.length || 0;
  const estimatedDuration = program.exercises?.reduce((total, ex) => {
    const exerciseTime = ex.sets * 45; // Assume 45 seconds per set
    const restTime = ex.sets * ex.rest_seconds;
    return total + exerciseTime + restTime;
  }, 0) || 0;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-white">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50">
                  <User className="w-3 h-3 mr-1" />
                  Personalized by Your Coach
                </Badge>
                <Badge className={getStatusColor(program.status)}>
                  {program.status}
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                {program.title}
              </CardTitle>
              <p className="text-sm text-gray-600 line-clamp-2">
                {program.description}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Dumbbell className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">{totalExercises}</span>
              <span className="text-xs text-gray-500">Exercises</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatDuration(estimatedDuration)}
              </span>
              <span className="text-xs text-gray-500">Duration</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {new Date(program.created_at).toLocaleDateString()}
              </span>
              <span className="text-xs text-gray-500">Created</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDetails(true)}
              className="flex-1"
            >
              View Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            {program.status === 'active' && (
              <Button 
                size="sm" 
                onClick={() => onStartWorkout?.(program)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
            )}
          </div>

          {program.creator_profile?.name && (
            <div className="text-xs text-gray-500 text-center pt-2 border-t">
              Created by {program.creator_profile.name}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-purple-600" />
              {program.title}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-gray-600">{program.description}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Exercises ({totalExercises})</h4>
                <div className="space-y-4">
                  {program.exercises?.sort((a, b) => a.order - b.order).map((exercise, index) => (
                    <Card key={`${exercise.exercise_id}-${index}`} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div>
                              <h5 className="font-semibold text-gray-900">{exercise.exercise.name}</h5>
                              <p className="text-sm text-gray-600 mt-1">{exercise.exercise.description}</p>
                              
                              <div className="flex gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {exercise.exercise.category}
                                </Badge>
                                {exercise.exercise.muscle_groups?.map(muscle => (
                                  <Badge key={muscle} variant="outline" className="text-xs">
                                    {muscle}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="font-semibold text-gray-900">{exercise.sets}</div>
                                <div className="text-gray-500">Sets</div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="font-semibold text-gray-900">{exercise.reps}</div>
                                <div className="text-gray-500">Reps</div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="font-semibold text-gray-900">
                                  {formatRestTime(exercise.rest_seconds)}
                                </div>
                                <div className="text-gray-500">Rest</div>
                              </div>
                            </div>

                            {exercise.notes && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="text-sm font-medium text-yellow-800 mb-1">Notes:</div>
                                <div className="text-sm text-yellow-700">{exercise.notes}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
            {program.status === 'active' && (
              <Button 
                onClick={() => {
                  setShowDetails(false);
                  onStartWorkout?.(program);
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Workout
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};