import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';

interface AssignedUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: string;
  last_activity?: string;
}

interface AssignedUsersListProps {
  coachId: string;
  onUserSelect: (user: AssignedUser) => void;
  selectedUserId?: string;
}

export const AssignedUsersList: React.FC<AssignedUsersListProps> = ({
  coachId,
  onUserSelect,
  selectedUserId
}) => {
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (coachId) {
      fetchAssignedUsers();
      
      // Set up real-time subscription for user status updates
      const channel = supabase
        .channel('assigned-users-status')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_profiles'
          },
          () => {
            fetchAssignedUsers();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'coach_assignments'
          },
          () => {
            fetchAssignedUsers();
          }
        )
        .subscribe();
      
      // Refresh every 10 seconds to catch status changes
      const interval = setInterval(fetchAssignedUsers, 10000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [coachId]);

  const fetchAssignedUsers = async () => {
    try {
      console.log('Fetching assigned users for coach ID:', coachId);
      
      // Get ALL users assigned to this coach (regardless of online status or active status)
      const { data: assignments, error } = await supabase
        .from('coach_assignments')
        .select(`
          user_id,
          is_active,
          user_profiles!inner(
            id,
            first_name,
            last_name,
            email,
            status,
            last_activity
          )
        `)
        .eq('coach_id', coachId);

      console.log('Coach assignments query result:', { assignments, error });

      if (error) {
        console.error('Error fetching assigned users:', error);
        return;
      }

      const users = assignments?.map(item => ({
        id: item.user_profiles.id,
        first_name: item.user_profiles.first_name,
        last_name: item.user_profiles.last_name,
        email: item.user_profiles.email,
        status: item.user_profiles.status || 'offline',
        last_activity: item.user_profiles.last_activity
      })) || [];

      console.log('Processed assigned users:', users);

      // Sort by status priority (online first, then away, busy, then offline)
      const sortedUsers = users.sort((a, b) => {
        const statusPriority = { online: 1, away: 2, busy: 3, offline: 4 };
        return (statusPriority[a.status as keyof typeof statusPriority] || 5) - 
               (statusPriority[b.status as keyof typeof statusPriority] || 5);
      });

      setAssignedUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching assigned users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = (user: AssignedUser) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    return user.email?.split('@')[0] || 'User';
  };

  const getUserInitials = (user: AssignedUser) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.first_name) {
      return user.first_name[0].toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading assigned users...
      </div>
    );
  }

  if (assignedUsers.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
          </div>
          <p className="text-sm">No assigned users</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-80">
      {assignedUsers.map((user) => (
        <div
          key={user.id}
          className={`p-3 cursor-pointer hover:bg-gray-50 border-b transition-colors ${
            selectedUserId === user.id ? 'bg-blue-50 border-blue-200' : ''
          }`}
          onClick={() => onUserSelect(user)}
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5">
                <OnlineStatusIndicator status={user.status || 'offline'} size="md" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {getUserDisplayName(user)}
              </p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              <p className="text-xs text-gray-400 capitalize">
                {user.status || 'offline'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </ScrollArea>
  );
};