import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, UserX, X, Minimize2, Maximize2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
  sender_name?: string;
}

interface RealtimeUserCoachChatProps {
  onClose?: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

export const RealtimeUserCoachChat = ({ onClose, onMinimize, isMinimized }: RealtimeUserCoachChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignedCoach, setAssignedCoach] = useState<any>(null);
  const [isAssigned, setIsAssigned] = useState(false);
  const [checkingAssignment, setCheckingAssignment] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    getCurrentUser();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      checkCoachAssignment();
    }
  }, [currentUser]);

  useEffect(() => {
    if (assignedCoach && isAssigned) {
      loadMessages();
      const channel = subscribeToMessages();
      channelRef.current = channel;
    }
  }, [assignedCoach, isAssigned]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
      .single();
    
    if (assignment) {
      const { data: coachProfile } = await supabase
        .from('user_profiles')
        .select('id, full_name, first_name, last_name, email')
        .eq('id', assignment.coach_id)
        .single();
      
      if (coachProfile) {
        const coachName = coachProfile.full_name || 
          `${coachProfile.first_name || ''} ${coachProfile.last_name || ''}`.trim() || 
          'Your Coach';
        setAssignedCoach({ ...coachProfile, display_name: coachName });
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
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${assignedCoach.id}),and(sender_id.eq.${assignedCoach.id},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });
    
    if (data) {
      const formattedMessages = data.map(msg => ({
        ...msg,
        content: msg.message || msg.content // Handle both field names
      }));
      setMessages(formattedMessages);
      markMessagesAsRead();
    }
  };

  const markMessagesAsRead = async () => {
    if (!currentUser || !assignedCoach) return;
    
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', assignedCoach.id)
      .eq('receiver_id', currentUser.id)
      .eq('is_read', false);
  };

  const subscribeToMessages = () => {
    if (!currentUser || !assignedCoach) return null;
    
    const channel = supabase
      .channel(`chat-${currentUser.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `or(and(sender_id.eq.${currentUser.id},receiver_id.eq.${assignedCoach.id}),and(sender_id.eq.${assignedCoach.id},receiver_id.eq.${currentUser.id}))`
        }, 
        (payload) => {
          const newMsg = payload.new as any;
          const formattedMsg = {
            ...newMsg,
            content: newMsg.message || newMsg.content
          };
          setMessages(prev => [...prev, formattedMsg]);
          
          if (newMsg.sender_id === assignedCoach.id) {
            markMessagesAsRead();
          }
        }
      )
      .subscribe();
    
    return channel;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !assignedCoach) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        message: newMessage, // Use 'message' field to match database
        content: newMessage, // Also include 'content' for compatibility
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

  if (isMinimized) {
    return (
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={onMinimize}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-sm">Chat with Coach</span>
        </div>
        <div className="flex items-center gap-2">
          <Maximize2 className="h-3 w-3" />
          {onClose && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onClose(); }}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (checkingAssignment) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Checking coach assignment...</p>
        </div>
      </Card>
    );
  }

  if (!isAssigned) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <UserX className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Coach Assigned</h3>
          <p className="text-gray-500">You need to be assigned to a coach to access chat.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                {assignedCoach.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Chat with {assignedCoach.display_name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onMinimize && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onMinimize}
                className="hover:bg-white/50 dark:hover:bg-gray-800/50"
              >
                <Minimize2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            )}
            {onClose && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="hover:bg-white/50 dark:hover:bg-gray-800/50"
              >
                <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6 py-4 bg-gray-50 dark:bg-gray-950">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No messages yet. Start a conversation!</p>
            </div>
          )}
          
          {messages.map((msg, index) => {
            const isOwn = msg.sender_id === currentUser?.id;
            const showDate = index === 0 || 
              new Date(msg.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString();
            
            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`group flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {assignedCoach.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div
                        className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                          isOwn
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isOwn ? 'text-right' : 'text-left ml-10'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-lg">
        <div className="flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={loading}
            className="flex-1 rounded-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
          <Button 
            onClick={sendMessage} 
            disabled={loading || !newMessage.trim()}
            className="rounded-full w-10 h-10 p-0 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};