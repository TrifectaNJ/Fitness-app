import { supabase } from '@/lib/supabase';

export const fetchUserProgressData = async (userId: string) => {
  try {
    const daysBack = 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Fetch tracker entries
    const { data: trackerEntries } = await supabase
      .from('tracker_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('entry_date', startDate.toISOString().split('T')[0])
      .order('entry_date', { ascending: false });

    // Fetch tracker goals
    const { data: trackerGoals } = await supabase
      .from('progress_trackers')
      .select('*')
      .eq('user_id', userId);

    // Process tracker data
    const trackers = {
      water: { current: 0, goal: 0, entries: 0 },
      weight: { current: 0, goal: 0, entries: 0 },
      steps: { current: 0, goal: 0, entries: 0 },
      calories: { current: 0, goal: 0, entries: 0 }
    };

    // Get goals from progress_trackers
    trackerGoals?.forEach(tracker => {
      const key = tracker.tracker_name.toLowerCase();
      if (key.includes('water')) {
        trackers.water.goal = parseFloat(tracker.daily_goal) || 0;
      } else if (key.includes('weight')) {
        trackers.weight.goal = parseFloat(tracker.daily_goal) || 0;
      } else if (key.includes('step')) {
        trackers.steps.goal = parseFloat(tracker.daily_goal) || 0;
      } else if (key.includes('calorie')) {
        trackers.calories.goal = parseFloat(tracker.daily_goal) || 0;
      }
    });

    // Get current values and entry counts from tracker_entries
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = trackerEntries?.filter(entry => 
      entry.entry_date === today
    ) || [];

    todayEntries.forEach(entry => {
      const trackerName = entry.tracker_name.toLowerCase();
      if (trackerName.includes('water')) {
        trackers.water.current += parseFloat(entry.value) || 0;
        trackers.water.entries++;
      } else if (trackerName.includes('weight')) {
        trackers.weight.current = parseFloat(entry.value) || 0;
        trackers.weight.entries++;
      } else if (trackerName.includes('step')) {
        trackers.steps.current += parseFloat(entry.value) || 0;
        trackers.steps.entries++;
      } else if (trackerName.includes('calorie')) {
        trackers.calories.current += parseFloat(entry.value) || 0;
        trackers.calories.entries++;
      }
    });

    // Fetch program progress
    const { data: programProgress } = await supabase
      .from('user_program_progress')
      .select('*')
      .eq('user_id', userId);

    const programs = {
      total: programProgress?.length || 0,
      completed: programProgress?.filter(p => p.is_completed).length || 0,
      completion_rate: programProgress?.length ? 
        (programProgress.filter(p => p.is_completed).length / programProgress.length) * 100 : 0
    };

    // Fetch coach program assignments
    const { data: coachAssignments } = await supabase
      .from('coach_assignments')
      .select(`
        *,
        coach_profiles:coach_id (first_name, last_name)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    const coach_programs = {
      assigned: coachAssignments?.length || 0,
      completed: 0, // This would need additional logic
      coach_name: coachAssignments?.[0]?.coach_profiles ? 
        `${coachAssignments[0].coach_profiles.first_name} ${coachAssignments[0].coach_profiles.last_name}` : 
        undefined
    };

    // Calculate weekly averages
    const weeklyEntries = trackerEntries?.filter(entry => {
      const entryDate = new Date(entry.entry_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    }) || [];

    const weekly_progress = {
      water_avg: calculateWeeklyAverage(weeklyEntries, 'water'),
      weight_change: calculateWeightChange(weeklyEntries),
      steps_avg: calculateWeeklyAverage(weeklyEntries, 'step'),
      calories_avg: calculateWeeklyAverage(weeklyEntries, 'calorie')
    };

    const last_activity = trackerEntries?.[0]?.created_at || 'Never';

    return {
      trackers,
      programs,
      coach_programs,
      weekly_progress,
      last_activity
    };

  } catch (error) {
    console.error('Error fetching user progress data:', error);
    return {
      trackers: {
        water: { current: 0, goal: 0, entries: 0 },
        weight: { current: 0, goal: 0, entries: 0 },
        steps: { current: 0, goal: 0, entries: 0 },
        calories: { current: 0, goal: 0, entries: 0 }
      },
      programs: { total: 0, completed: 0, completion_rate: 0 },
      coach_programs: { assigned: 0, completed: 0 },
      weekly_progress: { water_avg: 0, weight_change: 0, steps_avg: 0, calories_avg: 0 },
      last_activity: 'Never'
    };
  }
};

const calculateWeeklyAverage = (entries: any[], trackerType: string) => {
  const relevantEntries = entries.filter(entry => 
    entry.tracker_name.toLowerCase().includes(trackerType)
  );
  
  if (relevantEntries.length === 0) return 0;
  
  const total = relevantEntries.reduce((sum, entry) => 
    sum + (parseFloat(entry.value) || 0), 0
  );
  
  return Math.round(total / Math.max(relevantEntries.length, 1));
};

const calculateWeightChange = (entries: any[]) => {
  const weightEntries = entries
    .filter(entry => entry.tracker_name.toLowerCase().includes('weight'))
    .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
  
  if (weightEntries.length < 2) return 0;
  
  const firstWeight = parseFloat(weightEntries[0].value) || 0;
  const lastWeight = parseFloat(weightEntries[weightEntries.length - 1].value) || 0;
  
  return Math.round((lastWeight - firstWeight) * 10) / 10;
};