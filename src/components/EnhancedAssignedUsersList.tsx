import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';
import { useRealtimeChat } from '../hooks/useRealtimeChat';

interface AssignedUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: string;
  last_activity?: string;
}

interface EnhancedAssignedUsersListProps {
  coachId: string;
  onUserSelect: (user: AssignedUser) => void;
  selectedUserId?: string;
}

export const EnhancedAssignedUsersList: React.FC<EnhancedAssignedUsersListProps> = ({
  coachId,
  onUserSelect,
  selectedUserId
}) => {
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { getUnreadCount, isUserTyping } = useRealtimeChat(coachId);

  useEffect(() => {
    if (coachId) {
      fetchAssignedUsers();
      setupRealtimeSubscriptions();
    }
  }, [coachId]);

  const setupRealtimeSubscriptions = () => {
    // Subscribe to user status changes
    const statusChannel = supabase
      .channel('user-status-changes')
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
      .subscribe();

    // Subscribe to coach assignment changes
    const assignmentChannel = supabase
      .channel('coach-assignment-changes')
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

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(assignmentChannel);
    };
  };

  const fetchAssignedUsers = async () => {
    try {
      console.log('Fetching assigned users for coach ID:', coachId);
      
      // First, fetch the coach assignments for this specific coach
      const { data: assignments, error: assignmentError } = await supabase
        .from('coach_assignments')
        .select('user_id')
        .eq('coach_id', coachId);

      if (assignmentError) {
        console.error('Error fetching coach assignments:', assignmentError);
        setAssignedUsers([]);
        setLoading(false);
        return;
      }

      console.log('Coach assignments found:', assignments);

      // If no assignments, show empty state
      if (!assignments || assignments.length === 0) {
        console.log('No users assigned to this coach');
        setAssignedUsers([]);
        setLoading(false);
        return;
      }

      // Extract user IDs from assignments
      const userIds = assignments.map(a => a.user_id);
      console.log('User IDs assigned to coach:', userIds);

      // Fetch the user profiles for assigned users
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', userIds)
        .order('first_name', { ascending: true });

      if (usersError) {
        console.error('Error fetching user profiles:', usersError);
        setAssignedUsers([]);
        setLoading(false);
        return;
      }

      console.log('User profiles fetched:', users);

      let assignedUsersList: AssignedUser[] = users?.map(user => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        status: user.status || 'offline',
        last_activity: user.last_activity
      })) || [];

      console.log(`Found ${assignedUsersList.length} assigned users for coach`);

      // Sort by: unread messages first, then online status, then alphabetically
      const sortedUsers = assignedUsersList.sort((a, b) => {
        const aUnread = getUnreadCount(a.id);
        const bUnread = getUnreadCount(b.id);
        
        // Users with unread messages first
        if (aUnread > 0 && bUnread === 0) return -1;
        if (bUnread > 0 && aUnread === 0) return 1;
        
        // Then by online status
        const statusPriority = { online: 1, away: 2, busy: 3, offline: 4 };
        const aStatus = statusPriority[a.status as keyof typeof statusPriority] || 5;
        const bStatus = statusPriority[b.status as keyof typeof statusPriority] || 5;
        
        if (aStatus !== bStatus) return aStatus - bStatus;
        
        // Finally alphabetically
        const aName = getUserDisplayName(a);
        const bName = getUserDisplayName(b);
        return aName.localeCompare(bName);
      });

      setAssignedUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching assigned users:', error);
      setAssignedUsers([]);
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

  const getLastSeenText = (user: AssignedUser) => {
    if (user.status === 'online') return 'Online';
    if (!user.last_activity) return 'Never';
    
    const lastSeen = new Date(user.last_activity);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastSeen.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (assignedUsers.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          </div>
          <div>
            <p className="font-medium text-gray-600">No assigned users</p>
            <p className="text-sm text-gray-400 mt-1">Users will appear here when assigned to you</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-1 p-2">
        {assignedUsers.map((user) => {
          const unreadCount = getUnreadCount(user.id);
          const userTyping = isUserTyping(user.id);
          
          return (
            <div
              key={user.id}
              className={`p-3 cursor-pointer rounded-lg transition-all duration-200 ${
                selectedUserId === user.id 
                  ? 'bg-blue-50 border-2 border-blue-200 shadow-sm' 
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
              onClick={() => onUserSelect(user)}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="w-11 h-11">
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-semibold">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <OnlineStatusIndicator status={user.status || 'offline'} size="md" />
                  </div>
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1">
                      <Badge 
                        variant="destructive" 
                        className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 truncate">
                      {getUserDisplayName(user)}
                    </p>
                    {userTyping && (
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">
                      {getLastSeenText(user)}
                    </p>
                    {userTyping && (
                      <span className="text-xs text-blue-500 italic">typing...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};