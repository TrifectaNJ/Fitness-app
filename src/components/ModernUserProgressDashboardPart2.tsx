  const fetchUserProgressData = async (userId: string) => {
    try {
      const daysBack = parseInt(dateFilter);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Fetch tracker entries
      const { data: trackerEntries } = await supabase
        .from('tracker_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0]);

      // Fetch progress trackers for goals
      const { data: progressTrackers } = await supabase
        .from('progress_trackers')
        .select('*')
        .eq('user_id', userId);

      // Fetch program progress
      const { data: programProgress } = await supabase
        .from('user_program_progress')
        .select('*, programs(*)')
        .eq('user_id', userId);

      // Fetch workout completions
      const { data: workoutCompletions } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', startDate.toISOString());

      // Process tracker data
      const trackers = {
        water: processTrackerData(trackerEntries, progressTrackers, 'water'),
        weight: processTrackerData(trackerEntries, progressTrackers, 'weight'),
        steps: processTrackerData(trackerEntries, progressTrackers, 'steps'),
        calories: processTrackerData(trackerEntries, progressTrackers, 'calories')
      };

      // Process program data
      const programs = {
        total: programProgress?.length || 0,
        completed: programProgress?.filter(p => p.completion_percentage === 100).length || 0,
        active: programProgress?.filter(p => p.completion_percentage > 0 && p.completion_percentage < 100).length || 0,
        completion_rate: programProgress?.length > 0 
          ? (programProgress.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / programProgress.length)
          : 0
      };

      // Calculate weekly progress
      const weeklyProgress = calculateWeeklyProgress(trackerEntries);

      // Get last activity
      const lastActivity = getLastActivity(trackerEntries, workoutCompletions);

      return {
        trackers,
        programs,
        coach_programs: {
          assigned: programProgress?.filter(p => p.assigned_by_coach).length || 0,
          completed: programProgress?.filter(p => p.assigned_by_coach && p.completion_percentage === 100).length || 0
        },
        weekly_progress: weeklyProgress,
        last_activity: lastActivity
      };
    } catch (error) {
      console.error('Error fetching user progress data:', error);
      return {
        trackers: {
          water: { current: 0, goal: 8, entries: 0, streak: 0 },
          weight: { current: 0, goal: 150, entries: 0, change: 0 },
          steps: { current: 0, goal: 10000, entries: 0, streak: 0 },
          calories: { current: 0, goal: 2000, entries: 0, streak: 0 }
        },
        programs: { total: 0, completed: 0, completion_rate: 0, active: 0 },
        coach_programs: { assigned: 0, completed: 0 },
        weekly_progress: { water_avg: 0, weight_change: 0, steps_avg: 0, calories_avg: 0 },
        last_activity: 'Never'
      };
    }
  };

  const processTrackerData = (entries: any[], trackers: any[], type: string) => {
    const todayEntries = entries?.filter(e => 
      e.tracker_type === type && 
      new Date(e.date).toDateString() === new Date().toDateString()
    ) || [];
    
    const tracker = trackers?.find(t => t.tracker_type === type);
    const goal = tracker?.goal || getDefaultGoal(type);
    
    const current = todayEntries.reduce((sum, entry) => sum + (entry.value || 0), 0);
    const totalEntries = todayEntries.length;
    
    // Calculate streak
    const streak = calculateStreak(entries, type);
    
    return {
      current,
      goal,
      entries: totalEntries,
      streak,
      change: type === 'weight' ? calculateWeightChange(entries) : 0
    };
  };

  const getDefaultGoal = (type: string) => {
    const defaults = { water: 8, weight: 150, steps: 10000, calories: 2000 };
    return defaults[type as keyof typeof defaults] || 0;
  };

  const calculateStreak = (entries: any[], type: string) => {
    // Simple streak calculation - days with at least one entry
    const dates = [...new Set(entries
      ?.filter(e => e.tracker_type === type)
      ?.map(e => e.date)
      ?.sort()
    )] || [];
    
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = dates.length - 1; i >= 0; i--) {
      const date = new Date(dates[i]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - streak);
      
      if (date.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculateWeightChange = (entries: any[]) => {
    const weightEntries = entries?.filter(e => e.tracker_type === 'weight')?.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ) || [];
    
    if (weightEntries.length < 2) return 0;
    
    const latest = weightEntries[weightEntries.length - 1];
    const weekAgo = weightEntries.find(e => {
      const entryDate = new Date(e.date);
      const weekAgoDate = new Date();
      weekAgoDate.setDate(weekAgoDate.getDate() - 7);
      return entryDate >= weekAgoDate;
    });
    
    if (!weekAgo) return 0;
    return latest.value - weekAgo.value;
  };

  const calculateWeeklyProgress = (entries: any[]) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekEntries = entries?.filter(e => new Date(e.date) >= weekAgo) || [];
    
    return {
      water_avg: calculateAverage(weekEntries, 'water'),
      weight_change: calculateWeightChange(entries),
      steps_avg: calculateAverage(weekEntries, 'steps'),
      calories_avg: calculateAverage(weekEntries, 'calories')
    };
  };

  const calculateAverage = (entries: any[], type: string) => {
    const typeEntries = entries.filter(e => e.tracker_type === type);
    if (typeEntries.length === 0) return 0;
    
    const total = typeEntries.reduce((sum, entry) => sum + (entry.value || 0), 0);
    return Math.round(total / typeEntries.length);
  };

  const getLastActivity = (trackerEntries: any[], workoutCompletions: any[]) => {
    const allActivities = [
      ...(trackerEntries?.map(e => e.created_at) || []),
      ...(workoutCompletions?.map(w => w.completed_at) || [])
    ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    return allActivities.length > 0 ? allActivities[0] : 'Never';
  };

  const filterUsers = () => {
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (trackerFilter !== 'all') {
      filtered = filtered.filter(user => {
        switch (trackerFilter) {
          case 'active':
            return user.last_activity !== 'Never';
          case 'programs':
            return user.programs.total > 0;
          case 'trackers':
            return Object.values(user.trackers).some(t => t.entries > 0);
          default:
            return true;
        }
      });
    }
    
    setFilteredUsers(filtered);
  };

  const checkUserPermission = (user: UserProgressData) => {
    if (userRole === 'super_admin' || userRole === 'admin') return true;
    if (userRole === 'coach') return user.assigned_coach_id === currentUser.id;
    return false;
  };

  const handleUserSelect = (user: UserProgressData) => {
    if (!checkUserPermission(user)) {
      setPermissionError("You don't have permission to view this user's progress.");
      return;
    }
    setSelectedUser(user);
    setPermissionError('');
  };

  const exportProgressData = async () => {
    if (!selectedUser) return;
    
    const csvData = [
      ['Date', 'Tracker Type', 'Value', 'Goal'],
      // Add CSV data rows here
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedUser.email}_progress.csv`;
    a.click();
  };

export default ModernUserProgressDashboard;