import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProgressItem {
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  type: 'water' | 'weight' | 'steps' | 'calories' | 'workouts' | 'programs';
  value: number;
  unit: string;
  target?: number;
}

export interface UserInfo {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export function useUserProgressDataQA(currentUserId: string, userRole: string, selectedUserId: string = 'all') {
  const [progressData, setProgressData] = useState<UserProgressItem[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(true);

  // Role-based permission checking
  const checkPermissions = async () => {
    try {
      if (userRole === 'super_admin') {
        setHasPermission(true);
        return true;
      }

      if (userRole === 'admin') {
        setHasPermission(true);
        return true;
      }

      if (userRole === 'coach') {
        // Check if viewing assigned users only
        if (selectedUserId === 'all') {
          setHasPermission(true);
          return true;
        }
        
        // Check if this coach is assigned to the selected user
        const { data: assignment } = await supabase
          .from('coach_assignments')
          .select('id')
          .eq('coach_id', currentUserId)
          .eq('user_id', selectedUserId)
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

  // Get users based on role permissions
  const fetchUsers = async () => {
    try {
      let query = supabase.from('user_profiles').select('id, full_name, email, role');

      if (userRole === 'coach') {
        // Coaches only see their assigned users
        const { data: assignments } = await supabase
          .from('coach_assignments')
          .select('user_id')
          .eq('coach_id', currentUserId);

        if (assignments && assignments.length > 0) {
          const userIds = assignments.map(a => a.user_id);
          query = query.in('id', userIds);
        } else {
          setUsers([]);
          return;
        }
      }

      const { data: usersData, error: usersError } = await query.order('full_name');
      
      if (usersError) throw usersError;
      setUsers(usersData || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    }
  };

  // Fetch progress data with proper role filtering
  const fetchProgressData = async () => {
    try {
      setLoading(true);
      
      const hasAccess = await checkPermissions();
      if (!hasAccess) {
        setProgressData([]);
        setLoading(false);
        return;
      }

      let userIds: string[] = [];

      if (selectedUserId === 'all') {
        if (userRole === 'coach') {
          // Get assigned users for coach
          const { data: assignments } = await supabase
            .from('coach_assignments')
            .select('user_id')
            .eq('coach_id', currentUserId);
          
          userIds = assignments?.map(a => a.user_id) || [];
        } else {
          // Admin and super_admin see all users
          const { data: allUsers } = await supabase
            .from('user_profiles')
            .select('id');
          
          userIds = allUsers?.map(u => u.id) || [];
        }
      } else {
        userIds = [selectedUserId];
      }

      if (userIds.length === 0) {
        setProgressData([]);
        setLoading(false);
        return;
      }

      // Get user info for all relevant users
      const { data: usersInfo } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const userInfoMap = new Map(usersInfo?.map(u => [u.id, u]) || []);

      // Get progress trackers and entries
      const { data: trackers } = await supabase
        .from('progress_trackers')
        .select('*')
        .in('user_id', userIds);

      const { data: entries } = await supabase
        .from('progress_entries')
        .select('*')
        .in('user_id', userIds)
        .gte('date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      // Get workout completions
      const { data: workoutCompletions } = await supabase
        .from('workout_completions')
        .select('*')
        .in('user_id', userIds)
        .gte('completed_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('completed_at', { ascending: false });

      // Process data into unified format
      const progressItems: UserProgressItem[] = [];

      // Process tracker entries
      entries?.forEach(entry => {
        const tracker = trackers?.find(t => t.id === entry.tracker_id);
        const userInfo = userInfoMap.get(entry.user_id);
        
        if (tracker && userInfo) {
          progressItems.push({
            userId: entry.user_id,
            userName: userInfo.full_name || 'Unknown',
            userEmail: userInfo.email || '',
            date: entry.date,
            type: tracker.tracker_name.toLowerCase() as any,
            value: entry.value,
            unit: tracker.unit,
            target: tracker.daily_goal
          });
        }
      });

      // Process workout completions
      workoutCompletions?.forEach(completion => {
        const userInfo = userInfoMap.get(completion.user_id);
        
        if (userInfo) {
          progressItems.push({
            userId: completion.user_id,
            userName: userInfo.full_name || 'Unknown',
            userEmail: userInfo.email || '',
            date: completion.completed_at.split('T')[0],
            type: 'workouts',
            value: 1,
            unit: 'workout',
            target: undefined
          });
        }
      });

      setProgressData(progressItems);
      setError(null);
    } catch (err) {
      console.error('Error fetching progress data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load progress data');
      setProgressData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUserId, userRole]);

  useEffect(() => {
    fetchProgressData();

    // Set up real-time subscriptions
    const entriesChannel = supabase
      .channel('progress_entries_qa')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'progress_entries' },
        () => fetchProgressData()
      )
      .subscribe();

    const workoutChannel = supabase
      .channel('workout_completions_qa')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'workout_completions' },
        () => fetchProgressData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(entriesChannel);
      supabase.removeChannel(workoutChannel);
    };
  }, [currentUserId, userRole, selectedUserId]);

  return {
    progressData,
    users,
    loading,
    error,
    hasPermission,
    refetch: fetchProgressData
  };
}