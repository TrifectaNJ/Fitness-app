import { useState, useEffect, useRef } from 'react';
import { X, Send, Users, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface Coach {
  id: string;
  full_name: string;
  email: string;
  avatar?: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
}

interface MobileCoachChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileCoachChatModal: React.FC<MobileCoachChatModalProps> = ({ isOpen, onClose }) => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadCurrentUser();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentUser) {
      loadAssignedCoaches();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedCoach && currentUser) {
      loadMessages();
      subscribeToMessages();
    }
  }, [selectedCoach, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUser(user);
  };

  const loadAssignedCoaches = async () => {
    const { data } = await supabase
      .from('coach_assignments')
      .select('coach:user_profiles!coach_assignments_coach_id_fkey(id, full_name, email)')
      .eq('user_id', currentUser.id)
      .eq('is_active', true);
    
    if (data) {
      const coachList = data.map(d => d.coach).filter(Boolean);
      setCoaches(coachList);
      if (coachList.length > 0 && !selectedCoach) {
        setSelectedCoach(coachList[0]);
      }
    }
  };

  const loadMessages = async () => {
    if (!selectedCoach || !currentUser) return;
    
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedCoach.id}),and(sender_id.eq.${selectedCoach.id},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  const subscribeToMessages = () => {
    if (!currentUser || !selectedCoach) return;
    
    const subscription = supabase
      .channel(`mobile_chat_${currentUser.id}_${selectedCoach.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, 
        () => loadMessages()
      )
      .subscribe();
    
    return () => subscription.unsubscribe();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedCoach || !currentUser || loading) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        content: newMessage,
        sender_id: currentUser.id,
        receiver_id: selectedCoach.id,
        is_read: false
      });
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } else {
      setNewMessage('');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm animate-in fade-in duration-200" style={{ paddingTop: '40px' }}>

      <div className="h-full flex flex-col md:flex-row">
        {/* Coaches Sidebar */}
        <div className={`${selectedCoach ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-gradient-to-b from-gray-900 to-black border-r border-orange-500/20 flex-col`}>
          <div className="p-4 border-b border-orange-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-orange-500" />
              <h2 className="text-lg font-bold text-white">My Coaches</h2>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-orange-500/10">
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            {coaches.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No assigned coaches</p>
                <p className="text-gray-500 text-xs mt-1">Coaches will appear here when assigned to you</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {coaches.map((coach) => (
                  <button
                    key={coach.id}
                    onClick={() => setSelectedCoach(coach)}
                    className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                      selectedCoach?.id === coach.id
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg'
                        : 'hover:bg-gray-800/50'
                    }`}
                  >
                    <Avatar className="h-10 w-10 border-2 border-orange-500/30">
                      <AvatarImage src={coach.avatar} />
                      <AvatarFallback className="bg-orange-500 text-white font-semibold">
                        {coach.full_name?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-white text-sm">{coach.full_name || 'Coach'}</p>
                      <p className="text-xs text-gray-400">{coach.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={`${selectedCoach ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gradient-to-b from-gray-900 to-black`}>
          {selectedCoach ? (
            <>
              <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-orange-500/20 flex items-center gap-3">
                <Button onClick={() => setSelectedCoach(null)} variant="ghost" size="sm" className="md:hidden text-gray-400 hover:text-white hover:bg-orange-500/10 p-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="h-10 w-10 border-2 border-orange-500/50">
                  <AvatarImage src={selectedCoach.avatar} />
                  <AvatarFallback className="bg-orange-500 text-white font-semibold">
                    {selectedCoach.full_name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{selectedCoach.full_name}</h3>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Online
                  </p>
                </div>
                <Button onClick={onClose} variant="ghost" size="sm" className="hidden md:flex text-gray-400 hover:text-white hover:bg-orange-500/10">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-400 text-sm">No messages yet</p>
                      <p className="text-gray-600 text-xs mt-1">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-lg ${
                          msg.sender_id === currentUser?.id
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                            : 'bg-gray-800 text-gray-100 border border-gray-700'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-orange-500/20">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={loading || !newMessage.trim()}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <MessageCircle className="w-20 h-20 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Select a coach to start chatting</h3>
                <p className="text-gray-400 text-sm">Choose a coach from the list to begin your conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};