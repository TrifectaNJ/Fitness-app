import React, { useState, useEffect } from 'react';
import UnifiedUserManagementPart1 from './UnifiedUserManagementPart1';
import UnifiedUserManagementPart2 from './UnifiedUserManagementPart2';
import UnifiedUserManagementPart3 from './UnifiedUserManagementPart3';
import { supabase } from '@/lib/supabase';
import { useRealtimeUserProfiles } from '../hooks/useRealtimeUserProfiles';
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

const UnifiedUserManagement = () => {
  const { profiles: realtimeUsers, loading: realtimeLoading } = useRealtimeUserProfiles();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Use real-time users data
  useEffect(() => {
    if (realtimeUsers.length > 0) {
      setUsers(realtimeUsers.map(profile => ({
        id: profile.id,
        email: profile.email,
        role: profile.role,
        first_name: profile.full_name?.split(' ')[0],
        last_name: profile.full_name?.split(' ').slice(1).join(' '),
        created_at: profile.created_at
      })));
    }
  }, [realtimeUsers]);

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

  return (
    <div className="space-y-8">
      {/* Admin Panel Section */}
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-xl font-semibold text-gray-900">Admin Panel</h2>
          <p className="text-sm text-gray-600 mt-1">Manage admin invitations and invite history</p>
        </div>
        
        <UnifiedUserManagementPart1
          users={users}
          invites={invites}
          onFetchData={fetchData}
          loading={loading}
          message={message}
          messageType={messageType}
          onSetMessage={handleSetMessage}
        />
        
        <UnifiedUserManagementPart2
          invites={invites}
          onFetchData={fetchData}
          loading={loading}
          onSetMessage={handleSetMessage}
        />
      </div>

      {/* User Panel Section */}
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-xl font-semibold text-gray-900">User Panel</h2>
          <p className="text-sm text-gray-600 mt-1">Manage existing users and their roles</p>
        </div>
        
        <UnifiedUserManagementPart3
          users={users}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onFetchData={fetchData}
          loading={loading}
          deletingUserId={deletingUserId}
          onSetMessage={handleSetMessage}
        />
      </div>
    </div>
  );
};

export default UnifiedUserManagement;