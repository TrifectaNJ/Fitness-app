import React, { useState, useEffect, useRef } from 'react';
import { X, Search, MessageCircle, Users, Send, ArrowLeft, Check, CheckCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { useRealtimeChat } from '../hooks/useRealtimeChat';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  status?: 'online' | 'busy' | 'away' | 'offline';
  unread?: number;
  isTyping?: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read_status: boolean;
  delivered_status: boolean;
  message_status?: 'sending' | 'sent' | 'delivered' | 'read';
  read_at?: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Chat');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Use the realtime chat hook
  const { 
    messages, 
    sendMessage: sendRealtimeMessage, 
    markMessagesAsRead,
    sendTypingIndicator,
    isUserTyping,
    getUnreadCount
  } = useRealtimeChat(currentUser?.id || '', selectedUser?.id || '');

  useEffect(() => {
    if (isOpen) {
      loadCurrentUser();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    const filtered = users.map(user => {
      const name = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
      const email = user.email || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Update typing status for each user
      const updatedUser = {
        ...user,
        isTyping: isUserTyping(user.id),
        unread: getUnreadCount(user.id)
      };
      
      return matchesSearch ? updatedUser : null;
    }).filter(Boolean) as User[];
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, isUserTyping, getUnreadCount]);

  useEffect(() => {
    if (selectedUser && currentUser) {
      markMessagesAsRead();
    }
  }, [selectedUser, currentUser, markMessagesAsRead]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setCurrentUser({ ...user, profile });
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const fetchUsers = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      let usersData: User[] = [];

      // If user is a coach, fetch assigned users
      if (currentUser.profile?.role === 'coach') {
        console.log('Loading users for coach:', currentUser.id);
        
        // First get the coach assignments
        const { data: assignments, error: assignError } = await supabase
          .from('coach_assignments')
          .select('user_id, is_active')
          .eq('coach_id', currentUser.id);

        console.log('Coach assignments query result:', { assignments, error: assignError });

        if (!assignError && assignments && assignments.length > 0) {
          // Filter for active assignments
          const activeUserIds = assignments
            .filter(a => a.is_active !== false) // Include null or true
            .map(a => a.user_id);
          
          console.log(`Found ${activeUserIds.length} active user IDs:`, activeUserIds);
          
          if (activeUserIds.length > 0) {
            // Now fetch the user profiles for these IDs
            const { data: userProfiles, error: profilesError } = await supabase
              .from('user_profiles')
              .select('id, email, first_name, last_name, full_name')
              .in('id', activeUserIds)
              .order('first_name');
            
            console.log('User profiles query result:', { userProfiles, error: profilesError });
            
            if (!profilesError && userProfiles) {
              for (const profile of userProfiles) {
                // Get unread message count
                const { count } = await supabase
                  .from('messages')
                  .select('*', { count: 'exact', head: true })
                  .eq('sender_id', profile.id)
                  .eq('receiver_id', currentUser.id)
                  .eq('read_status', false);

                usersData.push({
                  id: profile.id,
                  email: profile.email,
                  first_name: profile.first_name,
                  last_name: profile.last_name,
                  full_name: profile.full_name,
                  status: 'online',
                  unread: count || 0
                });
              }
              console.log(`Successfully loaded ${usersData.length} assigned users`);
            }
          }
        }
        
        // If no assigned users found, show message but don't fallback to all users
        if (usersData.length === 0) {
          console.log('No assigned users found for this coach');
        }
      } else if (currentUser.profile?.role === 'user') {
        // For users, show their assigned coach(es)
        console.log('Loading coaches for user:', currentUser.id);
        
        const { data: assignments, error: assignError } = await supabase
          .from('coach_assignments')
          .select('coach_id, is_active')
          .eq('user_id', currentUser.id);
        
        if (!assignError && assignments && assignments.length > 0) {
          const activeCoachIds = assignments
            .filter(a => a.is_active !== false)
            .map(a => a.coach_id);
          
          if (activeCoachIds.length > 0) {
            const { data: coachProfiles, error: profilesError } = await supabase
              .from('user_profiles')
              .select('id, email, first_name, last_name, full_name')
              .in('id', activeCoachIds)
              .order('first_name');
            
            if (!profilesError && coachProfiles) {
              for (const profile of coachProfiles) {
                const { count } = await supabase
                  .from('messages')
                  .select('*', { count: 'exact', head: true })
                  .eq('sender_id', profile.id)
                  .eq('receiver_id', currentUser.id)
                  .eq('read_status', false);

                usersData.push({
                  id: profile.id,
                  email: profile.email,
                  first_name: profile.first_name,
                  last_name: profile.last_name,
                  full_name: profile.full_name,
                  status: 'online',
                  unread: count || 0
                });
              }
            }
          }
        }
      } else {
        // For other roles (admin, super_admin), show all users
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, email, first_name, last_name, full_name')
          .neq('id', currentUser.id)
          .order('first_name');
        
        if (!error && data) {
          for (const user of data) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('sender_id', user.id)
              .eq('receiver_id', currentUser.id)
              .eq('read_status', false);

            usersData.push({
              ...user,
              status: 'online',
              unread: count || 0
            });
          }
        }
      }

      // Sort by unread messages first, then alphabetically
      usersData.sort((a, b) => {
        if (a.unread! > 0 && b.unread! === 0) return -1;
        if (b.unread! > 0 && a.unread! === 0) return 1;
        const nameA = getUserDisplayName(a);
        const nameB = getUserDisplayName(b);
        return nameA.localeCompare(nameB);
      });

      console.log(`Total users loaded: ${usersData.length}`);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };
  const handleMessageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    if (e.target.value && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing indicator after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    } else if (!e.target.value) {
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;
    
    setSendingMessage(true);
    setIsTyping(false);
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    const success = await sendRealtimeMessage(newMessage.trim());
    
    if (success) {
      setNewMessage('');
    }
    
    setSendingMessage(false);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setNewMessage('');
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const getMessageStatusIcon = (status?: string) => {
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

  const formatReadTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.full_name) return user.full_name;
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email.split('@')[0];
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className={`${selectedUser ? 'w-[600px]' : 'w-80'} bg-white h-full shadow-xl transition-all duration-300`}>
        {!selectedUser ? (
          <>
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">My Users</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex border-b">
              {['Chat', 'Activity', 'Settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 px-4 text-sm font-medium ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'Chat' && (
              <div className="flex-1 flex flex-col h-[calc(100vh-120px)]">
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="bg-teal-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-between">
                  <span>
                    {currentUser?.profile?.role === 'coach' ? 'Assigned Users' : 'All Users'} 
                    ({filteredUsers.length})
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      Loading users...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">
                        {currentUser?.profile?.role === 'coach' ? 'No assigned users' : 'No users found'}
                      </p>
                      <p className="text-xs mt-2">
                        {currentUser?.profile?.role === 'coach' 
                          ? 'Users will appear here when assigned to you'
                          : 'Try adjusting your search terms'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div 
                        key={user.id} 
                        className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="relative">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {getUserDisplayName(user).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            getStatusColor(user.status || 'offline')
                          }`} />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-900">
                              {getUserDisplayName(user)}
                            </div>
                            {user.unread && user.unread > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                {user.unread}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.isTyping ? (
                              <span className="text-green-600 font-medium">typing...</span>
                            ) : user.status === 'online' ? (
                              'Click to start chatting'
                            ) : (
                              'Offline'
                            )}
                          </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'Activity' && (
              <div className="p-4 text-center text-gray-500">
                Activity feed coming soon
              </div>
            )}
            
            {activeTab === 'Settings' && (
              <div className="p-4 text-center text-gray-500">
                Chat settings coming soon
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={handleBackToUsers}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {getUserDisplayName(selectedUser)}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isUserTyping(selectedUser.id) ? (
                      <span className="text-green-600 font-medium animate-pulse">typing...</span>
                    ) : selectedUser.status === 'online' ? (
                      'Active now'
                    ) : (
                      'Offline'
                    )}
                  </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-4 bg-gray-50">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
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
                  ))
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            <div className="p-4 border-t bg-white">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={handleMessageInput}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={sendingMessage}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={sendingMessage || !newMessage.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;