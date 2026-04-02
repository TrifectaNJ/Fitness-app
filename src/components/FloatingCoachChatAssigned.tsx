import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Minus, X, UserX, Clock } from 'lucide-react';
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

interface FloatingCoachChatAssignedProps {
  onMinimize: () => void;
  onClose: () => void;
}

export const FloatingCoachChatAssigned: React.FC<FloatingCoachChatAssignedProps> = ({ onMinimize, onClose }) => {
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
    const { data: assignment, error } = await supabase
      .from('coach_assignments')
      .select(`
        *,
        coach:user_profiles!coach_assignments_coach_id_fkey(id, full_name, email)
      `)
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
      .single();
    
    if (assignment && assignment.coach) {
      setAssignedCoach(assignment.coach);
      setIsAssigned(true);
    } else {
      setIsAssigned(false);
    }
    setCheckingAssignment(false);
  };

  const loadMessages = async () => {
    if (!currentUser || !assignedCoach) return;
    
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:user_profiles!messages_sender_id_fkey(full_name, email)
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
      .channel('floating_user_messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `or(and(sender_id.eq.${currentUser.id},receiver_id.eq.${assignedCoach.id}),and(sender_id.eq.${assignedCoach.id},receiver_id.eq.${currentUser.id}))`
        }, 
        () => loadMessages()
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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (checkingAssignment) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Checking coach assignment...</p>
        </div>
      </div>
    );
  }

  if (!isAssigned) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-6">
          <UserX className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Coach Assigned</h3>
          <p className="text-gray-500 text-sm">You need to be assigned to a coach to access chat functionality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-gray-900 font-semibold text-sm">Chat with {assignedCoach.full_name || 'Your Coach'}</h3>
            <p className="text-xs text-gray-600">Get personalized guidance</p>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="bg-white border-green-200 text-xs">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
              Online
            </Badge>
            <Button variant="ghost" size="sm" onClick={onMinimize} className="h-6 w-6 p-0">
              <Minus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 px-4 py-2">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-6 h-6 text-blue-500" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1 text-sm">Start a conversation!</h4>
                <p className="text-xs">Your coach is here to help.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
                      message.sender_id === currentUser?.id
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-xs leading-relaxed">{message.content}</p>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${
                      message.sender_id === currentUser?.id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <Clock className="w-2.5 h-2.5" />
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="border-t border-gray-100 p-3 bg-gray-50/50">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 bg-white border-gray-200 text-sm h-8"
            />
            <Button 
              onClick={sendMessage} 
              disabled={loading || !newMessage.trim()}
              size="sm"
              className="px-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white h-8"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};