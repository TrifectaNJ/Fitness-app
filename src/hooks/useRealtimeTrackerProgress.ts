import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface TrackerEntry {
  id: string;
  user_id: string;
  tracker_type: 'water' | 'weight' | 'steps' | 'calories';
  value: number;
  unit: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutProgress {
  id: string;
  user_id: string;
  program_id: string;
  workout_id: string;
  day_number: number;
  completed: boolean;
  completed_at?: string;
  duration_minutes?: number;
  calories_burned?: number;
  notes?: string;
}

interface CachedData {
  trackerEntries: TrackerEntry[];
  workoutProgress: WorkoutProgress[];
  lastUpdated: number;
}

const CACHE_DURATION = 30000; // 30 seconds
const dataCache = new Map<string, CachedData>();

export function useRealtimeTrackerProgress(userIds: string[] = []) {
  const [trackerEntries, setTrackerEntries] = useState<TrackerEntry[]>([]);
  const [workoutProgress, setWorkoutProgress] = useState<WorkoutProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUpdates, setNewUpdates] = useState<string[]>([]);
  const channelsRef = useRef<any[]>([]);

  const clearNewUpdate = useCallback((id: string) => {
    setNewUpdates(prev => prev.filter(updateId => updateId !== id));
  }, []);

  useEffect(() => {
    if (userIds.length === 0) {
      setLoading(false);
      return;
    }

    const cacheKey = userIds.sort().join(',');
    const cached = dataCache.get(cacheKey);
    const now = Date.now();

    // Use cache if available and fresh
    if (cached && (now - cached.lastUpdated) < CACHE_DURATION) {
      setTrackerEntries(cached.trackerEntries);
      setWorkoutProgress(cached.workoutProgress);
      setLoading(false);
      console.log('Using cached data');
    } else {
      // Fetch fresh data
      const fetchData = async () => {
        try {
          const [trackerRes, progressRes] = await Promise.all([
            supabase
              .from('tracker_progress')
              .select('*')
              .in('user_id', userIds)
              .order('date', { ascending: false })
              .limit(1000),
            supabase
              .from('workout_history')
              .select('*')
              .in('user_id', userIds)
              .order('completed_at', { ascending: false })
              .limit(500)
          ]);

          if (!trackerRes.error && !progressRes.error) {
            const newData = {
              trackerEntries: trackerRes.data || [],
              workoutProgress: progressRes.data || [],
              lastUpdated: Date.now()
            };
            
            dataCache.set(cacheKey, newData);
            setTrackerEntries(newData.trackerEntries);
            setWorkoutProgress(newData.workoutProgress);
          }
        } catch (err) {
          console.error('Error fetching tracker data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }

    // Real-time subscriptions
    const trackerChannel = supabase
      .channel('tracker_progress_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tracker_progress' },
        (payload) => {
          if (payload.eventType === 'INSERT' && userIds.includes(payload.new.user_id)) {
            setTrackerEntries(prev => [payload.new as TrackerEntry, ...prev]);
            setNewUpdates(prev => [...prev, payload.new.id]);
            dataCache.delete(cacheKey);
          } else if (payload.eventType === 'UPDATE' && userIds.includes(payload.new.user_id)) {
            setTrackerEntries(prev => prev.map(e => e.id === payload.new.id ? payload.new as TrackerEntry : e));
            setNewUpdates(prev => [...prev, payload.new.id]);
            dataCache.delete(cacheKey);
          }
        }
      )
      .subscribe();

    const workoutChannel = supabase
      .channel('workout_history_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'workout_history' },
        (payload) => {
          if (payload.eventType === 'INSERT' && userIds.includes(payload.new.user_id)) {
            setWorkoutProgress(prev => [payload.new as WorkoutProgress, ...prev]);
            setNewUpdates(prev => [...prev, payload.new.id]);
            dataCache.delete(cacheKey);
          }
        }
      )
      .subscribe();

    channelsRef.current = [trackerChannel, workoutChannel];

    return () => {
      channelsRef.current.forEach(channel => supabase.removeChannel(channel));
    };
  }, [userIds.join(',')]);

  return { trackerEntries, workoutProgress, loading, newUpdates, clearNewUpdate };
}
