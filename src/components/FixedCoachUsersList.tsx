import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Send, MessageCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const FixedCoachUsersList = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [currentCoach, setCurrentCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    loadCoach();
  }, []);

  useEffect(() => {
    if (currentCoach) {
      loadUsers();
      setupRealtimeSubscriptions();
    }
  }, [currentCoach]);

  useEffect(() => {
    if (selectedUser && currentCoach) {
      loadMessages();
      markAsRead();
    }
  }, [selectedUser]);

  const loadCoach = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setCurrentCoach({ ...user, profile });
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!currentCoach) return;
    
    const channel = supabase.channel(`coach-inbox-${currentCoach.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentCoach.id}`
      }, () => {
        loadUsers();
        if (selectedUser) loadMessages();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'coach_assignments',
        filter: `coach_id=eq.${currentCoach.id}`
      }, () => loadUsers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const loadUsers = async () => {
    if (!currentCoach) return;
    setLoading(true);
    
    try {
      // Get ALL users assigned to this coach - simplified query
      const { data: assignments, error: assignError } = await supabase
        .from('coach_assignments')
        .select(`
          user_id,
          user_profiles!coach_assignments_user_id_fkey (
            id,
            email,
            full_name,
            first_name,
            last_name
          )
        `)
        .eq('coach_id', currentCoach.id);

      console.log('Coach assignments query:', { assignments, assignError, coachId: currentCoach.id });

      if (assignError) {
        console.error('Assignment error:', assignError);
        setUsers([]);
        setLoading(false);
        return;
      }
      
      if (!assignments || assignments.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Build user list from assignments with joined profiles
      const userList = [];
      for (const assignment of assignments) {
        const profile = assignment.user_profiles;
        if (!profile) continue;

        // Get unread count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', profile.id)
          .eq('receiver_id', currentCoach.id)
          .eq('is_read', false);

        // Get last message
        const { data: recentMsg } = await supabase
          .from('messages')
          .select('created_at')
          .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${currentCoach.id}),and(sender_id.eq.${currentCoach.id},receiver_id.eq.${profile.id})`)
          .order('created_at', { ascending: false })
          .limit(1);

        userList.push({
          id: profile.id,
          name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
          email: profile.email,
          unread: count || 0,
          lastMessage: recentMsg?.[0]?.created_at || null
        });
      }

      // Sort by most recent first
      userList.sort((a, b) => {
        if (a.unread > 0 && b.unread === 0) return -1;
        if (b.unread > 0 && a.unread === 0) return 1;
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage).getTime() - new Date(a.lastMessage).getTime();
      });

      setUsers(userList);
      setDebugInfo({ assignments, userList });
    } catch (error) {
      console.error('Load users error:', error);
      setDebugInfo({ error });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!currentCoach || !selectedUser) return;
    
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentCoach.id},receiver_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},receiver_id.eq.${currentCoach.id})`)
      .order('created_at');

    setMessages(data || []);
  };

  const markAsRead = async () => {
    if (!currentCoach || !selectedUser) return;
    
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', selectedUser)
      .eq('receiver_id', currentCoach.id);
    
    // Update local state
    setUsers(prev => prev.map(u => 
      u.id === selectedUser ? { ...u, unread: 0 } : u
    ));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    
    await supabase.from('messages').insert({
      message: newMessage,
      content: newMessage,
      sender_id: currentCoach.id,
      receiver_id: selectedUser,
      is_read: false
    });
    
    setNewMessage('');
    loadMessages();
  };

  return (
    <div className="space-y-4">
      {/* Debug Info */}
      {currentCoach?.profile?.role === 'super_admin' && (
        <div className="p-4 bg-gray-100 rounded text-xs">
          <h4 className="font-bold mb-2">Debug Info:</h4>
          <p>Coach ID: {currentCoach?.id}</p>
          <p>Assignments: {debugInfo.assignments?.length || 0}</p>
          <p>Profiles: {debugInfo.profiles?.length || 0}</p>
          <p>User IDs: {debugInfo.userIds?.join(', ')}</p>
          {debugInfo.assignError && <p className="text-red-600">Assign Error: {debugInfo.assignError.message}</p>}
          {debugInfo.profileError && <p className="text-red-600">Profile Error: {debugInfo.profileError.message}</p>}
        </div>
      )}

      <div className="flex h-[600px] border rounded-lg bg-white">
        <div className="w-1/3 border-r">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              My Users ({users.length})
            </h3>
            <Button size="sm" variant="ghost" onClick={loadUsers}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100%-60px)]">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading assigned users...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No assigned users</p>
                <p className="text-xs mt-2">Users will appear here when assigned to you</p>
              </div>
            ) : (
              users.map(user => (
                <div
                  key={user.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedUser === user.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedUser(user.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.lastMessage && (
                        <p className="text-xs text-gray-400">
                          Last: {new Date(user.lastMessage).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {user.unread > 0 && (
                      <Badge variant="destructive">{user.unread}</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold">
                  {users.find(u => u.id === selectedUser)?.name}
                </h3>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_id === currentCoach?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.sender_id === currentCoach?.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        <p>{msg.message || msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a user to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};