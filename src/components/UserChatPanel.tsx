import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, MessageCircle, Users, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { EnhancedAssignedCoachesList } from './EnhancedAssignedCoachesList';
import { MessageStatusIndicator } from './MessageStatusIndicator';
import { TypingIndicator } from './TypingIndicator';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read_status: boolean;
  delivered_at?: string | null;
  read_at?: string | null;
}


interface Coach {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: string;
}

interface UserChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; name: string } | null;
}

const UserChatPanel: React.FC<UserChatPanelProps> = ({ isOpen, onClose, currentUser }) => {
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [coachTyping, setCoachTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (selectedCoach && currentUser) {
      fetchMessages();
      
      // Subscribe to new messages
      const messagesChannel = supabase
        .channel(`messages-${currentUser.id}-${selectedCoach.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `or(and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedCoach.id}),and(sender_id.eq.${selectedCoach.id},receiver_id.eq.${currentUser.id}))`
          },
          () => fetchMessages()
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `or(and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedCoach.id}),and(sender_id.eq.${selectedCoach.id},receiver_id.eq.${currentUser.id}))`
          },
          () => fetchMessages()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [selectedCoach, currentUser]);



  const fetchMessages = async () => {
    if (!currentUser || !selectedCoach) return;
    
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedCoach.id}),and(sender_id.eq.${selectedCoach.id},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });
    
    if (data) {
      // Mark incoming messages as delivered
      const undeliveredMessages = data.filter(
        msg => msg.sender_id === selectedCoach.id && !msg.delivered_at
      );
      
      if (undeliveredMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ delivered_at: new Date().toISOString() })
          .in('id', undeliveredMessages.map(m => m.id));
      }
      
      setMessages(data);
      markMessagesAsRead();
    }
  };

  const markMessagesAsRead = async () => {
    if (!currentUser || !selectedCoach) return;
    
    const unreadMessages = messages.filter(
      msg => msg.sender_id === selectedCoach.id && !msg.read_at
    );
    
    if (unreadMessages.length > 0) {
      await supabase
        .from('messages')
        .update({ 
          read_status: true,
          read_at: new Date().toISOString()
        })
        .in('id', unreadMessages.map(m => m.id));
    }
  };

  const getMessageStatus = (msg: Message): 'sent' | 'delivered' | 'read' => {
    if (msg.sender_id !== currentUser?.id) return 'read';
    if (msg.read_at) return 'read';
    if (msg.delivered_at) return 'delivered';
    return 'sent';
  };


  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedCoach || loading) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: selectedCoach.id,
        message: newMessage.trim()
      });
    
    if (!error) {
      setNewMessage('');
      await fetchMessages();
      // Ensure scroll happens after DOM update
      setTimeout(scrollToBottom, 100);
    }
    setLoading(false);
  };

  const scrollToBottom = () => {
    // Direct scroll on the container for better mobile support
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
    
    // Also use scrollIntoView as backup
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  };


  const getCoachDisplayName = (coach: Coach) => {
    if (coach.first_name && coach.last_name) {
      return `${coach.first_name} ${coach.last_name}`;
    }
    if (coach.first_name) return coach.first_name;
    return coach.email?.split('@')[0] || 'Coach';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200" style={{ paddingTop: '40px' }}>

      <div className="bg-gradient-to-b from-gray-900 to-black md:rounded-2xl w-full h-full md:h-[600px] md:max-w-5xl flex flex-col md:flex-row overflow-hidden shadow-2xl border border-orange-500/20">
        {/* Coach List */}
        <div className={`${selectedCoach ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-gradient-to-b from-gray-900 to-black border-r border-orange-500/20 flex-col`}>
          <div className="p-4 border-b border-orange-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-orange-500" />
              <h3 className="font-bold text-white text-lg">My Coaches</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-orange-500/10 h-9 w-9 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          {currentUser && (
            <EnhancedAssignedCoachesList
              userId={currentUser.id}
              onCoachSelect={setSelectedCoach}
              selectedCoachId={selectedCoach?.id}
            />
          )}
        </div>

        {/* Chat Area */}
        <div className={`${selectedCoach ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gradient-to-b from-gray-900 to-black min-h-0`}>
          {selectedCoach ? (
            <>
              <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-orange-500/20 flex items-center gap-3 flex-shrink-0">
                <Button 
                  onClick={() => setSelectedCoach(null)} 
                  variant="ghost" 
                  size="sm" 
                  className="md:hidden text-gray-400 hover:text-white hover:bg-orange-500/10 p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="h-10 w-10 border-2 border-orange-500/50">
                  <AvatarFallback className="bg-orange-500 text-white font-semibold">
                    {getCoachDisplayName(selectedCoach).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{getCoachDisplayName(selectedCoach)}</h4>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Online
                  </p>
                </div>
                <Button 
                  onClick={onClose} 
                  variant="ghost" 
                  size="sm"
                  className="hidden md:flex text-gray-400 hover:text-white hover:bg-orange-500/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div 
                className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 min-h-0" 
                ref={scrollContainerRef}
                style={{ 
                  WebkitOverflowScrolling: 'touch', 
                  scrollBehavior: 'smooth',
                  overscrollBehavior: 'contain'
                }}
              >
                <div className="flex flex-col space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-400 text-sm">No messages yet</p>
                      <p className="text-gray-600 text-xs mt-1">Start the conversation!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg ${
                              msg.sender_id === currentUser?.id
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                                : 'bg-gray-800 text-gray-100 border border-gray-700'
                            }`}
                          >
                            <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                            <div className="flex items-center justify-between gap-2 mt-1.5">
                              <p className="text-xs opacity-70">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {msg.sender_id === currentUser?.id && (
                                <MessageStatusIndicator status={getMessageStatus(msg)} />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {coachTyping && <TypingIndicator userName={getCoachDisplayName(selectedCoach)} />}
                      <div ref={messagesEndRef} className="h-1" />

                    </>
                  )}
                </div>
              </div>

              
              <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-orange-500/20 flex-shrink-0" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    disabled={loading}
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

export default UserChatPanel;
