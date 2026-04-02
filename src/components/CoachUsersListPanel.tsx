import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: string;
  last_activity?: string;
  unreadCount?: number;
}

interface CoachUsersListPanelProps {
  coachId: string;
  onUserSelect?: (user: User) => void;
  selectedUserId?: string;
}

export const CoachUsersListPanel: React.FC<CoachUsersListPanelProps> = ({
  coachId,
  onUserSelect,
  selectedUserId
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (coachId) {
      fetchUsers();
      fetchUnreadCounts();
      setupRealtimeSubscriptions();
    }
  }, [coachId]);

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel(`coach-users-${coachId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles'
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchUsers = async () => {
    try {
      // First try coach assignments
      const { data: assignments } = await supabase
        .from('coach_assignments')
        .select(`
          user_profiles!inner(*)
        `)
        .eq('coach_id', coachId)
        .eq('is_active', true);

      let usersList: User[] = [];

      if (assignments && assignments.length > 0) {
        usersList = assignments.map(a => a.user_profiles);
      } else {
        // Fallback to all users with 'user' role
        const { data: allUsers } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('role', 'user')
          .order('created_at', { ascending: false });

        usersList = allUsers || [];
      }

      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const { data } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', coachId)
        .eq('read_status', false);

      const counts: Record<string, number> = {};
      data?.forEach(msg => {
        counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  const getUserName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email?.split('@')[0] || 'User';
  };

  const getUserInitials = (user: User) => {
    const name = getUserName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center space-x-3 p-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p className="font-medium">No users available</p>
        <p className="text-sm mt-1">Users will appear here when assigned</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {users.map(user => {
          const unread = unreadCounts[user.id] || 0;
          
          return (
            <div
              key={user.id}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedUserId === user.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onUserSelect?.(user)}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <OnlineStatusIndicator 
                    status={user.status || 'offline'} 
                    className="absolute -bottom-1 -right-1"
                  />
                  {unread > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
                    >
                      {unread}
                    </Badge>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {getUserName(user)}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};