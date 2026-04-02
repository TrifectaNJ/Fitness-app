import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Send, MessageCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

export const CoachUsersList = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [currentCoach, setCurrentCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoach();
  }, []);

  useEffect(() => {
    if (currentCoach) {
      loadUsers();
      const channel = supabase.channel(`coach-${currentCoach.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentCoach.id}`
        }, () => loadUsers())
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'coach_assignments',
          filter: `coach_id=eq.${currentCoach.id}`
        }, () => loadUsers())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
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
    if (user) setCurrentCoach(user);
  };

  const loadUsers = async () => {
    if (!currentCoach) return;
    setLoading(true);
    
    // Get ALL assignments without filters
    const { data: assignments } = await supabase
      .from('coach_assignments')
      .select('*')
      .eq('coach_id', currentCoach.id);

    if (!assignments?.length) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const userIds = assignments.map(a => a.user_id);
    
    // Get profiles
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', userIds);

    // Get unread counts
    const userList = [];
    for (const p of profiles || []) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', p.id)
        .eq('receiver_id', currentCoach.id)
        .eq('is_read', false);

      userList.push({
        id: p.id,
        name: p.full_name || p.email,
        email: p.email,
        unread: count || 0
      });
    }

    setUsers(userList);
    setLoading(false);
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
    <div className="flex h-[600px] border rounded-lg bg-white">
      <div className="w-1/3 border-r">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Users
          </h3>
          <Button size="sm" variant="ghost" onClick={loadUsers}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-60px)]">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No assigned users</p>
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
  );
};