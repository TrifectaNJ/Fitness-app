import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id?: string;
  group_id?: string;
  message: string;
  message_type: 'text' | 'image' | 'file';
  file_url?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender_profile?: {
    full_name?: string;
    avatar_url?: string;
    role: string;
  };
}

export function useRealtimeChatMessages(userId?: string, groupId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId && !groupId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchMessages = async () => {
      try {
        let query = supabase
          .from('messages')
          .select(`
            *,
            sender_profile:user_profiles!sender_id(full_name, avatar_url, role)
          `)
          .order('created_at', { ascending: true });

        if (groupId) {
          query = query.eq('group_id', groupId);
        } else if (userId) {
          query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        setMessages(data || []);
        console.log('Loaded chat messages:', data?.length);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel('chat_messages_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        async (payload) => {
          console.log('Chat message change:', payload);
          
          // Fetch full message with profile data
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('messages')
              .select(`
                *,
                sender_profile:user_profiles!sender_id(full_name, avatar_url, role)
              `)
              .eq('id', payload.new.id)
              .single();
              
            if (data) {
              setMessages(prev => [...prev, data]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            ));
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, groupId]);

  return { messages, loading, error };
}