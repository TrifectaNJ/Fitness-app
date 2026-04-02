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