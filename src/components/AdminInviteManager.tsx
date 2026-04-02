import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { Copy, RefreshCw, Info } from 'lucide-react';

interface AdminInviteManagerProps {
  onFetchData: () => void;
  onSetMessage: (msg: string, type: 'success' | 'error') => void;
}

const AdminInviteManager: React.FC<AdminInviteManagerProps> = ({
  onFetchData,
  onSetMessage
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
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
          role: selectedRole,
          invitedBy: 'admin@trifectagroupco.com'
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Function call failed');
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.success && data?.inviteUrl) {
        setGeneratedInviteLink(data.inviteUrl);
        const roleLabel = selectedRole === 'coach' ? 'Coach' : selectedRole === 'admin' ? 'Admin' : 'Super Admin';
        onSetMessage(`✅ ${roleLabel} invite link generated successfully!`, 'success');
        setInviteEmail('');
        setSelectedRole('admin');
        await onFetchData();
      } else {
        throw new Error('No invite link generated');
      }
    } catch (error: any) {
      console.error('Generate invite error:', error);
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

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Generate New Admin Invite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>ℹ️ How it works:</strong> Only emails that are REGISTERED in the system can receive admin invites.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={inviteLoading}
                onKeyPress={(e) => e.key === 'Enter' && generateInvite()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Admin Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole} disabled={inviteLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select admin role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={generateInvite} 
              disabled={inviteLoading || !inviteEmail}
              className="w-full"
            >
              {inviteLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                `Generate ${selectedRole === 'coach' ? 'Coach' : 'Admin'} Invite`
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
                <p>✅ This link expires in 24 hours. Share it with the person you want to invite.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInviteManager;