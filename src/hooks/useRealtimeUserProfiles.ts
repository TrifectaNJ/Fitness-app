import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin' | 'coach';
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  height?: number;
  weight?: number;
  fitness_goals?: string[];
  medical_conditions?: string[];
  emergency_contact?: string;
  emergency_phone?: string;
  assigned_coach_id?: string;
  is_online?: boolean;
  last_seen?: string;
  created_at: string;
  updated_at: string;
}

export function useRealtimeUserProfiles() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProfiles(data || []);
        console.log('Loaded user profiles:', data?.length);
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();

    // Real-time subscription
    const channel = supabase
      .channel('user_profiles_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_profiles' },
        (payload) => {
          console.log('User profile change:', payload);
          
          if (payload.eventType === 'INSERT') {
            setProfiles(prev => [payload.new as UserProfile, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setProfiles(prev => prev.map(profile => 
              profile.id === payload.new.id ? payload.new as UserProfile : profile
            ));
          } else if (payload.eventType === 'DELETE') {
            setProfiles(prev => prev.filter(profile => profile.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { profiles, loading, error };
}