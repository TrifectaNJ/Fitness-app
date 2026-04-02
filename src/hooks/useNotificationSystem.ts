import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface NotificationData {
  id: string;
  user_id: string;
  type: 'message' | 'mention' | 'system' | 'goal_achievement' | 'program_completion';
  title: string;
  message: string;
  data: any;
  read: boolean;
  delivered: boolean;
  delivery_status: 'pending' | 'delivered' | 'failed' | 'read';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  read_at?: string;
  delivered_at?: string;
}

export interface NotificationPreferences {
  push_enabled: boolean;
  sound_enabled: boolean;
  desktop_enabled: boolean;
  email_enabled: boolean;
  message_notifications: boolean;
  mention_notifications: boolean;
  system_notifications: boolean;
  goal_notifications: boolean;
  sound_type: 'default' | 'chime' | 'bell' | 'none';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export function useNotificationSystem(userId?: string) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [userId]);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const defaultPrefs = {
          user_id: userId,
          push_enabled: true,
          sound_enabled: true,
          desktop_enabled: true,
          email_enabled: false,
          message_notifications: true,
          mention_notifications: true,
          system_notifications: true,
          goal_notifications: true,
          sound_type: 'default' as const,
          quiet_hours_enabled: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00'
        };

        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert(defaultPrefs)
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newPrefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, [userId]);

  // Initialize
  useEffect(() => {
    if (userId) {
      Promise.all([loadNotifications(), loadPreferences()]).finally(() => {
        setLoading(false);
      });
    }
  }, [userId, loadNotifications, loadPreferences]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newNotification = payload.new as NotificationData;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Handle desktop notification
          if (preferences?.desktop_enabled && Notification.permission === 'granted') {
            showDesktopNotification(newNotification);
          }
          
          // Handle sound alert
          if (preferences?.sound_enabled) {
            playNotificationSound(preferences.sound_type);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, preferences]);

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString(),
          delivery_status: 'read'
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.map(n => 
        n.id === notificationId 
          ? { ...n, read: true, read_at: new Date().toISOString(), delivery_status: 'read' as const }
          : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString(),
          delivery_status: 'read'
        })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ 
        ...n, 
        read: true, 
        read_at: new Date().toISOString(),
        delivery_status: 'read' as const
      })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Update preferences
  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(newPreferences)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  return {
    notifications,
    preferences,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    requestNotificationPermission,
    refresh: loadNotifications
  };
}

// Helper functions
function showDesktopNotification(notification: NotificationData) {
  if (Notification.permission === 'granted') {
    const desktopNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id
    });

    desktopNotification.onclick = () => {
      window.focus();
      desktopNotification.close();
    };

    setTimeout(() => desktopNotification.close(), 5000);
  }
}

function playNotificationSound(soundType: string) {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const frequencies: Record<string, number> = {
    default: 800,
    chime: 1000,
    bell: 600,
    none: 0
  };

  if (soundType === 'none' || !frequencies[soundType]) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequencies[soundType];
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}