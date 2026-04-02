import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, UserX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  sender_name?: string;
}

export const UserCoachChatSimple = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignedCoach, setAssignedCoach] = useState<any>(null);
  const [isAssigned, setIsAssigned] = useState(false);
  const [checkingAssignment, setCheckingAssignment] = useState(true);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      checkCoachAssignment();
    }
  }, [currentUser]);

  useEffect(() => {
    if (assignedCoach && isAssigned) {
      loadMessages();
      subscribeToMessages();
    }
  }, [assignedCoach, isAssigned]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setCurrentUser({ ...user, profile });
    }
  };

  const checkCoachAssignment = async () => {
    if (!currentUser) return;
    
    setCheckingAssignment(true);
    const { data: assignment } = await supabase
      .from('coach_assignments')
      .select('coach_id')
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
      .single();
    
    if (assignment) {
      // Get coach profile
      const { data: coachProfile } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('id', assignment.coach_id)
        .single();
      
      if (coachProfile) {
        setAssignedCoach(coachProfile);
        setIsAssigned(true);
      }
    } else {
      setIsAssigned(false);
    }
    setCheckingAssignment(false);
  };

  const loadMessages = async () => {
    if (!currentUser || !assignedCoach) return;
    
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender:user_profiles!messages_sender_id_fkey(full_name)
      `)
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${assignedCoach.id}),and(sender_id.eq.${assignedCoach.id},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data);
    }
  };

  const subscribeToMessages = () => {
    if (!currentUser || !assignedCoach) return;
    
    const subscription = supabase
      .channel('user_messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, 
        (payload) => {
          const newMsg = payload.new as any;
          if ((newMsg.sender_id === currentUser.id && newMsg.receiver_id === assignedCoach.id) ||
              (newMsg.sender_id === assignedCoach.id && newMsg.receiver_id === currentUser.id)) {
            loadMessages();
          }
        }
      )
      .subscribe();
    
    return () => subscription.unsubscribe();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !assignedCoach) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        content: newMessage,
        sender_id: currentUser.id,
        receiver_id: assignedCoach.id,
        is_read: false
      });
    
    if (error) {
      toast({ title: 'Error sending message', variant: 'destructive' });
    } else {
      setNewMessage('');
    }
    setLoading(false);
  };

  if (checkingAssignment) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Checking coach assignment...</p>
        </div>
      </Card>
    );
  }

  if (!isAssigned) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <div className="text-center">
          <UserX className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Coach Assigned</h3>
          <p className="text-gray-500">You need to be assigned to a coach to access chat functionality.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat with {assignedCoach.full_name || 'Your Coach'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    msg.sender_id === currentUser?.id
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
      </CardContent>
    </Card>
  );
};