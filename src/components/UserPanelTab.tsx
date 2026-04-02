import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { Users, User, UserPlus } from 'lucide-react';
import UserManagement from './UserManagement';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

interface UserPanelTabProps {
  readOnly?: boolean;
  isCoachView?: boolean;
}

const UserPanelTab: React.FC<UserPanelTabProps> = ({ readOnly = false, isCoachView = false }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const regularUsers = users.filter(u => u.role !== 'admin' && u.role !== 'super_admin');
  const recentUsers = users.filter(u => {
    const userDate = new Date(u.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return userDate >= weekAgo;
  }).length;

  return (
    <div className="p-6 space-y-6">
      {/* User Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-indigo-700">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">{users.length}</div>
            <p className="text-xs text-indigo-600 mt-1">All registered users</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-700">
              <User className="h-4 w-4" />
              Regular Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{regularUsers.length}</div>
            <p className="text-xs text-emerald-600 mt-1">Standard members</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-rose-700">
              <UserPlus className="h-4 w-4" />
              New This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-900">{recentUsers}</div>
            <p className="text-xs text-rose-600 mt-1">Recent signups</p>
          </CardContent>
        </Card>
      </div>

      {/* All Users Management */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserManagement
            users={users}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onFetchData={fetchData}
            loading={loading}
            onSetMessage={handleSetMessage}
            showOnlyAdmins={false}
            hideRoleDropdown={readOnly || isCoachView}
            readOnly={readOnly || isCoachView}
            isCoachView={isCoachView}
          />
        </CardContent>
      </Card>

      {message && (
        <Alert variant={messageType === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default UserPanelTab;