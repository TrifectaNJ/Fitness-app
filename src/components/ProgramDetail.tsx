import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FitnessProgram } from '@/types/fitness';
import { Clock, Star, Play, ArrowLeft, CheckCircle, RotateCcw } from 'lucide-react';
import { useDesign } from '@/contexts/DesignContext';
import WorkoutPlayer from './WorkoutPlayer';
import DayWorkoutsList from './DayWorkoutsList';
import { supabase } from '@/lib/supabase';

interface ProgramDetailProps {
  program: FitnessProgram;
  onBack: () => void;
  onStartProgram?: () => void;
}

const ProgramDetail: React.FC<ProgramDetailProps> = ({ program, onBack, onStartProgram }) => {
  const { settings } = useDesign();
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [isPlayingWorkout, setIsPlayingWorkout] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [showDayWorkouts, setShowDayWorkouts] = useState(false);
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set());
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);

  const gradientStyle = {
    background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`
  };

  // Load completed workouts from database on component mount
  // Load completed workouts from database on component mount
  useEffect(() => {
    loadCompletedWorkouts();
  }, [program.id]);

  // Add loading state for completed workouts
  const [loadingCompletions, setLoadingCompletions] = useState(true);

  const loadCompletedWorkouts = async () => {
    setLoadingCompletions(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load workout completions
      const { data: completions } = await supabase
        .from('workout_completions')
        .select('workout_name, program_id, day_number')
        .eq('user_id', user.id)
        .eq('program_id', program.id);

      // Load day completions
      const { data: dayCompletions } = await supabase
        .from('day_completions')
        .select('program_id, day_number')
        .eq('user_id', user.id)
        .eq('program_id', program.id);

      if (completions) {
        const completedSet = new Set<string>();
        completions.forEach(completion => {
          // Create unique key for workout completion
          const workoutKey = `${completion.program_id}-${completion.day_number}-${completion.workout_name}`;
          completedSet.add(workoutKey);
        });
        setCompletedWorkouts(completedSet);
      }

      if (dayCompletions) {
        const completedDaysSet = new Set<string>();
        dayCompletions.forEach(completion => {
          // Create unique key for day completion
          const dayKey = `${completion.program_id}-${completion.day_number}`;
          completedDaysSet.add(dayKey);
        });
        setCompletedDays(completedDaysSet);
      }
    } catch (error) {
      console.error('Error loading completed workouts:', error);
    } finally {
      setLoadingCompletions(false);
    }
  };

  // Handle clicking "Start Workout" - shows day's workout list
  const handleStartDay = (day: any) => {
    setSelectedDay(day);
    setShowDayWorkouts(true);
  };

  // Handle clicking specific workout from day's list
  const handleStartWorkout = (workout: any) => {
    setSelectedWorkout(workout);
    setIsPlayingWorkout(true);
    setWorkoutStartTime(new Date());
  };

  const handleBackFromWorkout = () => {
    setIsPlayingWorkout(false);
    setSelectedWorkout(null);
    setWorkoutStartTime(null);
  };

  const handleBackFromDayWorkouts = () => {
    setShowDayWorkouts(false);
    setSelectedDay(null);
  };

  const handleCompleteWorkout = async (workoutId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedWorkout || !selectedDay || !workoutStartTime) return;

      // Calculate duration
      const endTime = new Date();
      const durationMinutes = Math.round((endTime.getTime() - workoutStartTime.getTime()) / (1000 * 60));
      
      // Find the day index to get consistent day number
      const dayIndex = program.days?.findIndex(d => d.id === selectedDay.id) ?? 0;
      const dayNumber = dayIndex + 1;

      // Save workout completion to database
      await supabase.from('workout_completions').insert({
        user_id: user.id,
        program_id: program.id,
        program_name: program.title,
        day_number: dayNumber,
        workout_name: selectedWorkout.title || selectedWorkout.name,
        exercises_completed: selectedWorkout.exercises?.length || 0,
        total_exercises: selectedWorkout.exercises?.length || 0,
        completion_percentage: 100,
        duration_minutes: durationMinutes
      });

      // Update local state
      const workoutKey = `${program.id}-${dayNumber}-${selectedWorkout.title || selectedWorkout.name}`;
      const updatedCompletions = new Set(completedWorkouts).add(workoutKey);
      setCompletedWorkouts(updatedCompletions);

      // Check if all workouts in the day are now complete
      const allWorkoutsComplete = selectedDay.workouts?.every((workout: any) => {
        const wKey = `${program.id}-${dayNumber}-${workout.title || workout.name}`;
        return updatedCompletions.has(wKey);
      });

      // If day is complete, save day completion
      if (allWorkoutsComplete) {
        await supabase.from('day_completions').upsert({
          user_id: user.id,
          program_id: program.id,
          program_name: program.title,
          day_number: dayNumber,
          day_title: selectedDay.title,
          total_workouts: selectedDay.workouts?.length || 0,
          completed_workouts: selectedDay.workouts?.length || 0,
          completion_percentage: 100
        });

        // Update local day completion state
        const dayKey = `${program.id}-${dayNumber}`;
        setCompletedDays(prev => new Set(prev).add(dayKey));
      }

      console.log('Workout completion saved successfully');
    } catch (error) {
      console.error('Error saving workout completion:', error);
      // Still update UI and redirect even if database save fails
      const dayIndex = program.days?.findIndex(d => d.id === selectedDay.id) ?? 0;
      const dayNumber = dayIndex + 1;
      const workoutKey = `${program.id}-${dayNumber}-${selectedWorkout.title || selectedWorkout.name}`;
      setCompletedWorkouts(prev => new Set(prev).add(workoutKey));
    }
    
    // Auto-redirect back to Program Schedule with visual feedback
    setTimeout(() => {
      setIsPlayingWorkout(false);
      setSelectedWorkout(null);
      setWorkoutStartTime(null);
      setShowDayWorkouts(false);
      setSelectedDay(null);
    }, 2500); // Increased to 2.5 seconds to show completion message
  };

  // Handle resetting a completed day with confirmation
  const handleResetDay = async (day: any) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Reset progress for Day ${program.days?.findIndex(d => d.id === day.id) + 1}? This will clear all workouts for this day.`
    );
    
    if (!confirmed) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find the day index to get consistent day number
      const dayIndex = program.days?.findIndex(d => d.id === day.id) ?? 0;
      const dayNumber = dayIndex + 1;

      // Delete all workout completions for this day
      await supabase
        .from('workout_completions')
        .delete()
        .eq('user_id', user.id)
        .eq('program_id', program.id)
        .eq('day_number', dayNumber);

      // Delete day completion record
      await supabase
        .from('day_completions')
        .delete()
        .eq('user_id', user.id)
        .eq('program_id', program.id)
        .eq('day_number', dayNumber);

      // Delete all exercise completions for this day's workouts
      if (day.workouts) {
        for (const workout of day.workouts) {
          await supabase
            .from('exercise_completions')
            .delete()
            .eq('user_id', user.id)
            .eq('workout_id', workout.id);
        }
      }

      // Update local state - remove all workouts for this day
      const updatedCompletions = new Set(completedWorkouts);
      day.workouts?.forEach((workout: any) => {
        const workoutKey = `${program.id}-${dayNumber}-${workout.title || workout.name}`;
        updatedCompletions.delete(workoutKey);
      });
      setCompletedWorkouts(updatedCompletions);

      // Remove day from completed days
      const dayKey = `${program.id}-${dayNumber}`;
      const updatedDayCompletions = new Set(completedDays);
      updatedDayCompletions.delete(dayKey);
      setCompletedDays(updatedDayCompletions);

      console.log('Day reset successfully');
    } catch (error) {
      console.error('Error resetting day:', error);
    }
  };

  const isWorkoutCompleted = (workout: any, day: any) => {
    // Find the day index to get consistent day number
    const dayIndex = program.days?.findIndex(d => d.id === day.id) ?? 0;
    const dayNumber = dayIndex + 1;
    const workoutKey = `${program.id}-${dayNumber}-${workout.title || workout.name}`;
    return completedWorkouts.has(workoutKey);
  };

  const areDayWorkoutsComplete = (day: any) => {
    // Find the day index to get consistent day number
    const dayIndex = program.days?.findIndex(d => d.id === day.id) ?? 0;
    const dayNumber = dayIndex + 1;
    const dayKey = `${program.id}-${dayNumber}`;
    return completedDays.has(dayKey);
  };

  // Show individual workout player
  if (isPlayingWorkout && selectedWorkout && selectedDay) {
    return (
      <WorkoutPlayer
        workout={selectedWorkout}
        onBack={handleBackFromWorkout}
        onComplete={() => handleCompleteWorkout(selectedWorkout.id)}
        programId={program.id}
        dayId={selectedDay.id}
      />
    );
  }

  // Show day's workout list
  if (showDayWorkouts && selectedDay) {
    const allWorkoutsComplete = areDayWorkoutsComplete(selectedDay);
    
    return (
      <DayWorkoutsList 
        selectedDay={selectedDay}
        allWorkoutsComplete={allWorkoutsComplete}
        onBack={handleBackFromDayWorkouts}
        onStartWorkout={handleStartWorkout}
        isWorkoutCompleted={isWorkoutCompleted}
        gradientStyle={gradientStyle}
      />
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="h-48 relative" style={gradientStyle}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-4 left-4 text-white">
            <h1 className="text-3xl font-bold mb-2">{program.title}</h1>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-white/20 text-white">
                {program.category}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-current" />
                <span>{program.rating || '4.5'}</span>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: settings.primaryColor }}>
                {program.duration}
              </div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: settings.primaryColor }}>
                {program.difficulty}
              </div>
              <div className="text-sm text-gray-600">Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: settings.primaryColor }}>
                {program.days?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Days</div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">{program.description}</p>
        </CardContent>
      </Card>

      {program.days && program.days.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Program Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {program.days.map((day, index) => {
              const isDayComplete = areDayWorkoutsComplete(day);
              
              return (
                <div 
                  key={day.id} 
                  className={`border rounded-lg p-4 transition-colors ${
                    isDayComplete 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {isDayComplete && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                        Day {index + 1}: {day.title}
                      </h3>
                      {day.description && (
                        <p className="text-sm text-gray-600 mt-1">{day.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {day.workouts?.length || 0} workouts
                      </Badge>
                       {isDayComplete ? (
                         <div className="flex gap-2">
                           <Button
                             size="sm"
                             disabled
                             className="bg-green-500 text-white cursor-not-allowed opacity-75"
                           >
                             <CheckCircle className="w-4 h-4 mr-1" />
                             Completed
                           </Button>
                           <Button
                             onClick={() => handleResetDay(day)}
                             size="sm"
                             variant="outline"
                             className="text-gray-600 hover:text-gray-800"
                           >
                             <RotateCcw className="w-4 h-4 mr-1" />
                             Reset
                           </Button>
                         </div>
                      ) : (
                        <Button
                          onClick={() => handleStartDay(day)}
                          size="sm"
                          style={gradientStyle}
                          className="text-white"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start Workout
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgramDetail;