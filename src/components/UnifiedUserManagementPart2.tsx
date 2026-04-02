import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { RefreshCw, CheckCircle, XCircle, Clock, Copy, Trash2 } from 'lucide-react';

interface Invite {
  id: string;
  email: string;
  token: string;
  invited_by: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

interface UnifiedUserManagementPart2Props {
  invites: Invite[];
  onFetchData: () => void;
  loading: boolean;
  onSetMessage: (msg: string, type: 'success' | 'error') => void;
}

const UnifiedUserManagementPart2: React.FC<UnifiedUserManagementPart2Props> = ({
  invites,
  onFetchData,
  loading,
  onSetMessage
}) => {
  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/admin/signup?token=${token}`;
    navigator.clipboard.writeText(link);
    onSetMessage('📋 Invite link copied to clipboard!', 'success');
    setTimeout(() => onSetMessage('', 'success'), 3000);
  };

  const deleteInvite = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invite?')) return;
    
    try {
      const { error } = await supabase
        .from('admin_invites')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      onSetMessage('Invite deleted successfully', 'success');
      await onFetchData();
    } catch (err: any) {
      onSetMessage(`Failed to delete invite: ${err.message}`, 'error');
    }
  };

  const getInviteStatus = (invite: Invite) => {
    if (invite.used) {
      return { status: 'Used', color: 'bg-gray-500', icon: CheckCircle };
    }
    if (new Date(invite.expires_at) < new Date()) {
      return { status: 'Expired', color: 'bg-red-500', icon: XCircle };
    }
    return { status: 'Pending', color: 'bg-green-500', icon: Clock };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Admin Invite History</CardTitle>
        <Button onClick={onFetchData} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {invites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No admin invites found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Date Sent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => {
                const { status, color, icon: StatusIcon } = getInviteStatus(invite);
                return (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.email}</TableCell>
                    <TableCell>{formatDate(invite.created_at)}</TableCell>
                    <TableCell>
                      <Badge className={`${color} text-white`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyInviteLink(invite.token)}
                          title="Copy invite link"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteInvite(invite.id)}
                          title="Delete invite"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedUserManagementPart2;