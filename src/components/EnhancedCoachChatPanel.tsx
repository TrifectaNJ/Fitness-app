import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, MessageCircle, Users, Check, CheckCheck, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EnhancedAssignedUsersList } from './EnhancedAssignedUsersList';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read_status: boolean;
  delivered_status: boolean;
  message_status: 'sending' | 'sent' | 'delivered' | 'read';
}

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: string;
}

interface CoachChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; name: string } | null;
}

const EnhancedCoachChatPanel: React.FC<CoachChatPanelProps> = ({ isOpen, onClose, currentUser }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userTyping, setUserTyping] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (selectedUser && currentUser) {
      fetchMessages();
      setupRealtimeSubscription();
      markMessagesAsRead();
    }
  }, [selectedUser, currentUser]);

  const setupRealtimeSubscription = () => {
    if (!selectedUser || !currentUser) return;

    // Messages subscription
    const messagesChannel = supabase
      .channel(`messages-${currentUser.id}-${selectedUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id}))`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message;
            setMessages(prev => [...prev, { ...newMsg, message_status: 'delivered' }]);
            scrollToBottom();
            if (newMsg.sender_id !== currentUser.id) {
              markMessagesAsRead();
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            ));
          }
        }
      )
      .subscribe();

    // Typing indicators subscription
    const typingChannel = supabase
      .channel(`typing-${currentUser.id}-${selectedUser.id}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== currentUser.id) {
          setUserTyping(payload.user_id);
          setTimeout(() => setUserTyping(null), 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
    };
  };

  const fetchMessages = async () => {
    if (!currentUser || !selectedUser) return;
    
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });
    
    if (data) {
      const messagesWithStatus = data.map(msg => ({
        ...msg,
        message_status: msg.read_status ? 'read' : (msg.delivered_status ? 'delivered' : 'sent')
      }));
      setMessages(messagesWithStatus);
      scrollToBottom();
    }
  };

  const markMessagesAsRead = async () => {
    if (!currentUser || !selectedUser) return;
    
    await supabase
      .from('messages')
      .update({ read_status: true })
      .eq('sender_id', selectedUser.id)
      .eq('receiver_id', currentUser.id)
      .eq('read_status', false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedUser || loading) return;
    
    const tempId = Date.now().toString();
    const tempMessage: Message = {
      id: tempId,
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
      read_status: false,
      delivered_status: false,
      message_status: 'sending'
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setLoading(true);
    scrollToBottom();

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        message: tempMessage.message,
        delivered_status: true
      })
      .select()
      .single();
    
    if (!error && data) {
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...data, message_status: 'sent' } : msg
      ));
    } else {
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
    setLoading(false);
  };

  const handleTyping = () => {
    if (!selectedUser || !currentUser) return;
    
    setIsTyping(true);
    
    // Broadcast typing indicator
    supabase.channel(`typing-${currentUser.id}-${selectedUser.id}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: currentUser.id }
      });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const getUserDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    return user.email?.split('@')[0] || 'User';
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style={{ paddingTop: '40px' }}>

      <div className="bg-white rounded-lg w-full max-w-5xl h-[600px] flex shadow-2xl">
        {/* User List */}
        <div className="w-1/3 border-r bg-gray-50">
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">My Users</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {currentUser && (
            <EnhancedAssignedUsersList
              coachId={currentUser.id}
              onUserSelect={setSelectedUser}
              selectedUserId={selectedUser?.id}
            />
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800">
                    Chat with {getUserDisplayName(selectedUser)}
                  </h4>
                  <div className="text-xs text-gray-500">
                    {userTyping && userTyping === selectedUser.id && (
                      <span className="italic">User is typing...</span>
                    )}
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-4 bg-gray-50">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.sender_id === currentUser?.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <div className={`flex items-center justify-between mt-1 ${
                          msg.sender_id === currentUser?.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">
                            {new Date(msg.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {msg.sender_id === currentUser?.id && (
                            <div className="ml-2">
                              {getMessageStatusIcon(msg.message_status)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>
              
              <div className="p-4 border-t bg-white">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={loading || !newMessage.trim()}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Select a user to start chatting</p>
                <p className="text-sm mt-2">Choose from your assigned users on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedCoachChatPanel;