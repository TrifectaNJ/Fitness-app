import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Users, X, Bell, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import '@/styles/pro-chat.css';

interface Message {
  id: string;
  message: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
}

interface AssignedUser {
  user_id: string;
  user_name: string;
  user_email: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  isOnline?: boolean;
}

export const CoachInboxPanel = () => {
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [currentCoach, setCurrentCoach] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    initializeCoach();
  }, []);

  useEffect(() => {
    if (currentCoach) {
      loadUsers();
    }
  }, [currentCoach]);

  useEffect(() => {
    if (selectedUser && currentCoach) {
      loadMessages();
    }
  }, [selectedUser, currentCoach]);

  const initializeCoach = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentCoach({ id: user.id, email: user.email });
    } catch (error) {
      console.error('Init error:', error);
    }
  };

  const loadUsers = async () => {
    if (!currentCoach) return;
    
    try {
      const { data: assignments } = await supabase
        .from('coach_assignments')
        .select('user_id')
        .eq('coach_id', currentCoach.id)
        .eq('is_active', true);

      const { data: messageUsers } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', currentCoach.id)
        .neq('sender_id', currentCoach.id);

      const assignedUserIds = assignments?.map(a => a.user_id) || [];
      const messageSenderIds = messageUsers ? [...new Set(messageUsers.map(m => m.sender_id))] : [];
      const allUserIds = [...new Set([...assignedUserIds, ...messageSenderIds])];
      
      if (allUserIds.length === 0) {
        setAssignedUsers([]);
        return;
      }

      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, email')
        .in('id', allUserIds);

      const userList: AssignedUser[] = [];
      
      for (const profile of userProfiles || []) {
        const { data: latestMessage } = await supabase
          .from('messages')
          .select('message, created_at')
          .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${currentCoach.id}),and(sender_id.eq.${currentCoach.id},receiver_id.eq.${profile.id})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', profile.id)
          .eq('receiver_id', currentCoach.id)
          .eq('is_read', false);

        const displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown User';
        
        userList.push({
          user_id: profile.id,
          user_name: displayName,
          user_email: profile.email || '',
          last_message: latestMessage?.message || 'No messages yet',
          last_message_time: latestMessage?.created_at || new Date().toISOString(),
          unread_count: unreadCount || 0,
          isOnline: Math.random() > 0.5 // Mock online status
        });
      }

      userList.sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());
      setAssignedUsers(userList);
    } catch (error) {
      console.error('Load users error:', error);
    }
  };

  const loadMessages = async () => {
    if (!currentCoach || !selectedUser) return;
    
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentCoach.id},receiver_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},receiver_id.eq.${currentCoach.id})`)
        .order('created_at', { ascending: true });
      
      setMessages(data || []);
      markAsRead();
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };

  const markAsRead = async () => {
    if (!currentCoach || !selectedUser) return;
    
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', selectedUser)
        .eq('receiver_id', currentCoach.id);
        
      loadUsers();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentCoach || !selectedUser) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          message: newMessage,
          sender_id: currentCoach.id,
          receiver_id: selectedUser,
          is_read: false
        });
      
      if (error) {
        toast({ title: 'Error sending message', variant: 'destructive' });
        return;
      }
      
      setNewMessage('');
      loadMessages();
      loadUsers();
    } catch (error) {
      console.error('Send error:', error);
    }
    setLoading(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredUsers = assignedUsers.filter(user =>
    user.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.user_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUserData = assignedUsers.find(u => u.user_id === selectedUser);

  return (
    <div className="pro-chat">
      <div className="pro-chat-left-panel">
        <div className="pro-chat-header">
          <div className="pro-chat-title">
            <Users className="h-5 w-5 text-blue-500" />
            My Users
            <button className="ml-auto">
              <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
            </button>
          </div>
        </div>
        
        <div className="pro-chat-search">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pro-chat-search-input pl-10"
            />
          </div>
        </div>

        <div className="pro-chat-user-list">
          {filteredUsers.map((user) => (
            <div
              key={user.user_id}
              onClick={() => setSelectedUser(user.user_id)}
              className={`pro-chat-user-item ${selectedUser === user.user_id ? 'selected' : ''}`}
            >
              <div className="pro-chat-avatar">
                {getInitials(user.user_name)}
              </div>
              {user.isOnline ? (
                <div className="pro-chat-online-dot" />
              ) : (
                <div className="pro-chat-offline-dot" />
              )}
              <div className="pro-chat-user-info">
                <div className="pro-chat-user-name">{user.user_name}</div>
                <div className="pro-chat-user-email">{user.user_email}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {user.isOnline ? 'Online' : new Date(user.last_message_time).toLocaleDateString()}
                </div>
              </div>
              {user.unread_count > 0 && (
                <div className="pro-chat-unread-badge">{user.unread_count}</div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="pro-chat-right-panel">
        {selectedUserData ? (
          <>
            <div className="pro-chat-conversation-header">
              <div className="pro-chat-conversation-info">
                <div className="pro-chat-avatar">
                  {getInitials(selectedUserData.user_name)}
                </div>
                <div>
                  <div className="pro-chat-conversation-title">
                    Chat with {selectedUserData.user_name}
                  </div>
                  <div className="pro-chat-conversation-status">
                    {selectedUserData.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>
              <div className="pro-chat-conversation-actions">
                <button className="pro-chat-icon-button">
                  <Bell className="h-5 w-5 text-gray-500" />
                </button>
                <button className="pro-chat-icon-button">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="pro-chat-messages-container">
              {messages.length === 0 ? (
                <div className="pro-chat-empty-state">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm">No messages yet. Start a conversation!</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => {
                    const isOwn = msg.sender_id === currentCoach?.id;
                    const showDate = index === 0 || 
                      new Date(messages[index - 1].created_at).toDateString() !== 
                      new Date(msg.created_at).toDateString();
                    
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="pro-chat-date-divider">
                            <div className="pro-chat-date-line" />
                            <div className="pro-chat-date-text">
                              {new Date(msg.created_at).toLocaleDateString()}
                            </div>
                            <div className="pro-chat-date-line" />
                          </div>
                        )}
                        <div className={`pro-chat-message ${isOwn ? 'own' : 'other'}`}>
                          {!isOwn && (
                            <div className="pro-chat-avatar">
                              {getInitials(selectedUserData.user_name)}
                            </div>
                          )}
                          <div className="pro-chat-message-bubble">
                            <div className="pro-chat-message-text">{msg.message}</div>
                            <div className="pro-chat-message-time">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            
            <div className="pro-chat-composer">
              <div className="pro-chat-input-wrapper">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="pro-chat-input"
                />
                <button 
                  onClick={sendMessage} 
                  disabled={loading || !newMessage.trim()}
                  className="pro-chat-send-button"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="pro-chat-empty-state">
            <p>Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};