import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ExerciseCompletion {
  exercise_id: string;
  sets_completed: number;
  total_sets: number;
  completed_at: string;
}

export const useExerciseCompletionPersistent = (workoutId: string, userId?: string) => {
  const [completions, setCompletions] = useState<Map<string, ExerciseCompletion>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadCompletions = useCallback(async () => {
    if (!userId || !workoutId) return;
    
    try {
      const { data, error } = await supabase
        .from('exercise_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('workout_id', workoutId);

      if (error) {
        console.error('Error loading completions:', error);
        return;
      }

      const completionMap = new Map();
      data?.forEach((completion) => {
        completionMap.set(completion.exercise_id, completion);
      });
      
      setCompletions(completionMap);
    } catch (error) {
      console.error('Error loading exercise completions:', error);
    } finally {
      setLoading(false);
    }
  }, [workoutId, userId]);

  useEffect(() => {
    if (userId && workoutId) {
      loadCompletions();
    }
  }, [loadCompletions]);

  // Set up real-time subscription for exercise completions
  useEffect(() => {
    if (!userId || !workoutId) return;

    const channel = supabase
      .channel(`exercise_completions_${workoutId}_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercise_completions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Real-time exercise completion update:', payload);
          
          // Only process updates for the current workout
          if (payload.new?.workout_id === workoutId || payload.old?.workout_id === workoutId) {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const completion = payload.new as ExerciseCompletion;
              setCompletions(prev => {
                const newMap = new Map(prev);
                newMap.set(completion.exercise_id, completion);
                return newMap;
              });
            } else if (payload.eventType === 'DELETE') {
              const completion = payload.old as ExerciseCompletion;
              setCompletions(prev => {
                const newMap = new Map(prev);
                newMap.delete(completion.exercise_id);
                return newMap;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workoutId, userId]);

  const markExerciseComplete = async (exerciseId: string, totalSets: number = 1) => {
    if (!userId) return;

    const currentCompletion = completions.get(exerciseId);
    const completedSets = currentCompletion ? currentCompletion.sets_completed + 1 : 1;

    try {
      const { data, error } = await supabase
        .from('exercise_completions')
        .upsert({
          user_id: userId,
          workout_id: workoutId,
          exercise_id: exerciseId,
          sets_completed: Math.min(completedSets, totalSets),
          total_sets: totalSets,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,workout_id,exercise_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving completion:', error);
        return;
      }

      // Update local state immediately for instant feedback
      setCompletions(prev => {
        const newMap = new Map(prev);
        newMap.set(exerciseId, data);
        return newMap;
      });
      
      console.log('Exercise completion saved:', data);
      return data;
    } catch (error) {
      console.error('Error marking exercise complete:', error);
    }
  };
  
  const resetExercise = async (exerciseId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('exercise_completions')
        .delete()
        .eq('user_id', userId)
        .eq('workout_id', workoutId)
        .eq('exercise_id', exerciseId);

      if (error) {
        console.error('Error resetting exercise:', error);
        return;
      }

      // Update local state immediately
      setCompletions(prev => {
        const newMap = new Map(prev);
        newMap.delete(exerciseId);
        return newMap;
      });
    } catch (error) {
      console.error('Error resetting exercise:', error);
    }
  };

  const isExerciseComplete = (exerciseId: string) => {
    const completion = completions.get(exerciseId);
    return completion && completion.sets_completed >= completion.total_sets;
  };

  const getExerciseProgress = (exerciseId: string) => {
    const completion = completions.get(exerciseId);
    if (!completion) return { completed: 0, total: 1 };
    return { completed: completion.sets_completed, total: completion.total_sets };
  };

  const refreshCompletions = async () => {
    if (userId && workoutId) {
      await loadCompletions();
    }
  };

  const markWorkoutComplete = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('workout_completions')
        .upsert({
          user_id: userId,
          workout_id: workoutId,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,workout_id'
        });

      if (error) {
        console.error('Error marking workout complete:', error);
        return;
      }

      console.log('Workout marked as complete');
    } catch (error) {
      console.error('Error marking workout complete:', error);
    }
  };

  return {
    completions,
    loading,
    markExerciseComplete,
    resetExercise,
    isExerciseComplete,
    getExerciseProgress,
    loadCompletions,
    refreshCompletions,
    markWorkoutComplete
  };
};