import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Users, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  unreadCount: number;
  lastMessageTime: string;
}

interface Message {
  id: string;
  message: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
}

export const ImprovedCoachInbox = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentCoach, setCurrentCoach] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeCoach();
  }, []);

  useEffect(() => {
    if (currentCoach) {
      loadAssignedUsers();
      setupRealtimeSubscriptions();
    }
  }, [currentCoach]);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages();
      markMessagesAsRead();
    }
  }, [selectedUserId]);

  const initializeCoach = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentCoach(user);
    }
  };

  const loadAssignedUsers = async () => {
    if (!currentCoach) return;
    setLoading(true);

    try {
      // Get assignments
      const { data: assignments } = await supabase
        .from('coach_assignments')
        .select('user_id')
        .eq('coach_id', currentCoach.id);

      if (!assignments?.length) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const userIds = assignments.map(a => a.user_id);
      
      // Get user profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, first_name, last_name')
        .in('id', userIds);

      if (!profiles?.length) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Build user list with unread counts
      const userList: User[] = [];
      
      for (const profile of profiles) {
        // Get unread count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', profile.id)
          .eq('receiver_id', currentCoach.id)
          .eq('is_read', false);

        // Get last message time
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('created_at')
          .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${currentCoach.id}),and(sender_id.eq.${currentCoach.id},receiver_id.eq.${profile.id})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        userList.push({
          id: profile.id,
          name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
          email: profile.email,
          unreadCount: count || 0,
          lastMessageTime: lastMsg?.created_at || new Date().toISOString()
        });
      }

      // Sort by last message time
      userList.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      setUsers(userList);

    } catch (error) {
      console.error('Error loading users:', error);
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
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const markMessagesAsRead = async () => {
    if (!currentCoach || !selectedUserId) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', selectedUserId)
      .eq('receiver_id', currentCoach.id);

    // Update user list to remove unread badge
    setUsers(prev => prev.map(user => 
      user.id === selectedUserId ? { ...user, unreadCount: 0 } : user
    ));
  };

  const setupRealtimeSubscriptions = () => {
    if (!currentCoach) return;

    // Subscribe to new messages
    const channel = supabase
      .channel(`coach-messages-${currentCoach.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentCoach.id}`
      }, (payload) => {
        const newMsg = payload.new as Message;
        
        if (newMsg.sender_id === selectedUserId) {
          setMessages(prev => [...prev, newMsg]);
          markMessagesAsRead();
        } else {
          // Update unread count for the sender
          setUsers(prev => prev.map(user => 
            user.id === newMsg.sender_id 
              ? { ...user, unreadCount: user.unreadCount + 1, lastMessageTime: newMsg.created_at }
              : user
          ).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()));
          
          toast({
            title: 'New Message',
            description: 'You have a new message from a user'
          });
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentCoach || !selectedUserId) return;

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
    } else {
      toast({ title: 'Error sending message', variant: 'destructive' });
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);
  const totalUnread = users.reduce((sum, user) => sum + user.unreadCount, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Users</h1>
        <Button onClick={loadAssignedUsers} disabled={loading}>
          Refresh
        </Button>
      </div>

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
                <p>No assigned users</p>
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
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    {user.unreadCount > 0 && (
                      <Badge variant="destructive">
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
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
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