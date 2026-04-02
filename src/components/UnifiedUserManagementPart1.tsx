import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { Users, Crown, User, Mail, Copy, RefreshCw, Info } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

interface Invite {
  id: string;
  email: string;
  token: string;
  invited_by: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

interface UnifiedUserManagementProps {
  users: UserProfile[];
  invites: Invite[];
  onFetchData: () => void;
  loading: boolean;
  message: string;
  messageType: 'success' | 'error';
  onSetMessage: (msg: string, type: 'success' | 'error') => void;
}

const UnifiedUserManagementPart1: React.FC<UnifiedUserManagementProps> = ({
  users,
  invites,
  onFetchData,
  loading,
  message,
  messageType,
  onSetMessage
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');

  const generateInvite = async () => {
    if (!inviteEmail) {
      onSetMessage('Email is required', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      onSetMessage('Please enter a valid email address', 'error');
      return;
    }

    setInviteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-admin-invite', {
        body: {
          email: inviteEmail.trim().toLowerCase(),
          invitedBy: 'admin@trifectagroupco.com'
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.inviteUrl) {
        setGeneratedInviteLink(data.inviteUrl);
        onSetMessage('✅ Invite link generated successfully!', 'success');
        setInviteEmail('');
        await onFetchData();
      } else {
        throw new Error('No invite link generated');
      }
    } catch (error: any) {
      onSetMessage(`Failed to generate invite: ${error.message}`, 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onSetMessage('📋 Link copied to clipboard!', 'success');
      setTimeout(() => onSetMessage('', 'success'), 3000);
    } catch (err) {
      onSetMessage('Failed to copy to clipboard', 'error');
    }
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;
  const pendingInvites = invites.filter(i => !i.used && new Date(i.expires_at) > new Date()).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Regular Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Pending Invites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvites}</div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Panel Section */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h2 className="text-xl font-semibold text-gray-900">Admin Panel</h2>
          <p className="text-sm text-gray-600">Manage admin invitations and invite history</p>
        </div>

        {/* Generate New Admin Invite */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Generate New Admin Invite
            </CardTitle>
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
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
                disabled={inviteLoading}
                onKeyPress={(e) => e.key === 'Enter' && generateInvite()}
              />
              <Button onClick={generateInvite} disabled={inviteLoading || !inviteEmail}>
                {inviteLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Invite'
                )}
              </Button>
            </div>

            {generatedInviteLink && (
              <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <label className="text-sm font-medium text-green-800">Generated Invite Link:</label>
                <div className="flex gap-2">
                  <Input value={generatedInviteLink} readOnly className="flex-1 bg-white" />
                  <Button onClick={() => copyToClipboard(generatedInviteLink)} variant="outline" size="sm">
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
      </div>

      {message && (
        <Alert variant={messageType === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default UnifiedUserManagementPart1;