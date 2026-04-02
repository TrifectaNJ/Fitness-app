import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { FitnessProgram, ProgramDay, Workout } from '@/types/fitness';
import { toast } from '@/components/ui/use-toast';

interface DietPlan {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

interface CompletedWorkout {
  workoutId: string;
  programId: string;
  dayId: string;
  completedAt: string;
}

interface FitnessContextType {
  programs: FitnessProgram[];
  dietPlans: DietPlan[];
  loading: boolean;
  error: string | null;
  refreshPrograms: () => Promise<void>;
  updateProgram: (id: string, updates: Partial<FitnessProgram>) => Promise<void>;
  addProgram: (program: Omit<FitnessProgram, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  getProgram: (id: string) => FitnessProgram | undefined;
  loadDietPlans: () => Promise<void>;
  loadPrograms: () => Promise<void>;
  completedWorkouts: CompletedWorkout[];
  markWorkoutComplete: (workoutId: string, programId: string, dayId: string) => void;
  isWorkoutCompleted: (workoutId: string) => boolean;
  isDayCompleted: (dayId: string, workouts: Workout[]) => boolean;
}

const FitnessContext = createContext<FitnessContextType | null>(null);

export const FitnessProvider = ({ children }: any) => {
  const [programs, setPrograms] = useState<FitnessProgram[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  // Track auth state to know which user's completions to load
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUserId(session?.user?.id ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  // Load completed workouts from Supabase when user is known
  useEffect(() => {
    if (!userId) {
      setCompletedWorkouts([]);
      return;
    }
    supabase
      .from('workout_completions')
      .select('workout_id, completed_at')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) {
          setCompletedWorkouts(
            data.map(row => ({
              workoutId: row.workout_id,
              programId: '',
              dayId: '',
              completedAt: row.completed_at,
            }))
          );
        }
      });
  }, [userId]);

