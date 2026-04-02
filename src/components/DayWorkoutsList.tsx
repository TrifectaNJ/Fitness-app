import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Play, ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react';
import WorkoutLoadingSkeleton from './WorkoutLoadingSkeleton';
import { supabase } from '@/lib/supabase';

interface DayWorkoutsListProps {
  selectedDay: any;
  allWorkoutsComplete: boolean;
  onBack: () => void;
  onStartWorkout: (workout: any) => void;
  isWorkoutCompleted: (workout: any, day: any) => boolean;
  gradientStyle: any;
  onDayComplete?: (day: any) => void;
}

const DayWorkoutsList: React.FC<DayWorkoutsListProps> = ({
  selectedDay,
  allWorkoutsComplete,
  onBack,
  onStartWorkout,
  isWorkoutCompleted,
  gradientStyle,
  onDayComplete
}) => {
  // Remove auto-navigation - let user manually return
  // useEffect(() => {
  //   if (allWorkoutsComplete && selectedDay.workouts && selectedDay.workouts.length > 0) {
  //     const timer = setTimeout(() => {
  //       onBack();
  //     }, 3000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [allWorkoutsComplete, selectedDay.workouts, onBack]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Program
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Day {selectedDay.order || 1}: {selectedDay.title}</CardTitle>
          {selectedDay.description && (
            <p className="text-gray-600">{selectedDay.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedDay.workouts && selectedDay.workouts.map((workout: any) => (
            <div key={workout.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    {workout.title || workout.name}
                    {isWorkoutCompleted(workout, selectedDay) && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Clock className="w-4 h-4" />
                    {workout.duration || 30} min
                  </div>
                </div>
                <Button
                  onClick={() => onStartWorkout(workout)}
                  size="sm"
                  style={gradientStyle}
                  className="text-white"
                  disabled={isWorkoutCompleted(workout, selectedDay)}
                >
                  <Play className="w-4 h-4 mr-1" />
                  {isWorkoutCompleted(workout, selectedDay) ? 'Completed' : 'Start'}
                </Button>
              </div>
            </div>
          ))}
          
          {allWorkoutsComplete && (
            <div className="text-center py-6 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600 mb-2">🎉 Day Complete!</div>
              <p className="text-green-700">Great job completing all workouts for today!</p>
              <Button
                onClick={onBack}
                className="mt-4"
                style={gradientStyle}
              >
                Return to Program Schedule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DayWorkoutsList;