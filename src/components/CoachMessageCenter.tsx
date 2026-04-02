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

interface Conversation {
  user_id: string;
  user_name: string;
  user_email: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export const CoachMessageCenter = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
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
      loadConversations();
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

  const loadConversations = async () => {
    if (!currentCoach) return;
    
    const { data, error } = await supabase
      .from('messages')
      .select(`
        sender_id,
        receiver_id,
        content,
        created_at,
        is_read,
        sender:user_profiles!messages_sender_id_fkey(full_name, email)
      `)
      .or(`sender_id.eq.${currentCoach.id},receiver_id.eq.${currentCoach.id}`)
      .order('created_at', { ascending: false });
    
    if (data) {
      const convMap = new Map<string, Conversation>();
      
      data.forEach((msg) => {
        const otherUserId = msg.sender_id === currentCoach.id ? msg.receiver_id : msg.sender_id;
        
        if (!convMap.has(otherUserId)) {
          convMap.set(otherUserId, {
            user_id: otherUserId,
            user_name: msg.sender?.full_name || 'Unknown User',
            user_email: msg.sender?.email || '',
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: 0
          });
        }
        
        if (!msg.is_read && msg.sender_id !== currentCoach.id) {
          const conv = convMap.get(otherUserId)!;
          conv.unread_count++;
        }
      });
      
      setConversations(Array.from(convMap.values()));
    }
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
      .channel('coach_messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, 
        () => {
          loadConversations();
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

  return (
    <div className="flex h-[600px] border rounded-lg">
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Conversations
          </h3>
        </div>
        <ScrollArea className="h-full">
          {conversations.map((conv) => (
            <div
              key={conv.user_id}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                selectedUser === conv.user_id ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedUser(conv.user_id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">{conv.user_name}</p>
                  <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
                </div>
                {conv.unread_count > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {conv.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
      
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b">
              <h3 className="font-semibold">Chat</h3>
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
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};