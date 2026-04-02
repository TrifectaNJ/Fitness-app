import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  sender_name?: string;
  is_read: boolean;
}

interface AssignedUser {
  user_id: string;
  user_name: string;
  user_email: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  assignment_id: string;
}

export const AssignedCoachMessageCenter = () => {
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [currentCoach, setCurrentCoach] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrentCoach();
  }, []);

  useEffect(() => {
    if (currentCoach) {
      loadAssignedUsers();
    }
  }, [currentCoach]);

  useEffect(() => {
    if (selectedUser && currentCoach) {
      loadMessages();
      subscribeToMessages();
    }
  }, [selectedUser, currentCoach]);

  const getCurrentCoach = async () => {
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

  const loadAssignedUsers = async () => {
    if (!currentCoach) return;
    
    // Get users assigned to this coach
    const { data: assignments, error } = await supabase
      .from('coach_assignments')
      .select(`
        id,
        user_id,
        user:user_profiles!coach_assignments_user_id_fkey(id, full_name, email)
      `)
      .eq('coach_id', currentCoach.id)
      .eq('is_active', true);
    
    if (!assignments) return;

    // Get messages for assigned users
    const userIds = assignments.map(a => a.user_id);
    if (userIds.length === 0) {
      setAssignedUsers([]);
      return;
    }

    const { data: messages } = await supabase
      .from('messages')
      .select(`
        sender_id,
        receiver_id,
        content,
        created_at,
        is_read,
        sender:user_profiles!messages_sender_id_fkey(full_name, email)
      `)
      .or(`and(sender_id.in.(${userIds.join(',')}),receiver_id.eq.${currentCoach.id}),and(sender_id.eq.${currentCoach.id},receiver_id.in.(${userIds.join(',')}))`)
      .order('created_at', { ascending: false });
    
    // Build conversation list
    const userMap = new Map<string, AssignedUser>();
    
    assignments.forEach((assignment) => {
      if (assignment.user) {
        userMap.set(assignment.user_id, {
          user_id: assignment.user_id,
          user_name: assignment.user.full_name || 'Unknown User',
          user_email: assignment.user.email || '',
          last_message: 'No messages yet',
          last_message_time: new Date().toISOString(),
          unread_count: 0,
          assignment_id: assignment.id
        });
      }
    });

    // Update with message data
    if (messages) {
      messages.forEach((msg) => {
        const otherUserId = msg.sender_id === currentCoach.id ? msg.receiver_id : msg.sender_id;
        const user = userMap.get(otherUserId);
        
        if (user) {
          // Update last message if this is the most recent
          if (!user.last_message || user.last_message === 'No messages yet') {
            user.last_message = msg.content;
            user.last_message_time = msg.created_at;
          }
          
          // Count unread messages from user to coach
          if (!msg.is_read && msg.sender_id !== currentCoach.id) {
            user.unread_count++;
          }
        }
      });
    }
    
    setAssignedUsers(Array.from(userMap.values()));
  };

  const loadMessages = async () => {
    if (!currentCoach || !selectedUser) return;
    
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:user_profiles!messages_sender_id_fkey(full_name, email)
      `)
      .or(`and(sender_id.eq.${currentCoach.id},receiver_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},receiver_id.eq.${currentCoach.id})`)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data);
      markAsRead();
    }
  };

  const markAsRead = async () => {
    if (!currentCoach || !selectedUser) return;
    
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', selectedUser)
      .eq('receiver_id', currentCoach.id);
  };

  const subscribeToMessages = () => {
    if (!currentCoach) return;
    
    const subscription = supabase
      .channel('assigned_coach_messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, 
        () => {
          loadAssignedUsers();
          if (selectedUser) loadMessages();
        }
      )
      .subscribe();
    
    return () => subscription.unsubscribe();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentCoach || !selectedUser) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        content: newMessage,
        sender_id: currentCoach.id,
        receiver_id: selectedUser,
        is_read: false
      });
    
    if (error) {
      toast({ title: 'Error sending message', variant: 'destructive' });
    } else {
      setNewMessage('');
    }
    setLoading(false);
  };

  const selectedUserName = assignedUsers.find(u => u.user_id === selectedUser)?.user_name;

  return (
    <div className="flex h-[600px] border rounded-lg">
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assigned Users ({assignedUsers.length})
          </h3>
        </div>
        <ScrollArea className="h-full">
          {assignedUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No assigned users</p>
            </div>
          ) : (
            assignedUsers.map((user) => (
              <div
                key={user.user_id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedUser === user.user_id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedUser(user.user_id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{user.user_name}</p>
                    <p className="text-sm text-gray-500 truncate">{user.last_message}</p>
                  </div>
                  {user.unread_count > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {user.unread_count}
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
            <div className="p-4 border-b">
              <h3 className="font-semibold">Chat with {selectedUserName}</h3>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === currentCoach?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.sender_id === currentCoach?.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
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
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button onClick={sendMessage} disabled={loading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select an assigned user to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};