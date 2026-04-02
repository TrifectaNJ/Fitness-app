import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';

interface OnlineUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  avatar_url?: string;
  last_seen?: string;
  status?: string;
  last_activity?: string;
}

interface OnlineUsersListSimpleProps {
  currentUser: {
    id: string;
    name: string;
  } | null;
  onUserSelect: (user: OnlineUser) => void;
}

export const OnlineUsersListSimple: React.FC<OnlineUsersListSimpleProps> = ({ 
  currentUser, 
  onUserSelect 
}) => {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    
    // Set up real-time subscription for user status changes
    const subscription = supabase
      .channel('user_status_changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'user_profiles' },
        (payload) => {
          setUsers(prev => prev.map(user => 
            user.id === payload.new.id 
              ? { ...user, ...payload.new }
              : user
          ));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser]);

  const loadUsers = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name, role, avatar_url, last_seen, status, last_activity')
      .neq('id', currentUser.id)
      .order('status', { ascending: true })
      .order('last_activity', { ascending: false });
    
    if (data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'coach': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'coach': return 'Coach';
      default: return 'User';
    }
  };

  const getUserName = (user: OnlineUser) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email.split('@')[0];
  };

  const getLastSeenText = (user: OnlineUser) => {
    const status = user.status || 'offline';
    if (status === 'online') return 'Online';
    if (status === 'away') return 'Away';
    if (status === 'busy') return 'Busy';
    
    const lastSeen = user.last_seen;
    if (!lastSeen) return 'Offline';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const onlineUsers = users.filter(u => u.status === 'online');
  const totalUsers = users.length;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Users className="h-4 w-4" />
          Online Users ({onlineUsers.length})
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-gray-500 text-sm">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No other users found</div>
        ) : (
          <div className="space-y-1 p-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg"
                onClick={() => onUserSelect(user)}
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {getUserName(user).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <OnlineStatusIndicator status={user.status || 'offline'} size="sm" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-xs truncate">{getUserName(user)}</p>
                    <Badge className={`text-xs px-1 py-0 ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {getLastSeenText(user)}
                  </p>
                </div>
                <MessageCircle className="h-3 w-3 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};