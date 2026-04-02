import React, { useState, useEffect, useRef } from 'react';
import { X, Bell, MessageCircle, Send, Search, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { MessageStatusIndicator } from './MessageStatusIndicator';
import { TypingIndicator } from './TypingIndicator';
import '@/styles/pro-chat.css';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
  message_type: 'user' | 'coach' | 'ai';
  delivered_at?: string | null;
  read_at?: string | null;
}


interface Coach {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  lastSeen?: string;
  unreadCount?: number;
}

export const ChatTabs: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [showCoachList, setShowCoachList] = useState(true);
  const [coachTyping, setCoachTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAppContext();

  const getMessageStatus = (msg: Message): 'sent' | 'delivered' | 'read' => {
    if (msg.sender_id !== currentUser?.id) return 'read';
    if (msg.read_at) return 'read';
    if (msg.delivered_at) return 'delivered';
    return 'sent';
  };


  const scrollToBottom = () => {
    // Direct scroll on the container for better mobile support
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
    
    // Also use scrollIntoView as backup
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  };


  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(scrollToBottom, 100);
    }
  }, [messages]);


  useEffect(() => {
    if (currentUser?.id) {
      fetchCoaches();
      fetchMessages();
    }
  }, [currentUser?.id]);

  const fetchCoaches = async () => {
    const mockCoaches: Coach[] = [
      {
        id: '1',
        name: 'John Nicole',
        email: 'abadnicole159@gmail.com',
        isOnline: true,
        lastSeen: 'Just now',
        unreadCount: 0
      }
    ];
    setCoaches(mockCoaches);
    if (mockCoaches.length > 0) {
      setSelectedCoach(mockCoaches[0]);
    }
  };

  const fetchMessages = async () => {
    if (!currentUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser?.id || loading) return;

    setLoading(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const userMessage = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        sender_id: currentUser.id,
        sender_name: currentUser.name || 'You',
        created_at: new Date().toISOString(),
        message_type: 'user' as const
      };

      setMessages(prev => [...prev, userMessage]);

      await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: selectedCoach?.id || '1',
        message: messageContent
      });

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleCoachSelect = (coach: Coach) => {
    setSelectedCoach(coach);
    setShowCoachList(false);
  };

  const handleBackToList = () => {
    setShowCoachList(true);
  };

  const filteredCoaches = coaches.filter(coach =>
    coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coach.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pro-chat">
      <div className={`pro-chat-left-panel ${!showCoachList ? 'mobile-hidden' : ''}`}>
        <div className="pro-chat-header">
          <div className="pro-chat-title">
            <MessageCircle className="h-5 w-5 text-orange-500" />
            My Coaches
          </div>
        </div>
        
        <div className="pro-chat-search">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search coaches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pro-chat-search-input pl-10"
            />
          </div>
        </div>

        <div className="pro-chat-user-list">
          {filteredCoaches.map(coach => (
            <div
              key={coach.id}
              onClick={() => handleCoachSelect(coach)}
              className={`pro-chat-user-item ${selectedCoach?.id === coach.id ? 'selected' : ''}`}
            >
              <div className="pro-chat-avatar">
                {getInitials(coach.name)}
              </div>
              {coach.isOnline && <div className="pro-chat-online-dot" />}
              <div className="pro-chat-user-info">
                <div className="pro-chat-user-name">{coach.name}</div>
                <div className="pro-chat-user-email">{coach.email}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {coach.isOnline ? 'Online' : coach.lastSeen || 'Offline'}
                </div>
              </div>
              {coach.unreadCount && coach.unreadCount > 0 && (
                <div className="pro-chat-unread-badge">{coach.unreadCount}</div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className={`pro-chat-right-panel ${showCoachList ? 'mobile-hidden' : ''}`}>
        {selectedCoach ? (
          <>
            <div className="pro-chat-conversation-header">
              <div className="pro-chat-conversation-info">
                <button onClick={handleBackToList} className="pro-chat-back-button">
                  <ChevronLeft className="h-5 w-5 text-gray-700" />
                </button>
                <div>
                  <div className="pro-chat-conversation-title">
                    Chat with {selectedCoach.name}
                  </div>
                </div>
              </div>
            </div>
            
            <div ref={messagesContainerRef} className="pro-chat-messages-container">
              {messages.length === 0 ? (
                <div className="pro-chat-empty-state">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto text-gray-700 mb-3" />
                    <p className="text-sm text-gray-400">No messages yet. Start a conversation!</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-3">
                  {messages.map((message, index) => {
                    const isOwn = message.sender_id === currentUser?.id;
                    const showDate = index === 0 || 
                      new Date(messages[index - 1].created_at).toDateString() !== 
                      new Date(message.created_at).toDateString();
                    
                    return (
                      <React.Fragment key={message.id}>
                        {showDate && (
                          <div className="pro-chat-date-divider">
                            <div className="pro-chat-date-line" />
                            <div className="pro-chat-date-text">
                              {new Date(message.created_at).toLocaleDateString()}
                            </div>
                            <div className="pro-chat-date-line" />
                          </div>
                        )}
                        <div className={`pro-chat-message ${isOwn ? 'own' : 'other'}`}>
                          <div className="pro-chat-message-bubble">
                            <div className="pro-chat-message-text">{message.content}</div>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <div className="pro-chat-message-time">
                                {formatTime(message.created_at)}
                              </div>
                              {isOwn && (
                                <MessageStatusIndicator status={getMessageStatus(message)} />
                              )}
                            </div>
                          </div>
                        </div>

                      </React.Fragment>
                    );
                  })}
                  {coachTyping && <TypingIndicator userName={selectedCoach.name} />}
                  <div ref={messagesEndRef} className="h-1" />

                </div>
              )}
            </div>

            
            <div className="pro-chat-composer">
              <div className="pro-chat-input-wrapper">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="pro-chat-input"
                />
                <button 
                  onClick={sendMessage} 
                  disabled={loading || !newMessage.trim()}
                  className="pro-chat-send-button"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="pro-chat-empty-state">
            <p>Select a coach to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};
