import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, MessageSquare, Search, Archive, Pin, Settings } from 'lucide-react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { ComprehensiveNotificationPanel } from './ComprehensiveNotificationPanel';
import { MessageSearchPanel } from './MessageSearchPanel';
import { MessageArchivePanel } from './MessageArchivePanel';
import { MessageExportPanel } from './MessageExportPanel';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';
import CombinedChatPanel from './CombinedChatPanel';
import { supabase } from '@/lib/supabase';

interface EnhancedChatPanelProps {
  userId: string;
  userRole?: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const EnhancedChatPanel: React.FC<EnhancedChatPanelProps> = ({
  userId,
  userRole = 'user',
  isOpen,
  onClose,
  className = ""
}) => {
  const { unreadCount } = useNotificationSystem(userId);
  const [activeTab, setActiveTab] = useState('chat');
  const [showPreferences, setShowPreferences] = useState(false);

  // Send notification when new message is received
  const sendMessageNotification = async (recipientId: string, senderName: string, messageContent: string) => {
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          user_id: recipientId,
          type: 'message',
          title: `New message from ${senderName}`,
          message: messageContent.length > 100 
            ? messageContent.substring(0, 100) + '...' 
            : messageContent,
          data: {
            sender_id: userId,
            sender_name: senderName,
            message_preview: messageContent.substring(0, 50)
          },
          priority: 'normal'
        }
      });
    } catch (error) {
      console.error('Error sending message notification:', error);
    }
  };

  // Send mention notification
  const sendMentionNotification = async (mentionedUserId: string, senderName: string, messageContent: string) => {
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          user_id: mentionedUserId,
          type: 'mention',
          title: `${senderName} mentioned you`,
          message: messageContent.length > 100 
            ? messageContent.substring(0, 100) + '...' 
            : messageContent,
          data: {
            sender_id: userId,
            sender_name: senderName,
            message_content: messageContent
          },
          priority: 'high'
        }
      });
    } catch (error) {
      console.error('Error sending mention notification:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${className}`} onClick={onClose}>
        <div 
          className="fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="h-full rounded-none border-0">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Communication Center
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
                  <Button size="sm" variant="outline" onClick={onClose}>
                    ✕
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 h-[calc(100%-80px)]">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <div className="border-b px-6 py-2">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="chat">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                      <Bell className="w-4 h-4 mr-1" />
                      Notifications
                      {unreadCount > 0 && (
                        <Badge className="ml-1 bg-red-500 text-white text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="search">
                      <Search className="w-4 h-4 mr-1" />
                      Search
                    </TabsTrigger>
                    <TabsTrigger value="archive">
                      <Archive className="w-4 h-4 mr-1" />
                      Archive
                    </TabsTrigger>
                    <TabsTrigger value="export">
                      Export
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="chat" className="h-[calc(100%-60px)] mt-0">
                  <CombinedChatPanel
                    userId={userId}
                    userRole={userRole}
                    onSendMessage={sendMessageNotification}
                    onMention={sendMentionNotification}
                  />
                </TabsContent>

                <TabsContent value="notifications" className="h-[calc(100%-60px)] mt-0 p-6">
                  <ComprehensiveNotificationPanel userId={userId} />
                </TabsContent>

                <TabsContent value="search" className="h-[calc(100%-60px)] mt-0 p-6">
                  <MessageSearchPanel userId={userId} />
                </TabsContent>

                <TabsContent value="archive" className="h-[calc(100%-60px)] mt-0 p-6">
                  <MessageArchivePanel userId={userId} />
                </TabsContent>

                <TabsContent value="export" className="h-[calc(100%-60px)] mt-0 p-6">
                  <MessageExportPanel userId={userId} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <NotificationPreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        userId={userId}
      />
    </>
  );
};