import React, { useState } from 'react';
import { Download, FileText, Calendar, User, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface ExportOptions {
  format: 'json' | 'csv' | 'txt';
  dateFrom: Date | null;
  dateTo: Date | null;
  includeArchived: boolean;
  conversationWith: string;
  includePinned: boolean;
  includeReactions: boolean;
}

interface MessageExportPanelProps {
  currentUserId: string;
}

export const MessageExportPanel: React.FC<MessageExportPanelProps> = ({
  currentUserId
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    dateFrom: null,
    dateTo: null,
    includeArchived: false,
    conversationWith: '',
    includePinned: true,
    includeReactions: true
  });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<{id: string, name: string}>>([]);

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .neq('id', currentUserId);
      
      setUsers(data?.map(u => ({ id: u.id, name: u.full_name || 'Unknown' })) || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessagesForExport = async () => {
    let query = supabase
      .from('messages')
      .select(`
        id, message, created_at, sender_id, receiver_id, read_status, pinned, archived,
        sender:user_profiles!messages_sender_id_fkey(full_name),
        receiver:user_profiles!messages_receiver_id_fkey(full_name)
        ${exportOptions.includeReactions ? ', reactions:message_reactions(emoji, user_id, created_at, user:profiles(full_name))' : ''}
      `)
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

    if (exportOptions.conversationWith) {
      query = query.or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${exportOptions.conversationWith}),and(sender_id.eq.${exportOptions.conversationWith},receiver_id.eq.${currentUserId})`);
    }

    if (exportOptions.dateFrom) {
      query = query.gte('created_at', exportOptions.dateFrom.toISOString());
    }

    if (exportOptions.dateTo) {
      const endDate = new Date(exportOptions.dateTo);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDate.toISOString());
    }

    if (!exportOptions.includeArchived) {
      query = query.neq('archived', true);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  };

  const exportToJSON = (messages: any[]) => {
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: currentUserId,
      totalMessages: messages.length,
      filters: exportOptions,
      messages: messages.map(msg => ({
        id: msg.id,
        message: msg.message,
        timestamp: msg.created_at,
        sender: {
          id: msg.sender_id,
          name: msg.sender?.full_name || 'Unknown'
        },
        receiver: {
          id: msg.receiver_id,
          name: msg.receiver?.full_name || 'Unknown'
        },
        readStatus: msg.read_status,
        pinned: msg.pinned || false,
        archived: msg.archived || false,
        reactions: exportOptions.includeReactions ? msg.reactions : undefined
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    return blob;
  };

  const exportToCSV = (messages: any[]) => {
    const headers = [
      'ID', 'Message', 'Timestamp', 'Sender ID', 'Sender Name', 
      'Receiver ID', 'Receiver Name', 'Read Status', 'Pinned', 'Archived'
    ];

    if (exportOptions.includeReactions) {
      headers.push('Reactions');
    }

    const csvContent = [
      headers.join(','),
      ...messages.map(msg => {
        const row = [
          msg.id,
          `"${msg.message.replace(/"/g, '""')}"`,
          msg.created_at,
          msg.sender_id,
          `"${msg.sender?.full_name || 'Unknown'}"`,
          msg.receiver_id,
          `"${msg.receiver?.full_name || 'Unknown'}"`,
          msg.read_status,
          msg.pinned || false,
          msg.archived || false
        ];

        if (exportOptions.includeReactions) {
          const reactions = msg.reactions?.map((r: any) => `${r.emoji}:${r.user?.full_name}`).join(';') || '';
          row.push(`"${reactions}"`);
        }

        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    return blob;
  };

  const exportToTXT = (messages: any[]) => {
    const content = [
      `Message Export - ${format(new Date(), 'PPP')}`,
      `Total Messages: ${messages.length}`,
      `User ID: ${currentUserId}`,
      '',
      '=' * 50,
      '',
      ...messages.map(msg => {
        const sender = msg.sender_id === currentUserId ? 'You' : (msg.sender?.full_name || 'Unknown');
        const timestamp = format(new Date(msg.created_at), 'PPP p');
        let msgText = `[${timestamp}] ${sender}: ${msg.message}`;
        
        if (msg.pinned) msgText += ' 📌';
        if (msg.archived) msgText += ' 📦';
        
        if (exportOptions.includeReactions && msg.reactions?.length > 0) {
          const reactions = msg.reactions.map((r: any) => r.emoji).join('');
          msgText += ` ${reactions}`;
        }
        
        return msgText;
      })
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    return blob;
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const messages = await fetchMessagesForExport();
      
      let blob: Blob;
      let filename: string;
      
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      
      switch (exportOptions.format) {
        case 'json':
          blob = exportToJSON(messages);
          filename = `messages-export-${dateStr}.json`;
          break;
        case 'csv':
          blob = exportToCSV(messages);
          filename = `messages-export-${dateStr}.csv`;
          break;
        case 'txt':
          blob = exportToTXT(messages);
          filename = `messages-export-${dateStr}.txt`;
          break;
        default:
          throw new Error('Invalid export format');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Download className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Export Message History</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Export Format</label>
          <Select 
            value={exportOptions.format} 
            onValueChange={(value: 'json' | 'csv' | 'txt') => 
              setExportOptions(prev => ({ ...prev, format: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON (Structured Data)</SelectItem>
              <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
              <SelectItem value="txt">TXT (Plain Text)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Conversation With</label>
          <Select 
            value={exportOptions.conversationWith} 
            onValueChange={(value) => 
              setExportOptions(prev => ({ ...prev, conversationWith: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All conversations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All conversations</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">From Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left">
                <Calendar className="mr-2 h-4 w-4" />
                {exportOptions.dateFrom ? format(exportOptions.dateFrom, 'MMM dd, yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={exportOptions.dateFrom}
                onSelect={(date) => setExportOptions(prev => ({ ...prev, dateFrom: date }))}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">To Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left">
                <Calendar className="mr-2 h-4 w-4" />
                {exportOptions.dateTo ? format(exportOptions.dateTo, 'MMM dd, yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={exportOptions.dateTo}
                onSelect={(date) => setExportOptions(prev => ({ ...prev, dateTo: date }))}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Export Options</label>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="includeArchived"
            checked={exportOptions.includeArchived}
            onCheckedChange={(checked) => 
              setExportOptions(prev => ({ ...prev, includeArchived: !!checked }))
            }
          />
          <label htmlFor="includeArchived" className="text-sm">Include archived messages</label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="includePinned"
            checked={exportOptions.includePinned}
            onCheckedChange={(checked) => 
              setExportOptions(prev => ({ ...prev, includePinned: !!checked }))
            }
          />
          <label htmlFor="includePinned" className="text-sm">Include pinned status</label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="includeReactions"
            checked={exportOptions.includeReactions}
            onCheckedChange={(checked) => 
              setExportOptions(prev => ({ ...prev, includeReactions: !!checked }))
            }
          />
          <label htmlFor="includeReactions" className="text-sm">Include message reactions</label>
        </div>
      </div>

      <Button 
        onClick={handleExport} 
        disabled={loading}
        className="w-full flex items-center space-x-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            <span>Export Messages</span>
          </>
        )}
      </Button>
    </Card>
  );
};