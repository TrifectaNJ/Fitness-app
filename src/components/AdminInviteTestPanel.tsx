import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, TestTube, RefreshCw, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Invite {
  id: string;
  email: string;
  token: string;
  invited_by: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

const AdminInviteTestPanel = () => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadInvites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_invites')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setInvites(data || []);
    } catch (err: any) {
      setError(`Failed to load invites: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const testInviteGeneration = async () => {
    if (!testEmail) {
      setError('Please enter a test email');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error: functionError } = await supabase.functions.invoke('create-admin-invite', {
        body: {
          email: testEmail.trim().toLowerCase(),
          invitedBy: 'test-admin@trifectagroupco.com'
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Function call failed');
      }

      if (data?.inviteLink) {
        setSuccess(`✅ Test invite generated! Link: ${data.inviteLink}`);
        setTestEmail('');
        await loadInvites(); // Refresh the list
      } else {
        throw new Error('No invite link returned');
      }
    } catch (err: any) {
      setError(`❌ Test failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/admin/signup?token=${token}`;
    navigator.clipboard.writeText(link);
    setSuccess('📋 Invite link copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const openInviteLink = (token: string) => {
    const link = `${window.location.origin}/admin/signup?token=${token}`;
    window.open(link, '_blank');
  };

  const getInviteStatus = (invite: Invite) => {
    if (invite.used) {
      return { status: 'used', color: 'bg-gray-500', icon: CheckCircle };
    }
    if (new Date(invite.expires_at) < new Date()) {
      return { status: 'expired', color: 'bg-red-500', icon: XCircle };
    }
    return { status: 'active', color: 'bg-green-500', icon: Clock };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Test Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Invite System Test Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter test email (e.g., test@example.com)"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={testInviteGeneration} disabled={loading}>
              {loading ? 'Testing...' : 'Test Generate'}
            </Button>
            <Button onClick={loadInvites} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Invites List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Invites ({invites.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No invites found. Generate a test invite above.
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => {
                const { status, color, icon: StatusIcon } = getInviteStatus(invite);
                return (
                  <div key={invite.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`${color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{invite.email}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyInviteLink(invite.token)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openInviteLink(invite.token)}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 grid grid-cols-2 gap-4">
                      <div>Created: {formatDate(invite.created_at)}</div>
                      <div>Expires: {formatDate(invite.expires_at)}</div>
                      <div>Invited by: {invite.invited_by}</div>
                      <div>Token: {invite.token.substring(0, 8)}...</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInviteTestPanel;