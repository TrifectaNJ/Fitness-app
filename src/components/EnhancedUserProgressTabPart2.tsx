  const fetchUserProgress = async (userId: string) => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), parseInt(dateFilter));

      // Fetch progress entries with tracker info
      const { data: progressEntries } = await supabase
        .from('progress_entries')
        .select(`
          *,
          progress_trackers!inner(tracker_name, unit, daily_goal)
        `)
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: false });

      // Organize by tracker type
      const trackerMap = {
        water: progressEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('water')
        ) || [],
        weight: progressEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('weight')
        ) || [],
        steps: progressEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('step')
        ) || [],
        calories: progressEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('calorie')
        ) || []
      };

      setTrackerData(trackerMap);
      await fetchWorkoutProgress(userId);
      await calculateWeeklyStats(userId);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyStats = async (userId: string) => {
    try {
      const weekStart = subDays(new Date(), 7);
      const { data: weekEntries } = await supabase
        .from('progress_entries')
        .select(`
          *,
          progress_trackers!inner(tracker_name, unit, daily_goal)
        `)
        .eq('user_id', userId)
        .gte('date', weekStart.toISOString());

      const stats = {
        totalWater: weekEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('water')
        ).reduce((sum, e) => sum + (e.value || 0), 0) || 0,
        avgSteps: Math.round((weekEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('step')
        ).reduce((sum, e) => sum + (e.value || 0), 0) || 0) / 7),
        totalCalories: weekEntries?.filter(e => 
          e.progress_trackers.tracker_name.toLowerCase().includes('calorie')
        ).reduce((sum, e) => sum + (e.value || 0), 0) || 0,
        workoutDays: 0 // Will be calculated from workout completions
      };

      setWeeklyStats(stats);
    } catch (error) {
      console.error('Error calculating weekly stats:', error);
    }
  };

  const fetchWorkoutProgress = async (userId: string) => {
    try {
      const { data: assignments } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs(*),
          coach_programs(*)
        `)
        .eq('user_id', userId);

      if (!assignments) return;

      const progressList: WorkoutProgress[] = [];

      for (const assignment of assignments) {
        const program = assignment.programs || assignment.coach_programs;
        if (!program) continue;

        const { data: completions } = await supabase
          .from('day_completions')
          .select('*')
          .eq('user_id', userId)
          .eq('program_id', assignment.program_id || assignment.coach_program_id);

        const totalDays = program.total_days || (program.weeks * 7) || 42;
        const completedDays = completions?.length || 0;
        const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

        progressList.push({
          programId: program.id,
          programName: program.name,
          totalDays,
          completedDays,
          percentage,
          type: assignment.program_id ? 'program' : 'coach_program',
          lastActivity: completions?.[0]?.completed_at
        });
      }

      setWorkoutProgress(progressList);
    } catch (error) {
      console.error('Error fetching workout progress:', error);
    }
  };