import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { FitnessProgram } from '@/types/fitness';

export const useOptimizedPrograms = () => {
  const [programs, setPrograms] = useState<FitnessProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<{ data: FitnessProgram[]; timestamp: number } | null>(null);
  const isLoadingRef = useRef(false);
  
  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const loadPrograms = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current && !forceRefresh) return;
    
    // Check cache first
    if (!forceRefresh && cacheRef.current) {
      const { data, timestamp } = cacheRef.current;
      if (Date.now() - timestamp < CACHE_DURATION) {
        setPrograms(data);
        return;
      }
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Single optimized query with joins - fetch all programs without deleted_at filter
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select(`
          *,
          workouts:workouts(*)
        `)
        .order('created_at', { ascending: false });


      if (programsError) throw programsError;

      const transformedPrograms: FitnessProgram[] = programsData?.map(program => ({
        id: program.id,
        title: program.title,
        description: program.description,
        price: program.price,
        paymentType: program.payment_type,
        duration: program.duration,
        difficulty: program.difficulty,
        category: program.category,
        imageUrl: program.image_url,
        videoUrl: program.video_url,
        instructions: program.instructions || [],
        days: program.days?.map((day: any) => ({
          id: day.id || `day-${day.dayNumber}`,
          dayNumber: day.dayNumber,
          title: day.title,
          description: day.description,
          workouts: day.workouts || [],
          order: day.dayNumber
        })) || [],
        workouts: program.workouts?.map((workout: any) => ({
          id: workout.id,
          title: workout.title || 'Workout',
          duration: workout.duration || 30,
          calories: workout.calories,
          focusZones: workout.focus_zones || [],
          equipment: workout.equipment || [],
          warmUpExercises: [],
          mainExercises: [],
          coolDownExercises: [],
          imageUrl: workout.image_url,
          videoUrl: workout.video_url,
          description: workout.description,
          exercises: [],
          program_id: workout.program_id,
          sections: []
        })) || [],
        isActive: program.is_active,
        showOnHomePage: program.show_on_homepage,
        createdAt: new Date(program.created_at),
        updatedAt: new Date(program.updated_at),
        rating: 4.5
      })) || [];

      // Update cache
      cacheRef.current = {
        data: transformedPrograms,
        timestamp: Date.now()
      };

      setPrograms(transformedPrograms);
    } catch (err) {
      console.error('Error loading programs:', err);
      setError('Failed to load programs');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Load programs on mount
  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  return {
    programs,
    loading,
    error,
    refreshPrograms: loadPrograms,
    clearCache: () => { cacheRef.current = null; }
  };
};