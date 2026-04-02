import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export const useUserStatus = (userId: string | null) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef(false);

  const updateStatus = async (status: 'online' | 'offline' | 'away' | 'busy') => {
    if (!userId) return;
    
    try {
      await supabase
        .from('user_profiles')
        .update({ 
          status, 
          last_activity: new Date().toISOString(),
          last_seen: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const setOnline = () => {
    if (!isOnlineRef.current) {
      isOnlineRef.current = true;
      updateStatus('online');
      
      // Update status every 30 seconds while online
      intervalRef.current = setInterval(() => {
        updateStatus('online');
      }, 30000);
    }
  };

  const setOffline = () => {
    if (isOnlineRef.current) {
      isOnlineRef.current = false;
      updateStatus('offline');
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const setAway = () => updateStatus('away');
  const setBusy = () => updateStatus('busy');

  useEffect(() => {
    if (!userId) return;

    // Set online when component mounts
    setOnline();

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAway();
      } else {
        setOnline();
      }
    };

    // Handle beforeunload to set offline
    const handleBeforeUnload = () => {
      setOffline();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      setOffline();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId]);

  return { setOnline, setOffline, setAway, setBusy };
};