import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FitnessProgram, ProgramDay, Workout } from '@/types/fitness';
import { ArrowLeft, CheckCircle, Clock, Target } from 'lucide-react';
import { useDesign } from '@/contexts/DesignContext';
import { useFitness } from '@/contexts/FitnessContext';
import WorkoutPlayer from './WorkoutPlayer';

interface ProgramPlayerProps {
  program: FitnessProgram;
  onBack: () => void;
}

const ProgramPlayer: React.FC<ProgramPlayerProps> = ({ program, onBack }) => {
  const { settings } = useDesign();
  const { completedWorkouts, isDayCompleted } = useFitness();
  const [currentView, setCurrentView] = useState<'overview' | 'workout'>('overview');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [selectedDay, setSelectedDay] = useState<ProgramDay | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    setCurrentView('overview');
    setSelectedWorkout(null);
    setSelectedDay(null);
  }, [program.id]);

  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [completedWorkouts]);

  const startWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setCurrentView('workout');
  };

  const backToOverview = () => {
    setCurrentView('overview');
    setSelectedWorkout(null);
    setSelectedDay(null);
    setForceUpdate(prev => prev + 1);
  };

  const selectDay = (day: ProgramDay) => {
    setSelectedDay(day);
  };

  if (currentView === 'workout' && selectedWorkout && selectedDay) {
    return (
      <WorkoutPlayer
        workout={selectedWorkout}
        onBack={backToOverview}
        programId={program.id}
        dayId={selectedDay.id}
      />
    );
  }

  if (selectedDay) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedDay(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Badge variant="outline">Day {selectedDay.dayNumber}</Badge>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">{selectedDay.title}</h1>
          {selectedDay.description && (
            <p className="text-gray-600">{selectedDay.description}</p>
          )}
        </div>

        {selectedDay.workouts && selectedDay.workouts.length > 0 ? (
          <div className="space-y-4">
            {selectedDay.workouts.map((workout) => (
              <div key={workout.id} className="space-y-4">
                <Button
                  onClick={() => startWorkout(workout)}
                  className="w-full py-4 text-lg font-semibold"
                  style={{ backgroundColor: '#DC2626', color: 'white' }}
                >
                  Start Workout
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No workouts available for this day.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-4">{program.title}</h1>
        
        {program.days && program.days.length > 0 && (
          <div className="flex justify-center gap-2 mb-6 overflow-x-auto pb-2">
            {program.days.slice(0, 7).map((day) => {
              const isCompleted = isDayCompleted(day.id, day.workouts || []);
              
              return (
                <div key={`${day.id}-${forceUpdate}`} className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div 
                    className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 ${
                      isCompleted ? 'bg-green-500 border-green-500' :
                      'border-gray-300 bg-gray-50'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <span className="text-sm font-medium text-gray-500">
                        {day.dayNumber}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600">Day {day.dayNumber}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {program.days && program.days.length > 0 && (
        <Card className="overflow-hidden">
          <div className="relative h-48 bg-gray-100">
            {program.imageUrl ? (
              <img 
                src={program.imageUrl} 
                alt={program.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">Workout</span>
              </div>
            )}
          </div>
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2">{program.days[0]?.title || 'Today\'s Workout'}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{program.days[0]?.workouts?.[0]?.duration || 17} Minutes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>{program.category}</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => program.days?.[0] && selectDay(program.days[0])}
              className="w-full py-3 text-lg font-semibold"
              style={{ backgroundColor: '#DC2626', color: 'white' }}
            >
              GO TO WORKOUT
            </Button>
          </CardContent>
        </Card>
      )}

      {(!program.days || program.days.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No workout days have been added to this program yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgramPlayer;