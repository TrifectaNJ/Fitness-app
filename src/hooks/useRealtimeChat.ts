import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: {
    full_name: string;
  };
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read_status: boolean;
  delivered_status: boolean;
  message_status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  read_at?: string;
  reactions?: MessageReaction[];
}

export interface TypingUser {
  user_id: string;
  timestamp: number;
}

export function useRealtimeChat(currentUserId: string, selectedUserId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch messages for selected conversation
  useEffect(() => {
    if (currentUserId && selectedUserId) {
      fetchMessages();
      setupRealtimeSubscription();
      markMessagesAsRead();
    }
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentUserId, selectedUserId]);

  // Fetch unread counts for all conversations
  useEffect(() => {
    if (currentUserId) {
      fetchUnreadCounts();
      setupUnreadCountsSubscription();
    }
  }, [currentUserId]);

  const fetchMessages = async () => {
    if (!currentUserId || !selectedUserId) return;
    
    setLoading(true);
    try {
      // Fetch messages with reactions
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          reactions:message_reactions(
            id,
            message_id,
            user_id,
            emoji,
            created_at,
            user:profiles(full_name)
          )
        `)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      const messagesWithStatus = (data || []).map(msg => ({
        ...msg,
        message_status: msg.read_status ? 'read' : (msg.delivered_status ? 'delivered' : 'sent'),
        read_at: msg.read_status ? msg.updated_at : undefined
      }));
      
      setMessages(messagesWithStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    if (!currentUserId) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', currentUserId)
        .eq('read_status', false);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(msg => {
        counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
      });
      
      setUnreadCounts(counts);
    } catch (err) {
      console.error('Error fetching unread counts:', err);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!currentUserId || !selectedUserId) return;
    
    channelRef.current = supabase
      .channel(`chat-${currentUserId}-${selectedUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${currentUserId}))`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as ChatMessage;
            setMessages(prev => [...prev, {
              ...newMessage,
              message_status: newMessage.read_status ? 'read' : 'delivered'
            }]);
            
            // Auto-mark as read if received
            if (newMessage.sender_id !== currentUserId) {
              setTimeout(() => markMessagesAsRead(), 1000);
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id 
                ? { ...msg, ...payload.new, message_status: payload.new.read_status ? 'read' : 'delivered' }
                : msg
            ));
          }
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== currentUserId) {
          setTypingUsers(prev => {
            const filtered = prev.filter(u => u.user_id !== payload.user_id);
            return [...filtered, { user_id: payload.user_id, timestamp: Date.now() }];
          });
          
          // Remove typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.user_id !== payload.user_id));
          }, 3000);
        }
      })
      .subscribe();
  };

  const setupUnreadCountsSubscription = () => {
    const unreadChannel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id.eq.${currentUserId}`
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();
      
    return () => supabase.removeChannel(unreadChannel);
  };

  const sendMessage = async (message: string): Promise<boolean> => {
    if (!currentUserId || !selectedUserId || !message.trim()) return false;
    
    const tempId = `temp-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: selectedUserId,
      message: message.trim(),
      created_at: new Date().toISOString(),
      read_status: false,
      delivered_status: false,
      message_status: 'sending'
    };

    // Optimistically add message
    setMessages(prev => [...prev, tempMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedUserId,
          message: message.trim(),
          delivered_status: true
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Replace temp message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...data, message_status: 'sent' }
          : msg
      ));
      
      return true;
    } catch (err) {
      // Mark temp message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, message_status: 'failed' }
          : msg
      ));
      
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  };

  const markMessagesAsRead = async () => {
    if (!currentUserId || !selectedUserId) return;
    
    try {
      const readAt = new Date().toISOString();
      await supabase
        .from('messages')
        .update({ 
          read_status: true,
          read_at: readAt
        })
        .eq('sender_id', selectedUserId)
        .eq('receiver_id', currentUserId)
        .eq('read_status', false);
        
      // Update local messages with read timestamp
      setMessages(prev => prev.map(msg => 
        msg.sender_id === selectedUserId && msg.receiver_id === currentUserId && !msg.read_status
          ? { ...msg, read_status: true, read_at: readAt, message_status: 'read' }
          : msg
      ));
        
      // Update local unread counts
      setUnreadCounts(prev => ({ ...prev, [selectedUserId]: 0 }));
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const sendTypingIndicator = () => {
    if (!currentUserId || !selectedUserId) return;
    
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUserId }
    });
  };

  const isUserTyping = (userId: string): boolean => {
    return typingUsers.some(u => u.user_id === userId);
  };

  const getUnreadCount = (userId: string): number => {
    return unreadCounts[userId] || 0;
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    markMessagesAsRead,
    sendTypingIndicator,
    isUserTyping,
    getUnreadCount,
    unreadCounts
  };
}