  // Real-time subscription — picks up writes from useExerciseCompletionPersistent automatically
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`fitness_context_workout_completions_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workout_completions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setCompletedWorkouts(prev => {
            const already = prev.some(w => w.workoutId === payload.new.workout_id);
            if (already) return prev;
            return [
              ...prev,
              {
                workoutId: payload.new.workout_id,
                programId: '',
                dayId: '',
                completedAt: payload.new.completed_at,
              },
            ];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // No-op: completion writes go through useExerciseCompletionPersistent → Supabase.
  // The real-time subscription above picks them up automatically.
  const markWorkoutComplete = (_workoutId: string, _programId: string, _dayId: string) => {};

  const isWorkoutCompleted = (workoutId: string) => {
    return completedWorkouts.some(cw => cw.workoutId === workoutId);
  };

  const isDayCompleted = (dayId: string, workouts: Workout[]) => {
    if (!workouts || workouts.length === 0) return false;
    return workouts.some(workout => isWorkoutCompleted(workout.id));
  };

  const refreshPrograms = async (force = false) => {
    if (isLoadingRef.current && !force) return;
    
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all programs - don't filter by deleted_at to show all programs
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false });


      if (error) {
        setError('Failed to load programs');
        return;
      }

      if (data) {
        const programsWithWorkouts = await Promise.all(
          data.map(async (program) => {
            const { data: workouts } = await supabase
              .from('workouts')
              .select('*')
              .eq('program_id', program.id);

            const transformedWorkouts = workouts?.map(workout => ({
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
            })) || [];

            const transformedDays: ProgramDay[] = program.days?.map((day: any) => {
              const dayWorkouts = transformedWorkouts.filter(w => {
                return day.workouts?.some((dw: any) => {
                  const workoutId = typeof dw === 'string' ? dw : dw.id;
                  return workoutId === w.id;
                });
              });
              
              return {
                id: day.id || `day-${day.dayNumber}`,
                dayNumber: day.dayNumber,
                title: day.title,
                description: day.description,
                workouts: dayWorkouts
              };
            }) || [];

            return {
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
              days: transformedDays,
              workouts: transformedWorkouts,
              isActive: program.is_active,
              showOnHomePage: program.show_on_homepage,
              createdAt: new Date(program.created_at),
              updatedAt: new Date(program.updated_at),
            };
          })
        );

        setPrograms(programsWithWorkouts);
      }
    } catch (err) {
      setError('Failed to load programs');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      refreshPrograms(true);
    }
  }, []);

  const updateProgram = async (id: string, updates: Partial<FitnessProgram>) => {
    setError(null);
    
    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.paymentType !== undefined) updateData.payment_type = updates.paymentType;
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
      if (updates.videoUrl !== undefined) updateData.video_url = updates.videoUrl;
      if (updates.instructions !== undefined) updateData.instructions = updates.instructions;
      if (updates.days !== undefined) {
        updateData.days = updates.days.map(day => ({
          id: day.id,
          dayNumber: day.dayNumber,
          title: day.title,
          description: day.description,
          workouts: day.workouts?.map(w => ({ id: w.id, title: w.title })) || []
        }));
      }
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.showOnHomePage !== undefined) updateData.show_on_homepage = updates.showOnHomePage;
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('programs')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to update program: ${error.message}`);
      }
      
      await refreshPrograms(true);
      toast({ title: 'Program updated successfully!' });
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update program';
      setError(errorMsg);
      toast({ title: errorMsg, variant: 'destructive' });
      throw err;
    }
  };

  const addProgram = async (programData: Omit<FitnessProgram, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('programs')
        .insert([{
          title: programData.title,
          description: programData.description,
          price: programData.price,
          payment_type: programData.paymentType,
          duration: programData.duration,
          difficulty: programData.difficulty,
          category: programData.category,
          image_url: programData.imageUrl,
          video_url: programData.videoUrl,
          instructions: programData.instructions,
          days: programData.days?.map(day => ({
            id: day.id,
            dayNumber: day.dayNumber,
            title: day.title,
            description: day.description,
            workouts: day.workouts?.map(w => ({ id: w.id, title: w.title })) || []
          })) || [],
          is_active: programData.isActive,
          show_on_homepage: programData.showOnHomePage || false
        }])
        .select()
        .single();

      if (error) throw new Error(`Failed to create program: ${error.message}`);
      
      await refreshPrograms(true);
      toast({ title: 'Program created successfully!' });
      
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create program';
      setError(errorMsg);
      toast({ title: errorMsg, variant: 'destructive' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProgram = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('programs')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw new Error(`Failed to delete program: ${error.message}`);
      
      await refreshPrograms(true);
      toast({ title: 'Program deleted successfully!' });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete program';
      setError(errorMsg);
      toast({ title: errorMsg, variant: 'destructive' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadDietPlans = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        setError('Failed to load diet plans');
        return;
      }

      if (data) {
        const formattedDietPlans: DietPlan[] = data.map(plan => ({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          createdAt: new Date(plan.created_at)
        }));

        setDietPlans(formattedDietPlans);
      }
    } catch (err) {
      setError('Failed to load diet plans');
    }
  };

  const loadPrograms = async () => {
    await refreshPrograms(true);
  };

  const getProgram = (id: string) => {
    return programs.find(program => program.id === id);
  };

  return (
    <FitnessContext.Provider
      value={{
        programs,
        dietPlans,
        loading,
        error,
        refreshPrograms,
        updateProgram,
        addProgram,
        deleteProgram,
        getProgram,
        loadDietPlans,
        loadPrograms,
        completedWorkouts,
        markWorkoutComplete,
        isWorkoutCompleted,
        isDayCompleted
      }}
    >
      {children}
    </FitnessContext.Provider>
  );
};

export const useFitness = () => {
  const context = useContext(FitnessContext);
  if (!context) {
    throw new Error('useFitness must be used within FitnessProvider');
  }
  return context;
};