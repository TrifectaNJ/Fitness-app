import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ChatNotificationBadgeProps {
  userId: string;
  onClick: () => void;
  variant: 'user' | 'coach';
}

const ChatNotificationBadge: React.FC<ChatNotificationBadgeProps> = ({ 
  userId, 
  onClick, 
  variant 
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchUnreadCount();
      
      // Set up real-time subscription
      const channel = supabase
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
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  const fetchUnreadCount = async () => {
    if (!userId) return;
    
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('read_status', false);
    
    setUnreadCount(count || 0);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
      >
        <MessageCircle className="w-5 h-5" />
        {variant === 'coach' && <span className="ml-2 hidden sm:inline">Messages</span>}
      </Button>
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </div>
  );
};

export default ChatNotificationBadge;