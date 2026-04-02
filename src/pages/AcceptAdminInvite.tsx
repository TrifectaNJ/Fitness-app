import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const AcceptAdminInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid invite link - no token provided');
      setLoading(false);
      return;
    }

    acceptInvite();
  }, [token]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'coach':
        return 'Coach';
      case 'admin':
        return 'General Admin';
      case 'super_admin':
        return 'Super Admin';
      default:
        return 'Admin';
    }
  };

  const acceptInvite = async () => {
    try {
      setLoading(true);
      
      // Check if invite exists and is valid
      const { data: invite, error: inviteError } = await supabase
        .from('admin_invites')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .single();

      if (inviteError || !invite) {
        console.error('Invite lookup error:', inviteError);
        setStatus('error');
        setMessage('Invalid or expired invite link');
        setLoading(false);
        return;
      }

      // Store the role from the invite
      setInviteRole(invite.role || 'admin');

      // Check if invite has expired
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        setStatus('expired');
        setMessage('This invite link has expired');
        setLoading(false);
        return;
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        // User not logged in, redirect to login
        navigate(`/?login=true&invite_token=${token}&email=${invite.email}`);
        return;
      }

      // Check if user email matches invite email
      if (user.email !== invite.email) {
        setStatus('error');
        setMessage(`This invite is for ${invite.email}. Please log in with the correct email address.`);
        setLoading(false);
        return;
      }

      // Update user profile with the specific role from the invite
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: user.email,
          role: invite.role || 'admin',
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile update error:', profileError);
        setStatus('error');
        setMessage('Failed to update user profile');
        setLoading(false);
        return;
      }

      // Mark invite as used
      const { error: updateError } = await supabase
        .from('admin_invites')
        .update({
          used: true,
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('token', token);

      if (updateError) {
        console.error('Invite update error:', updateError);
      }

      setStatus('success');
      const roleLabel = getRoleLabel(invite.role || 'admin');
      setMessage(`Congratulations! You are now a ${roleLabel}.`);
      
      // Redirect to admin dashboard after 3 seconds
      setTimeout(() => {
        navigate('/admin');
      }, 3000);
      
    } catch (error: any) {
      console.error('Accept invite error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
      case 'expired':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Processing Admin Invite...';
      case 'success':
        return `Welcome, ${getRoleLabel(inviteRole)}!`;
      case 'error':
        return 'Invite Error';
      case 'expired':
        return 'Invite Expired';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className={`w-full max-w-md ${getStatusColor()}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle>{getTitle()}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
          
          {status === 'success' && (
            <p className="text-sm text-gray-600">
              Redirecting to admin dashboard in 3 seconds...
            </p>
          )}
          
          {(status === 'error' || status === 'expired') && (
            <div className="space-y-2">
              <Button onClick={() => navigate('/?login=true')} className="w-full">
                Go to Login
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                Go to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptAdminInvite;