import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Search, Bell, BellOff, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  last_seen?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  userRole?: string;
}

export const ProfessionalChatInterface: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUserId,
  userRole
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && currentUserId) {
      loadAssignedUsers();
    }
  }, [isOpen, currentUserId, userRole]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadAssignedUsers = async () => {
    if (!currentUserId) return;
    setLoading(true);
    
    try {
      if (userRole === 'coach' || userRole === 'admin' || userRole === 'super_admin') {
        const { data } = await supabase
          .from('user_coach_assignments')
          .select('user_id')
          .eq('coach_id', currentUserId);
        
        if (data?.length) {
          const userIds = data.map(d => d.user_id);
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('*')
            .in('id', userIds);
          setUsers(profiles || []);
        }
      } else {
        const { data } = await supabase
          .from('user_coach_assignments')
          .select('coach_id')
          .eq('user_id', currentUserId);
        
        if (data?.length) {
          const coachIds = data.map(d => d.coach_id);
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('*')
            .in('id', coachIds);
          setUsers(profiles || []);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    if (!currentUserId) return;
    
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });
    
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUserId) return;
    
    const message = {
      content: newMessage,
      sender_id: currentUserId,
      receiver_id: selectedUser.id,
      created_at: new Date().toISOString()
    };
    
    await supabase.from('messages').insert(message);
    setMessages([...messages, { ...message, id: Date.now().toString() }]);
    setNewMessage('');
  };

  const filteredUsers = users.filter(u => {
    const name = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const getUserName = (user: User) => 
    user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email.split('@')[0];

  const getInitials = (user: User) => {
    if (user.first_name) {
      return `${user.first_name[0]}${user.last_name?.[0] || ''}`.toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end" style={{ paddingTop: '40px' }}>

      <div className="flex h-full bg-white dark:bg-gray-900 shadow-2xl" style={{ width: '900px' }}>
        {/* Left Panel - User List */}
        <div className="w-[340px] border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {userRole === 'user' ? '👥 My Coaches' : '👤 My Users'}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  {searchQuery ? '🔍 No results found' : `📭 No assigned ${userRole === 'user' ? 'coaches' : 'users'}`}
                </div>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                      selectedUser?.id === user.id 
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-400 dark:border-blue-500 shadow-md' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12 ring-2 ring-white dark:ring-gray-800 shadow-md">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white truncate text-sm">{getUserName(user)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                      </div>
                      {user.unread_count && user.unread_count > 0 && (
                        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2.5 py-1 font-bold shadow-lg">
                          {user.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        {/* Right Panel - Chat */}
        {selectedUser ? (
          <div className="flex-1 flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 ring-2 ring-gray-200 dark:ring-gray-700">
                    <AvatarImage src={selectedUser.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {getInitials(selectedUser)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-lg">Chat with {getUserName(selectedUser)}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Active now</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMuted(!muted)}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  >
                    {muted ? <BellOff className="w-5 h-5 text-gray-500" /> : <Bell className="w-5 h-5 text-gray-500" />}
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-sm">No messages yet. Start a conversation!</div>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={msg.id}>
                      {idx === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[idx-1].created_at).toDateString() ? (
                        <div className="flex items-center gap-3 my-6">
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {format(new Date(msg.created_at), 'EEEE, MMMM d')}
                          </span>
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                      ) : null}
                      <div className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'} mb-3`}>
                        <div className={`group flex gap-2 max-w-[75%] ${msg.sender_id === currentUserId ? 'flex-row-reverse' : ''}`}>
                          <div className={`px-4 py-3 shadow-sm ${
                            msg.sender_id === currentUserId
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-md'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md'
                          }`}>
                            <div className="text-sm leading-relaxed">{msg.content}</div>
                          </div>
                        </div>
                      </div>
                      <div className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'} -mt-1 mb-2`}>
                        <span className="text-xs text-gray-400 dark:text-gray-500 px-2">
                          {format(new Date(msg.created_at), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex gap-3 max-w-4xl mx-auto">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="flex-1 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-full px-5 py-2.5 focus:ring-2 focus:ring-blue-500"
                />
                <Button 
                  onClick={sendMessage} 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full px-6 shadow-lg"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select a conversation</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Choose someone from the list to start chatting</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};