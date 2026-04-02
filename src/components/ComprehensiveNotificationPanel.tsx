import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell, 
  Check, 
  X, 
  Search, 
  Filter, 
  Settings, 
  MessageSquare, 
  AtSign, 
  Trophy, 
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { useNotificationSystem, NotificationData } from '@/hooks/useNotificationSystem';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface ComprehensiveNotificationPanelProps {
  userId: string;
  className?: string;
}

export const ComprehensiveNotificationPanel: React.FC<ComprehensiveNotificationPanelProps> = ({
  userId,
  className = ""
}) => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    loading 
  } = useNotificationSystem(userId);
  
  const [showPreferences, setShowPreferences] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchQuery || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || notification.type === filterType;
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'read' && notification.read) ||
      (filterStatus === 'unread' && !notification.read);

    return matchesSearch && matchesType && matchesStatus;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-purple-500" />;
      case 'goal_achievement':
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'system':
        return <AlertCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (notification: NotificationData) => {
    if (notification.delivery_status === 'read') {
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    } else if (notification.delivery_status === 'delivered') {
      return <Check className="w-3 h-3 text-blue-500" />;
    } else if (notification.delivery_status === 'failed') {
      return <X className="w-3 h-3 text-red-500" />;
    } else {
      return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'normal':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'low':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading notifications...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPreferences(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={markAllAsRead}
                >
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs defaultValue="all" className="w-full">
            <div className="px-6 pb-4 space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread
                  {unreadCount > 0 && (
                    <Badge className="ml-1 bg-red-500 text-white text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>

              {/* Search and Filters */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <Filter className="w-4 h-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="message">Messages</SelectItem>
                    <SelectItem value="mention">Mentions</SelectItem>
                    <SelectItem value="goal_achievement">Goals</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="all" className="mt-0">
              <NotificationList 
                notifications={filteredNotifications}
                onMarkAsRead={markAsRead}
                getNotificationIcon={getNotificationIcon}
                getStatusIcon={getStatusIcon}
                getPriorityColor={getPriorityColor}
              />
            </TabsContent>

            <TabsContent value="unread" className="mt-0">
              <NotificationList 
                notifications={filteredNotifications.filter(n => !n.read)}
                onMarkAsRead={markAsRead}
                getNotificationIcon={getNotificationIcon}
                getStatusIcon={getStatusIcon}
                getPriorityColor={getPriorityColor}
              />
            </TabsContent>

            <TabsContent value="messages" className="mt-0">
              <NotificationList 
                notifications={filteredNotifications.filter(n => n.type === 'message' || n.type === 'mention')}
                onMarkAsRead={markAsRead}
                getNotificationIcon={getNotificationIcon}
                getStatusIcon={getStatusIcon}
                getPriorityColor={getPriorityColor}
              />
            </TabsContent>

            <TabsContent value="system" className="mt-0">
              <NotificationList 
                notifications={filteredNotifications.filter(n => n.type === 'system' || n.type === 'goal_achievement')}
                onMarkAsRead={markAsRead}
                getNotificationIcon={getNotificationIcon}
                getStatusIcon={getStatusIcon}
                getPriorityColor={getPriorityColor}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <NotificationPreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        userId={userId}
      />
    </>
  );
};

interface NotificationListProps {
  notifications: NotificationData[];
  onMarkAsRead: (id: string) => void;
  getNotificationIcon: (type: string) => React.ReactNode;
  getStatusIcon: (notification: NotificationData) => React.ReactNode;
  getPriorityColor: (priority: string) => string;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  getNotificationIcon,
  getStatusIcon,
  getPriorityColor
}) => {
  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p>No notifications found</p>
        <p className="text-sm">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
            !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(notification.priority)}`}
                    >
                      {notification.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {getStatusIcon(notification)}
                    <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!notification.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onMarkAsRead(notification.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                        <Check className="w-4 h-4 mr-2" />
                        Mark as Read
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};