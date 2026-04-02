  const handleStartDay = (day: any) => {
    setSelectedDay(day);
    setShowDayWorkouts(true);
  };

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
    
    setTimeout(() => {
      setIsPlayingWorkout(false);
      setSelectedWorkout(null);
      setWorkoutStartTime(null);
      setShowDayWorkouts(false);
      setSelectedDay(null);
    }, 2500);
  };