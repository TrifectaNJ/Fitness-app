import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { Clock, TrendingUp } from 'lucide-react';
import AdminInviteManager from './AdminInviteManager';
import AdminInviteHistory from './AdminInviteHistory';

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

const AdminPanelTab = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersError) throw usersError;
      setUsers(usersData || []);

      const { data: invitesData, error: invitesError } = await supabase
        .from('admin_invites')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (invitesError) throw invitesError;
      setInvites(invitesData || []);
    } catch (error: any) {
      setMessage(`Error fetching data: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
  };

  const pendingInvites = invites.filter(i => !i.used && new Date(i.expires_at) > new Date()).length;
  const expiredInvites = invites.filter(i => !i.used && new Date(i.expires_at) <= new Date()).length;
  const usedInvites = invites.filter(i => i.used).length;

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">
              Pending Invites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{pendingInvites}</div>
            <p className="text-xs text-blue-600 mt-1">Active invitations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">
              Used Invites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{usedInvites}</div>
            <p className="text-xs text-green-600 mt-1">Successfully accepted</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700">
              <Clock className="h-4 w-4" />
              Expired Invites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{expiredInvites}</div>
            <p className="text-xs text-orange-600 mt-1">Need regeneration</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700">
              <TrendingUp className="h-4 w-4" />
              Total Invites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{invites.length}</div>
            <p className="text-xs text-purple-600 mt-1">All time generated</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Invite Manager */}
      <AdminInviteManager
        onFetchData={fetchData}
        onSetMessage={handleSetMessage}
      />
      
      {/* Admin Invite History */}
      <AdminInviteHistory invites={invites} />

      {message && (
        <Alert variant={messageType === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AdminPanelTab;