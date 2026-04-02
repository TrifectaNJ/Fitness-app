import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Users, Bell, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  message: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const FixedRealtimeCoachInbox = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentCoach, setCurrentCoach] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initCoach();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentCoach) {
      loadAssignedUsers();
      subscribeToMessages();
    }
  }, [currentCoach]);

  useEffect(() => {
    if (selectedUserId && currentCoach) {
      loadMessages();
    }
  }, [selectedUserId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initCoach = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setCurrentCoach({ ...user, profile });
      setDebugInfo(prev => ({ ...prev, coach: { id: user.id, email: user.email, role: profile?.role } }));
    }
  };

  const loadAssignedUsers = async () => {
    if (!currentCoach) return;
    setLoading(true);

    try {
      // Get ALL assignments without any filters
      const { data: assignments, error: assignError } = await supabase
        .from('coach_assignments')
        .select('user_id, coach_id, assigned_at')
        .eq('coach_id', currentCoach.id);

      console.log('Coach assignments query:', { 
        coachId: currentCoach.id, 
        assignments, 
        error: assignError 
      });

      setDebugInfo(prev => ({ 
        ...prev, 
        assignments: { 
          data: assignments, 
          error: assignError?.message, 
          count: assignments?.length || 0,
          query: `coach_id=${currentCoach.id}`
        }
      }));

      if (assignError) {
        console.error('Assignment error:', assignError);
        toast({
          title: 'Error loading assignments',
          description: assignError.message,
          variant: 'destructive'
        });
        setUsers([]);
        setLoading(false);
        return;
      }

      if (!assignments || assignments.length === 0) {
        console.log('No assignments found for coach:', currentCoach.id);
        setUsers([]);
        setLoading(false);
        return;
      }

      const userIds = assignments.map(a => a.user_id);
      console.log('User IDs from assignments:', userIds);

      // Get user profiles
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', userIds);

      console.log('User profiles:', { profiles, error: profileError });

      setDebugInfo(prev => ({ 
        ...prev, 
        profiles: { 
          data: profiles, 
          error: profileError?.message, 
          count: profiles?.length || 0 
        }
      }));

      if (profileError || !profiles?.length) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Build user list with message info
      const userList: User[] = [];
      let totalUnreadCount = 0;

      for (const profile of profiles) {
        // Get last message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${currentCoach.id}),and(sender_id.eq.${currentCoach.id},receiver_id.eq.${profile.id})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', profile.id)
          .eq('receiver_id', currentCoach.id)
          .eq('is_read', false);

        const unreadCount = count || 0;
        totalUnreadCount += unreadCount;

        userList.push({
          id: profile.id,
          name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'User',
          email: profile.email || '',
          lastMessage: lastMsg?.message || lastMsg?.content || 'No messages yet',
          lastMessageTime: lastMsg?.created_at || new Date().toISOString(),
          unreadCount
        });
      }

      console.log('Final user list:', userList);
      setUsers(userList.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      ));
      setTotalUnread(totalUnreadCount);

    } catch (error) {
      console.error('Error loading users:', error);
      setDebugInfo(prev => ({ ...prev, error: error }));
      toast({
        title: 'Error loading users',
        description: 'Please refresh the page',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!currentCoach || !selectedUserId) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentCoach.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${currentCoach.id})`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      markAsRead();
    }
  };

  const markAsRead = async () => {
    if (!currentCoach || !selectedUserId) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', selectedUserId)
      .eq('receiver_id', currentCoach.id);

    loadAssignedUsers();
  };
  const subscribeToMessages = () => {
    if (!currentCoach) return;

    const channel = supabase
      .channel(`coach-inbox-${currentCoach.id}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentCoach.id}`
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === selectedUserId) {
            setMessages(prev => [...prev, msg]);
            markAsRead();
          } else {
            loadAssignedUsers();
            toast({
              title: 'New Message',
              description: 'You have a new message from a user'
            });
          }
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_assignments',
          filter: `coach_id=eq.${currentCoach.id}`
        },
        () => {
          console.log('Coach assignment changed, reloading users');
          loadAssignedUsers();
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentCoach || !selectedUserId) return;

    setLoading(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        message: newMessage,
        content: newMessage,
        sender_id: currentCoach.id,
        receiver_id: selectedUserId,
        is_read: false
      });

    if (!error) {
      setNewMessage('');
      loadMessages();
      loadAssignedUsers();
    } else {
      toast({ title: 'Error sending message', variant: 'destructive' });
    }
    setLoading(false);
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Users - Real-time Chat</h1>
        <Button onClick={loadAssignedUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Debug Info */}
      {debugInfo.coach && (
        <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
          <strong>Coach:</strong> {debugInfo.coach.email} (Role: {debugInfo.coach.role})
          <br />
          <strong>Assignments:</strong> {debugInfo.assignments?.count || 0} users
          <br />
          <strong>Profiles:</strong> {debugInfo.profiles?.count || 0} loaded
        </div>
      )}

      <div className="flex h-[600px] border rounded-lg bg-white">
        <div className="w-1/3 border-r">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                My Users ({users.length})
              </span>
              {totalUnread > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  {totalUnread}
                </Badge>
              )}
            </h3>
          </div>
          <ScrollArea className="h-[calc(100%-60px)]">
            {users.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No assigned users found</p>
                {debugInfo.assignments?.count === 0 && (
                  <p className="text-xs mt-2">Check User Assignments tab to assign users</p>
                )}
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    selectedUserId === user.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.lastMessage}</p>
                    </div>
                    {user.unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {user.unreadCount}
                      </Badge>
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
                <h3 className="font-semibold">{selectedUser.name}</h3>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
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
                        <p className="text-sm">{msg.message || msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={loading}
                />
                <Button onClick={sendMessage} disabled={loading || !newMessage.trim()}>
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