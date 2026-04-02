import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProgramData {
  id: string;
  name: string;
  coachName: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  totalWorkouts: number;
  completedWorkouts: number;
  dateAssigned: string;
  progress: number;
  type: 'customized' | 'coach';
}

export function useUserProgramsData(userId: string, currentUserId: string, userRole: string) {
  const [programs, setPrograms] = useState<UserProgramData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(true);

  const checkPermissions = async () => {
    try {
      if (userRole === 'super_admin' || userRole === 'admin') {
        setHasPermission(true);
        return true;
      }

      if (userRole === 'coach') {
        // Check if coach is assigned to this user
        const { data: assignment } = await supabase
          .from('coach_assignments')
          .select('id')
          .eq('coach_id', currentUserId)
          .eq('user_id', userId)
          .single();

        const hasAccess = !!assignment;
        setHasPermission(hasAccess);
        return hasAccess;
      }

      setHasPermission(false);
      return false;
    } catch (err) {
      console.error('Permission check error:', err);
      setHasPermission(false);
      return false;
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      
      const hasAccess = await checkPermissions();
      if (!hasAccess) {
        setPrograms([]);
        setLoading(false);
        return;
      }

      const programsData: UserProgramData[] = [];

      // Fetch coach programs assigned to user
      const { data: coachAssignments } = await supabase
        .from('coach_program_assignments')
        .select(`
          assigned_at,
          coach_programs!inner(
            id,
            title,
            level,
            days,
            coach_id,
            user_profiles!coach_programs_coach_id_fkey(full_name)
          )
        `)
        .eq('user_id', userId);

      // Fetch workout completions for progress calculation
      const { data: completions } = await supabase
        .from('workout_completions')
        .select('program_id, workout_id')
        .eq('user_id', userId);

      if (coachAssignments) {
        for (const assignment of coachAssignments) {
          const program = assignment.coach_programs;
          if (program) {
            const totalWorkouts = program.days?.reduce((total: number, day: any) => {
              return total + (day.workouts?.length || 0);
            }, 0) || 0;

            const completedWorkouts = completions?.filter(
              c => c.program_id === program.id
            ).length || 0;

            const progress = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

            programsData.push({
              id: program.id,
              name: program.title,
              coachName: program.user_profiles?.full_name || 'Unknown Coach',
              level: program.level || 'beginner',
              totalWorkouts,
              completedWorkouts,
              dateAssigned: assignment.assigned_at,
              progress,
              type: 'coach'
            });
          }
        }
      }

      // Fetch customized programs (user_program_progress)
      const { data: customPrograms } = await supabase
        .from('user_program_progress')
        .select(`
          id,
          program_id,
          completion_percentage,
          created_at,
          programs!inner(
            title,
            level,
            days
          )
        `)
        .eq('user_id', userId);

      if (customPrograms) {
        for (const customProgram of customPrograms) {
          const program = customProgram.programs;
          if (program) {
            const totalWorkouts = program.days?.reduce((total: number, day: any) => {
              return total + (day.workouts?.length || 0);
            }, 0) || 0;

            const completedWorkouts = Math.round((customProgram.completion_percentage / 100) * totalWorkouts);

            programsData.push({
              id: customProgram.id,
              name: program.title,
              coachName: 'System Generated',
              level: program.level || 'beginner',
              totalWorkouts,
              completedWorkouts,
              dateAssigned: customProgram.created_at,
              progress: customProgram.completion_percentage || 0,
              type: 'customized'
            });
          }
        }
      }

      setPrograms(programsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load programs');
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchPrograms();

      // Set up real-time subscriptions
      const assignmentsChannel = supabase
        .channel('program_assignments')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'coach_program_assignments' },
          () => fetchPrograms()
        )
        .subscribe();

      const completionsChannel = supabase
        .channel('workout_completions_programs')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'workout_completions' },
          () => fetchPrograms()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(assignmentsChannel);
        supabase.removeChannel(completionsChannel);
      };
    }
  }, [userId, currentUserId, userRole]);

  return {
    programs,
    loading,
    error,
    hasPermission,
    refetch: fetchPrograms
  };
}