import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ProgressEntry {
  id: string;
  user_id: string;
  program_id?: string;
  workout_id?: string;
  exercise_id?: string;
  entry_type: 'weight' | 'reps' | 'duration' | 'distance' | 'calories' | 'custom';
  value: number;
  unit?: string;
  notes?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutCompletion {
  id: string;
  user_id: string;
  program_id: string;
  workout_id: string;
  completed_at: string;
  duration_minutes?: number;
  calories_burned?: number;
  notes?: string;
  rating?: number;
  created_at: string;
}

export function useRealtimeProgressTracking(userId?: string) {
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [workoutCompletions, setWorkoutCompletions] = useState<WorkoutCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchData = async () => {
      try {
        const [progressRes, completionsRes] = await Promise.all([
          supabase
            .from('progress_entries')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false }),
          supabase
            .from('workout_completions')
            .select('*')
            .eq('user_id', userId)
            .order('completed_at', { ascending: false })
        ]);

        if (progressRes.error) throw progressRes.error;
        if (completionsRes.error) throw completionsRes.error;

        setProgressEntries(progressRes.data || []);
        setWorkoutCompletions(completionsRes.data || []);
        
        console.log('Loaded progress entries:', progressRes.data?.length);
        console.log('Loaded workout completions:', completionsRes.data?.length);
      } catch (err) {
        console.error('Error fetching progress data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Real-time subscriptions
    const progressChannel = supabase
      .channel('progress_entries_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'progress_entries' },
        (payload) => {
          console.log('Progress entry change:', payload);
          
          if (payload.eventType === 'INSERT') {
            setProgressEntries(prev => [payload.new as ProgressEntry, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setProgressEntries(prev => prev.map(entry => 
              entry.id === payload.new.id ? payload.new as ProgressEntry : entry
            ));
          } else if (payload.eventType === 'DELETE') {
            setProgressEntries(prev => prev.filter(entry => entry.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const completionsChannel = supabase
      .channel('workout_completions_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'workout_completions' },
        (payload) => {
          console.log('Workout completion change:', payload);
          
          if (payload.eventType === 'INSERT') {
            setWorkoutCompletions(prev => [payload.new as WorkoutCompletion, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setWorkoutCompletions(prev => prev.map(completion => 
              completion.id === payload.new.id ? payload.new as WorkoutCompletion : completion
            ));
          } else if (payload.eventType === 'DELETE') {
            setWorkoutCompletions(prev => prev.filter(completion => completion.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(completionsChannel);
    };
  }, [userId]);

  return { progressEntries, workoutCompletions, loading, error };
}