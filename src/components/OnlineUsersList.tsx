import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UserChatModal } from './UserChatModal';
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

interface OnlineUsersListProps {
  currentUser: {
    id: string;
    name: string;
  } | null;
}

export const OnlineUsersList: React.FC<OnlineUsersListProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<OnlineUser | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
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
      case 'user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'coach': return 'Coach';
      case 'user': return 'User';
      default: return role;
    }
  };

  const getUserName = (user: OnlineUser) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email.split('@')[0];
  };

  const handleUserClick = (user: OnlineUser) => {
    setSelectedUser(user);
    setIsChatOpen(true);
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

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Online Users ({onlineUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No other users found</div>
            ) : (
              <div className="space-y-1">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{getUserName(user).charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <OnlineStatusIndicator status={user.status || 'offline'} size="md" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{getUserName(user)}</p>
                        <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <p className="text-xs text-gray-400">{getLastSeenText(user)}</p>
                    </div>
                    <MessageCircle className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <UserChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        targetUser={selectedUser ? {
          id: selectedUser.id,
          name: getUserName(selectedUser),
          email: selectedUser.email,
          avatar: selectedUser.avatar_url,
          last_seen: selectedUser.last_seen
        } : null}
        currentUser={currentUser}
      />
    </>
  );
};