import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useUnreadMessages = (userId?: string) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id')
          .eq('receiver_id', userId)
          .eq('is_read', false);

        if (error) {
          console.error('Error fetching unread messages:', error);
          setUnreadCount(0);
        } else {
          setUnreadCount(data?.length || 0);
        }
      } catch (err) {
        console.error('Error fetching unread messages:', err);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const markMessagesAsRead = async () => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
      } else {
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const getUnreadCountByType = async (messageType: string) => {
    if (!userId) return 0;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', userId)
        .eq('is_read', false)
        .eq('message_type', messageType);

      if (error) {
        console.error('Error fetching unread messages by type:', error);
        return 0;
      }
      
      return data?.length || 0;
    } catch (err) {
      console.error('Error fetching unread messages by type:', err);
      return 0;
    }
  };

  return { unreadCount, loading, markMessagesAsRead, getUnreadCountByType };
};