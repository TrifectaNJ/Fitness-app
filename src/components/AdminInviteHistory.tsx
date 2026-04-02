import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, Clock, CheckCircle, XCircle, Copy, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface Invite {
  id: string;
  email: string;
  token: string;
  role?: string;
  invited_by: string;
  expires_at: string;
  used: boolean;
  status: string;
  created_at: string;
}

interface AdminInviteHistoryProps {
  invites: Invite[];
  onRefresh?: () => void;
  onDeleteInvite?: (inviteId: string) => void;
}

const AdminInviteHistory: React.FC<AdminInviteHistoryProps> = ({ 
  invites, 
  onRefresh,
  onDeleteInvite 
}) => {
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'coach':
        return 'Coach';
      case 'admin':
      case 'general_admin':
        return 'Admin';
      case 'super_admin':
        return 'Super Admin';
      default:
        return 'Admin';
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'coach':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
      case 'general_admin':
        return 'bg-purple-100 text-purple-800';
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  const getInviteStatus = (invite: Invite) => {
    if (invite.used || invite.status === 'accepted') {
      return { status: 'Used', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    } else if (isExpired(invite.expires_at)) {
      return { status: 'Expired', color: 'bg-red-100 text-red-800', icon: XCircle };
    } else {
      return { status: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
  };

  const copyInviteLink = (token: string) => {
    const inviteLink = `${window.location.origin}/accept-admin-invite?token=${token}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Link copied!",
      description: "The invite link has been copied to your clipboard.",
    });
  };

  const handleDeleteInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to delete this invite?')) return;
    
    try {
      const { error } = await supabase
        .from('admin_invites')
        .delete()
        .eq('id', inviteId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Invite deleted successfully",
      });
      
      if (onRefresh) {
        onRefresh();
      }
      
      if (onDeleteInvite) {
        onDeleteInvite(inviteId);
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast({
        title: "Error",
        description: `Failed to delete invite: ${err.message}`,
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Admin Invite History
          </CardTitle>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {invites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No admin invites have been sent yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Invited By</TableHead>
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
                    <TableCell>
                      <Badge className={getRoleBadgeColor(invite.role)}>
                        {getRoleLabel(invite.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>{invite.invited_by}</TableCell>
                    <TableCell>{formatDate(invite.created_at)}</TableCell>
                    <TableCell>
                      <Badge className={color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyInviteLink(invite.token)}
                          disabled={invite.used || isExpired(invite.expires_at)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInvite(invite.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

export default AdminInviteHistory;