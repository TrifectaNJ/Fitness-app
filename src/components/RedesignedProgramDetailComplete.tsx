import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FitnessProgram } from '@/types/fitness';
import { Clock, Star, Play, ArrowLeft, CheckCircle, RotateCcw, Calendar, Target } from 'lucide-react';
import WorkoutPlayer from './WorkoutPlayer';
import DayWorkoutsList from './DayWorkoutsList';
import { supabase } from '@/lib/supabase';

interface RedesignedProgramDetailProps {
  program: FitnessProgram;
  onBack: () => void;
  onStartProgram?: () => void;
}

const RedesignedProgramDetailComplete: React.FC<RedesignedProgramDetailProps> = ({ 
  program, 
  onBack, 
  onStartProgram 
}) => {
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [isPlayingWorkout, setIsPlayingWorkout] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [showDayWorkouts, setShowDayWorkouts] = useState(false);
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set());
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);

  useEffect(() => {
    loadCompletedWorkouts();
  }, [program.id]);

  const loadCompletedWorkouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: completions } = await supabase
        .from('workout_completions')
        .select('workout_name, program_id, day_number')
        .eq('user_id', user.id)
        .eq('program_id', program.id);

      const { data: dayCompletions } = await supabase
        .from('day_completions')
        .select('program_id, day_number')
        .eq('user_id', user.id)
        .eq('program_id', program.id);

      if (completions) {
        const completedSet = new Set<string>();
        completions.forEach(completion => {
          const workoutKey = `${completion.program_id}-${completion.day_number}-${completion.workout_name}`;
          completedSet.add(workoutKey);
        });
        setCompletedWorkouts(completedSet);
      }

      if (dayCompletions) {
        const completedDaysSet = new Set<string>();
        dayCompletions.forEach(completion => {
          const dayKey = `${completion.program_id}-${completion.day_number}`;
          completedDaysSet.add(dayKey);
        });
        setCompletedDays(completedDaysSet);
      }
    } catch (error) {
      console.error('Error loading completed workouts:', error);
    }
  };

  const handleStartDay = (day: any) => {
    const workouts = day.workouts || [];
    if (workouts.length === 0) return;
    const firstIncomplete = workouts.find((w: any) => !isWorkoutCompleted(w, day));
    const workoutToStart = firstIncomplete || workouts[0];
    setSelectedDay(day);
    handleStartWorkout(workoutToStart);
  };

  const handleStartWorkout = (workout: any) => {
    setSelectedWorkout(workout);
    setIsPlayingWorkout(true);
    setWorkoutStartTime(new Date());
  };

  const handleBackFromWorkout = () => {
    setIsPlayingWorkout(false);
    setSelectedWorkout(null);
    setSelectedDay(null);
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

      const endTime = new Date();
      const durationMinutes = Math.round((endTime.getTime() - workoutStartTime.getTime()) / (1000 * 60));
      const dayIndex = program.days?.findIndex(d => d.id === selectedDay.id) ?? 0;
      const dayNumber = dayIndex + 1;

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

      const workoutKey = `${program.id}-${dayNumber}-${selectedWorkout.title || selectedWorkout.name}`;
      const updatedCompletions = new Set(completedWorkouts).add(workoutKey);
      setCompletedWorkouts(updatedCompletions);

      const allWorkoutsComplete = selectedDay.workouts?.every((workout: any) => {
        const wKey = `${program.id}-${dayNumber}-${workout.title || workout.name}`;
        return updatedCompletions.has(wKey);
      });

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

        const dayKey = `${program.id}-${dayNumber}`;
        setCompletedDays(prev => new Set(prev).add(dayKey));
      }
    } catch (error) {
      console.error('Error saving workout completion:', error);
    }
    
    // Navigate back to program schedule immediately - no setTimeout delay
    setIsPlayingWorkout(false);
    setSelectedWorkout(null);
    setWorkoutStartTime(null);
    setShowDayWorkouts(false);
    setSelectedDay(null);
  };

  const handleResetDay = async (day: any) => {
    const dayIndex = program.days?.findIndex(d => d.id === day.id) ?? 0;
    const dayNumber = dayIndex + 1;
    
    const confirmed = window.confirm(
      `Reset progress for Day ${dayNumber}? This will clear all workouts for this day.`
    );
    
    if (!confirmed) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete workout completions for this day
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

      // Delete exercise completions for all workouts in this day
      if (day.workouts) {
        for (const workout of day.workouts) {
          await supabase
            .from('exercise_completions')
            .delete()
            .eq('user_id', user.id)
            .eq('workout_id', workout.id);
        }
      }

      // Update local state - remove completed workouts for this day
      const updatedCompletions = new Set(completedWorkouts);
      day.workouts?.forEach((workout: any) => {
        const workoutKey = `${program.id}-${dayNumber}-${workout.title || workout.name}`;
        updatedCompletions.delete(workoutKey);
      });
      setCompletedWorkouts(updatedCompletions);

      // Update local state - remove completed day
      const dayKey = `${program.id}-${dayNumber}`;
      const updatedDayCompletions = new Set(completedDays);
      updatedDayCompletions.delete(dayKey);
      setCompletedDays(updatedDayCompletions);

    } catch (error) {
      console.error('Error resetting day:', error);
    }
  };

  const isWorkoutCompleted = (workout: any, day: any) => {
    const dayIndex = program.days?.findIndex(d => d.id === day.id) ?? 0;
    const dayNumber = dayIndex + 1;
    const workoutKey = `${program.id}-${dayNumber}-${workout.title || workout.name}`;
    return completedWorkouts.has(workoutKey);
  };

  const areDayWorkoutsComplete = (day: any) => {
    const dayIndex = program.days?.findIndex(d => d.id === day.id) ?? 0;
    const dayNumber = dayIndex + 1;
    const dayKey = `${program.id}-${dayNumber}`;
    return completedDays.has(dayKey);
  };

  // Calculate progress
  const totalDays = program.days?.length || 0;
  const completedDaysCount = completedDays.size;
  const progressPercentage = totalDays > 0 ? (completedDaysCount / totalDays) * 100 : 0;

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
        gradientStyle={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      />
    );
  }

  // Main program view with redesigned UI
  // Main program view with redesigned UI
  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50">

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 border-slate-200 hover:border-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Program Header Card */}
        <Card className="mb-8 overflow-hidden shadow-lg border-0">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl md:text-4xl font-bold">{program.title}</h1>
                  <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                    {program.category}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-current text-yellow-300" />
                    <span className="text-lg font-medium">{program.rating || '4.5'}</span>
                  </div>
                </div>

                <p className="text-blue-100 text-lg leading-relaxed max-w-2xl">
                  {program.description}
                </p>
              </div>

              <div className="flex-shrink-0">
                <Button
                  onClick={() => {
                    const firstIncompleteDay = program.days?.find(d => !areDayWorkoutsComplete(d));
                    const dayToStart = firstIncompleteDay || program.days?.[0];
                    if (dayToStart) handleStartDay(dayToStart);
                  }}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 text-lg shadow-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Program
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <CardContent className="p-8 bg-white">
            <div className="grid grid-cols-3 gap-8 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-3">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-800 mb-1">{program.duration}</div>
                <div className="text-sm text-slate-500 font-medium">Duration</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-3">
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-slate-800 mb-1 capitalize">{program.difficulty}</div>
                <div className="text-sm text-slate-500 font-medium">Level</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-slate-800 mb-1">{totalDays}</div>
                <div className="text-sm text-slate-500 font-medium">Days</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">Progress</span>
                <span className="text-slate-800 font-semibold">{completedDaysCount}/{totalDays} days completed</span>
              </div>
              <Progress value={progressPercentage} className="h-3 bg-slate-100" />
            </div>
          </CardContent>
        </Card>

        {/* Program Schedule */}
        {/* Program Schedule */}
        {program.days && program.days.length > 0 && (
          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Program Schedule</h2>
              <div className="space-y-4">
                {program.days
                  .sort((a, b) => {
                    // Extract week and day numbers from titles like "Week 1", "Week 2", etc.
                    const getWeekAndDay = (day: any, index: number) => {
                      // Try to extract week number from title
                      const weekMatch = day.title?.match(/Week\s*(\d+)/i);
                      const week = weekMatch ? parseInt(weekMatch[1]) : Math.floor(index / 3) + 1;
                      const dayInWeek = (index % 3) + 1;
                      return { week, dayInWeek };
                    };
                    
                    const aInfo = getWeekAndDay(a, program.days!.indexOf(a));
                    const bInfo = getWeekAndDay(b, program.days!.indexOf(b));
                    
                    // Sort by week first, then by day
                    if (aInfo.week !== bInfo.week) {
                      return aInfo.week - bInfo.week;
                    }
                    return aInfo.dayInWeek - bInfo.dayInWeek;
                  })
                  .map((day, sortedIndex) => {
                    // Calculate week and day numbers for display
                    const weekNumber = Math.floor(sortedIndex / 3) + 1;
                    const dayInWeek = (sortedIndex % 3) + 1;
                    
                    // Skip if this would be Day 4 or higher in a week (should never happen with proper data)
                    if (dayInWeek > 3) return null;
                    
                    const isDayComplete = areDayWorkoutsComplete(day);
                    const workoutCount = day.workouts?.length || 0;
                    
                    // Create display title
                    const displayTitle = `Day ${dayInWeek}: Week ${weekNumber}`;
                    
                    return (
                      <Card 
                        key={day.id} 
                        className={`transition-all duration-200 hover:shadow-md ${
                          isDayComplete 
                            ? 'bg-green-50 border-green-200 shadow-sm' 
                            : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {isDayComplete && (
                                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                  </div>
                                )}
                                <h3 className="text-xl font-semibold text-slate-800">
                                  {displayTitle}
                                </h3>
                              </div>
                              
                              {day.description && (
                                <p className="text-slate-600 mb-3 leading-relaxed">{day.description}</p>
                              )}
                              
                              <div className="flex items-center gap-4">
                                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {workoutCount} workout{workoutCount !== 1 ? 's' : ''}
                                </Badge>
                                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300">
                                  ~30 min
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {isDayComplete ? (
                                <div className="flex gap-2">
                                  <Button
                                    disabled
                                    className="bg-green-500 text-white cursor-not-allowed opacity-90 font-medium"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Completed
                                  </Button>
                                  <Button
                                    onClick={() => handleResetDay(day)}
                                    variant="outline"
                                    className="text-slate-600 hover:text-slate-800 border-slate-300"
                                  >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Reset
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => handleStartDay(day)}
                                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 shadow-lg"
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Start Workout
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                  .filter(Boolean) // Remove any null entries
                }
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RedesignedProgramDetailComplete;
