import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GoalAchievement } from './useRealtimeTrackerProgress';

export interface CoachNotification {
  id: string;
  type: 'goal_achievement' | 'milestone' | 'streak' | 'program_completion';
  userId: string;
  userName: string;
  message: string;
  data: any;
  timestamp: string;
  read: boolean;
}

export function useCoachNotifications(coachId?: string) {
  const [notifications, setNotifications] = useState<CoachNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coachId) {
      setLoading(false);
      return;
    }

    // Subscribe to goal achievements
    const achievementChannel = supabase
      .channel('goal_achievements')
      .on('broadcast', { event: 'goal_achieved' }, async (payload) => {
        const achievement = payload.payload as GoalAchievement;
        
        // Get user name
        const { data: user } = await supabase
          .from('user_profiles')
          .select('full_name, email')
          .eq('id', achievement.userId)
          .single();

        const userName = user?.full_name || user?.email || 'Unknown User';
        
        const notification: CoachNotification = {
          id: `goal_${Date.now()}`,
          type: 'goal_achievement',
          userId: achievement.userId,
          userName,
          message: `${userName} reached their ${achievement.goalType} ${achievement.trackerType} goal! (${achievement.value}/${achievement.goal})`,
          data: achievement,
          timestamp: achievement.achievedAt,
          read: false
        };

        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification('Goal Achievement!', {
            body: notification.message,
            icon: '/favicon.ico'
          });
        }
      })
      .subscribe();

    // Subscribe to program completions
    const programChannel = supabase
      .channel('program_completions')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'workout_completions' },
        async (payload) => {
          const completion = payload.new;
          
          // Get user name
          const { data: user } = await supabase
            .from('user_profiles')
            .select('full_name, email')
            .eq('id', completion.user_id)
            .single();

          const userName = user?.full_name || user?.email || 'Unknown User';
          
          const notification: CoachNotification = {
            id: `completion_${completion.id}`,
            type: 'program_completion',
            userId: completion.user_id,
            userName,
            message: `${userName} completed a workout! Duration: ${completion.duration_minutes || 0} minutes`,
            data: completion,
            timestamp: completion.completed_at,
            read: false
          };

          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    setLoading(false);

    return () => {
      supabase.removeChannel(achievementChannel);
      supabase.removeChannel(programChannel);
    };
  }, [coachId]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
}