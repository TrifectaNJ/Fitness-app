import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, MessageCircle, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EnhancedAssignedUsersList } from './EnhancedAssignedUsersList';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read_status: boolean;
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

const CoachChatPanel: React.FC<CoachChatPanelProps> = ({ isOpen, onClose, currentUser }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      
      // Set up real-time subscription for new messages
      const channel = supabase
        .channel(`messages-${currentUser?.id}-${selectedUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `or(and(sender_id.eq.${currentUser?.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser?.id}))`
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedUser, currentUser]);

  const fetchMessages = async () => {
    if (!currentUser || !selectedUser) return;
    
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data);
      markMessagesAsRead();
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
    
    setLoading(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        message: newMessage.trim()
      });
    
    if (!error) {
      setNewMessage('');
      fetchMessages();
    }
    setLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style={{ paddingTop: '40px' }}>

      <div className="bg-white rounded-lg w-full max-w-4xl h-96 flex">
        {/* User List */}
        <div className="w-1/3 border-r">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">My Users</h3>
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
              <div className="p-4 border-b">
                <h4 className="font-semibold">Chat with {getUserDisplayName(selectedUser)}</h4>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-3 ${
                      msg.sender_id === currentUser?.id ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-block p-2 rounded-lg max-w-xs ${
                        msg.sender_id === currentUser?.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </ScrollArea>
              
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={loading}
                  />
                  <Button onClick={sendMessage} disabled={loading}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a user to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachChatPanel;