import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Copy, CheckCircle, AlertCircle, RefreshCw, Clock, XCircle, Trash2, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Invite {
  id: string;
  email: string;
  token: string;
  invited_by: string;
  expires_at: string;
  used: boolean;
  status: string;
  created_at: string;
}

const CombinedAdminInviteManager = () => {
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();

  const loadInvites = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('admin_invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (err: any) {
      setError(`Failed to load invites: ${err.message}`);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const generateInvite = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error: functionError } = await supabase.functions.invoke('create-admin-invite', {
        body: {
          email: email.trim().toLowerCase(),
          invitedBy: 'admin@trifectagroupco.com'
        }
      });

      if (functionError) throw new Error(functionError.message);
      if (!data || data.error) throw new Error(data?.error || 'No data returned');

      if (data.inviteLink) {
        setInviteLink(data.inviteLink);
        setSuccess(`✅ ${data.message || 'Invite link generated successfully!'} The link expires in 24 hours.`);
        setEmail('');
        await loadInvites();
      }
    } catch (err: any) {
      setError(`❌ Failed to generate invite: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (token: string) => {
    try {
      const inviteUrl = `${window.location.origin}/accept-admin-invite?token=${token}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Link copied!",
        description: "The invite link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const deleteInvite = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invite?')) return;
    
    try {
      const { error } = await supabase
        .from('admin_invites')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Invite deleted successfully",
      });
      
      // Refresh the invites list
      await loadInvites();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast({
        title: "Error",
        description: `Failed to delete invite: ${err.message}`,
        variant: "destructive"
      });
    }
  };

  const getInviteStatus = (invite: Invite) => {
    if (invite.used || invite.status === 'accepted') {
      return { status: 'Used', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    }
    if (new Date(invite.expires_at) < new Date()) {
      return { status: 'Expired', color: 'bg-red-100 text-red-800', icon: XCircle };
    }
    return { status: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
  };

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

  return (
    <div className="space-y-6">
      {/* Generate New Invite Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Admin Invite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>ℹ️ How it works:</strong> Only emails that are NOT registered in the system can receive admin invites.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && generateInvite()}
            />
            <Button onClick={generateInvite} disabled={loading || !email}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Invite'
              )}
            </Button>
          </div>

          {inviteLink && (
            <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <label className="text-sm font-medium text-green-800">Generated Invite Link:</label>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="flex-1 bg-white" />
                <Button onClick={() => copyToClipboard(inviteLink.split('token=')[1])} variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-green-700">
                <p>✅ This link expires in 24 hours. Share it with the person you want to invite as an admin.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Invite History Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Admin Invite History</CardTitle>
          <Button onClick={loadInvites} variant="outline" disabled={loadingHistory}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingHistory ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {invites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No admin invites have been sent yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
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
                            onClick={() => copyToClipboard(invite.token)}
                            disabled={invite.used || isExpired(invite.expires_at)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteInvite(invite.id)}
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
    </div>
  );
};

export default CombinedAdminInviteManager;