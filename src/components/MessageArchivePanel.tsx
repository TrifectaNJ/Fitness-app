import React, { useState, useEffect } from 'react';
import { Archive, ArchiveRestore, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface ArchivedMessage {
  id: string;
  message: string;
  created_at: string;
  archived_at: string;
  sender_id: string;
  receiver_id: string;
  sender_name?: string;
  receiver_name?: string;
}

interface MessageArchivePanelProps {
  currentUserId: string;
  onMessageRestore: (messageId: string) => void;
}

export const MessageArchivePanel: React.FC<MessageArchivePanelProps> = ({
  currentUserId,
  onMessageRestore
}) => {
  const [archivedMessages, setArchivedMessages] = useState<ArchivedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<ArchivedMessage[]>([]);

  useEffect(() => {
    fetchArchivedMessages();
  }, [currentUserId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredMessages(
        archivedMessages.filter(msg => 
          msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.receiver_name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredMessages(archivedMessages);
    }
  }, [searchQuery, archivedMessages]);

  const fetchArchivedMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id, message, created_at, archived_at, sender_id, receiver_id,
          sender:user_profiles!messages_sender_id_fkey(full_name),
          receiver:user_profiles!messages_receiver_id_fkey(full_name)
        `)
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .eq('archived', true)
        .order('archived_at', { ascending: false });

      if (error) throw error;

      const formattedMessages = data?.map(msg => ({
        ...msg,
        sender_name: msg.sender?.full_name || 'Unknown',
        receiver_name: msg.receiver?.full_name || 'Unknown'
      })) || [];

      setArchivedMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching archived messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const archiveMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          archived: true, 
          archived_at: new Date().toISOString() 
        })
        .eq('id', messageId);

      if (error) throw error;
      
      fetchArchivedMessages();
    } catch (error) {
      console.error('Error archiving message:', error);
    }
  };

  const restoreMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          archived: false, 
          archived_at: null 
        })
        .eq('id', messageId);

      if (error) throw error;
      
      setArchivedMessages(prev => prev.filter(msg => msg.id !== messageId));
      onMessageRestore(messageId);
    } catch (error) {
      console.error('Error restoring message:', error);
    }
  };

  const permanentlyDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      
      setArchivedMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const bulkRestoreMessages = async () => {
    try {
      const messageIds = filteredMessages.map(msg => msg.id);
      
      const { error } = await supabase
        .from('messages')
        .update({ 
          archived: false, 
          archived_at: null 
        })
        .in('id', messageIds);

      if (error) throw error;
      
      setArchivedMessages([]);
      messageIds.forEach(onMessageRestore);
    } catch (error) {
      console.error('Error bulk restoring messages:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading archived messages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Archive className="h-5 w-5" />
          <span>Archived Messages ({archivedMessages.length})</span>
        </h3>
        
        {filteredMessages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={bulkRestoreMessages}
            className="flex items-center space-x-1"
          >
            <ArchiveRestore className="h-4 w-4" />
            <span>Restore All</span>
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search archived messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredMessages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {archivedMessages.length === 0 
            ? 'No archived messages found.'
            : 'No messages match your search criteria.'
          }
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMessages.map(message => (
            <Card key={message.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {message.sender_id === currentUserId ? 'You' : message.sender_name}
                    </Badge>
                    <span className="text-xs text-gray-500">to</span>
                    <Badge variant="outline" className="text-xs">
                      {message.receiver_id === currentUserId ? 'You' : message.receiver_name}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2 line-clamp-3">
                    {message.message}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>
                      Sent: {format(new Date(message.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                    <span>
                      Archived: {format(new Date(message.archived_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restoreMessage(message.id)}
                    className="flex items-center space-x-1"
                  >
                    <ArchiveRestore className="h-4 w-4" />
                    <span>Restore</span>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Permanently Delete Message</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The message will be permanently deleted from the system.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => permanentlyDeleteMessage(message.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Permanently
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};