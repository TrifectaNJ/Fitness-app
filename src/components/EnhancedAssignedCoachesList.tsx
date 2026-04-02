import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';
import { useRealtimeChat } from '../hooks/useRealtimeChat';

interface AssignedCoach {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: string;
  last_activity?: string;
}

interface EnhancedAssignedCoachesListProps {
  userId: string;
  onCoachSelect: (coach: AssignedCoach) => void;
  selectedCoachId?: string;
}

export const EnhancedAssignedCoachesList: React.FC<EnhancedAssignedCoachesListProps> = ({
  userId,
  onCoachSelect,
  selectedCoachId
}) => {
  const [assignedCoaches, setAssignedCoaches] = useState<AssignedCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const { getUnreadCount, isUserTyping } = useRealtimeChat(userId);

  useEffect(() => {
    if (userId) {
      fetchAssignedCoaches();
      setupRealtimeSubscriptions();
    }
  }, [userId]);

  const setupRealtimeSubscriptions = () => {
    // Subscribe to coach status changes
    const statusChannel = supabase
      .channel('coach-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles'
        },
        () => {
          fetchAssignedCoaches();
        }
      )
      .subscribe();

    // Subscribe to coach assignment changes
    const assignmentChannel = supabase
      .channel('user-assignment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_assignments'
        },
        () => {
          fetchAssignedCoaches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(assignmentChannel);
    };
  };

  const fetchAssignedCoaches = async () => {
    try {
      console.log('Fetching assigned coaches for user ID:', userId);
      
      // First, fetch the coach assignments for this specific user
      const { data: assignments, error: assignmentError } = await supabase
        .from('coach_assignments')
        .select('coach_id')
        .eq('user_id', userId);

      if (assignmentError) {
        console.error('Error fetching coach assignments:', assignmentError);
        setAssignedCoaches([]);
        setLoading(false);
        return;
      }

      console.log('Coach assignments found:', assignments);

      // If no assignments, show empty state
      if (!assignments || assignments.length === 0) {
        console.log('No coaches assigned to this user');
        setAssignedCoaches([]);
        setLoading(false);
        return;
      }

      // Extract coach IDs from assignments
      const coachIds = assignments.map(a => a.coach_id);
      console.log('Coach IDs assigned to user:', coachIds);

      // Fetch the user profiles for assigned coaches
      const { data: coaches, error: coachesError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', coachIds)
        .order('first_name', { ascending: true });

      if (coachesError) {
        console.error('Error fetching coach profiles:', coachesError);
        setAssignedCoaches([]);
        setLoading(false);
        return;
      }

      console.log('Coach profiles fetched:', coaches);

      let assignedCoachesList: AssignedCoach[] = coaches?.map(coach => ({
        id: coach.id,
        first_name: coach.first_name,
        last_name: coach.last_name,
        email: coach.email,
        status: coach.status || 'offline',
        last_activity: coach.last_activity
      })) || [];

      console.log(`Found ${assignedCoachesList.length} assigned coaches for user`);

      // Sort by: unread messages first, then online status, then alphabetically
      const sortedCoaches = assignedCoachesList.sort((a, b) => {
        const aUnread = getUnreadCount(a.id);
        const bUnread = getUnreadCount(b.id);
        
        // Coaches with unread messages first
        if (aUnread > 0 && bUnread === 0) return -1;
        if (bUnread > 0 && aUnread === 0) return 1;
        
        // Then by online status
        const statusPriority = { online: 1, away: 2, busy: 3, offline: 4 };
        const aStatus = statusPriority[a.status as keyof typeof statusPriority] || 5;
        const bStatus = statusPriority[b.status as keyof typeof statusPriority] || 5;
        
        if (aStatus !== bStatus) return aStatus - bStatus;
        
        // Finally alphabetically
        const aName = getCoachDisplayName(a);
        const bName = getCoachDisplayName(b);
        return aName.localeCompare(bName);
      });

      setAssignedCoaches(sortedCoaches);
    } catch (error) {
      console.error('Error fetching assigned coaches:', error);
      setAssignedCoaches([]);
    } finally {
      setLoading(false);
    }
  };

  const getCoachDisplayName = (coach: AssignedCoach) => {
    if (coach.first_name && coach.last_name) {
      return `${coach.first_name} ${coach.last_name}`;
    }
    if (coach.first_name) {
      return coach.first_name;
    }
    return coach.email?.split('@')[0] || 'Coach';
  };

  const getCoachInitials = (coach: AssignedCoach) => {
    if (coach.first_name && coach.last_name) {
      return `${coach.first_name[0]}${coach.last_name[0]}`.toUpperCase();
    }
    if (coach.first_name) {
      return coach.first_name[0].toUpperCase();
    }
    return coach.email?.[0]?.toUpperCase() || 'C';
  };

  const getLastSeenText = (coach: AssignedCoach) => {
    if (coach.status === 'online') return 'Online';
    if (!coach.last_activity) return 'Never';
    
    const lastSeen = new Date(coach.last_activity);
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

  if (assignedCoaches.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          </div>
          <div>
            <p className="font-medium text-gray-600">No assigned coaches</p>
            <p className="text-sm text-gray-400 mt-1">Coaches will appear here when assigned to you</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-1 p-2">
        {assignedCoaches.map((coach) => {
          const unreadCount = getUnreadCount(coach.id);
          const coachTyping = isUserTyping(coach.id);
          
          return (
            <div
              key={coach.id}
              className={`p-3 cursor-pointer rounded-lg transition-all duration-200 ${
                selectedCoachId === coach.id 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg' 
                  : 'hover:bg-gray-800/50'
              }`}
              onClick={() => onCoachSelect(coach)}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="w-11 h-11 border-2 border-orange-500/30">
                    <AvatarFallback className="bg-orange-500 text-white font-semibold">
                      {getCoachInitials(coach)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <OnlineStatusIndicator status={coach.status || 'offline'} size="md" />
                  </div>
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1">
                      <Badge 
                        variant="destructive" 
                        className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full bg-orange-600"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium truncate ${selectedCoachId === coach.id ? 'text-white' : 'text-gray-200'}`}>
                      {getCoachDisplayName(coach)}
                    </p>
                    {coachTyping && (
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    )}
                  </div>
                  
                  <p className={`text-sm truncate ${selectedCoachId === coach.id ? 'text-orange-100' : 'text-gray-400'}`}>
                    {coach.email}
                  </p>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-xs ${selectedCoachId === coach.id ? 'text-orange-200' : 'text-gray-500'}`}>
                      {getLastSeenText(coach)}
                    </p>
                    {coachTyping && (
                      <span className="text-xs text-orange-300 italic">typing...</span>
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
