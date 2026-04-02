import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { Users, Search, Crown, User, Trash2, Shield, UserCheck, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UserDetailModal from './UserDetailModal';
interface UserProfile {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

interface UserManagementProps {
  users: UserProfile[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onFetchData: () => void;
  loading: boolean;
  onSetMessage: (msg: string, type: 'success' | 'error') => void;
  showOnlyAdmins?: boolean;
  hideRoleDropdown?: boolean;
  readOnly?: boolean;
  isCoachView?: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  searchTerm,
  onSearchChange,
  onFetchData,
  loading,
  onSetMessage,
  showOnlyAdmins = false,
  hideRoleDropdown = false,
  readOnly = false,
  isCoachView = false
}) => {
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'coach': return 'Coach';
      case 'user': return 'User';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'coach': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Crown className="h-3 w-3 mr-1" />;
      case 'admin': return <Shield className="h-3 w-3 mr-1" />;
      case 'coach': return <UserCheck className="h-3 w-3 mr-1" />;
      case 'user': return <User className="h-3 w-3 mr-1" />;
      default: return <User className="h-3 w-3 mr-1" />;
    }
  };

  const deleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        body: { userId }
      });

      if (error) throw error;

      if (data?.success) {
        onSetMessage(data.message || 'User deleted successfully', 'success');
        await onFetchData();
      } else {
        throw new Error(data?.error || 'Failed to delete user');
      }
    } catch (error: any) {
      onSetMessage(`Failed to delete user: ${error.message}`, 'error');
    } finally {
      setDeletingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const emptyStateText = showOnlyAdmins ? 'No admin users found.' : 'No users found.';
  const searchPlaceholder = showOnlyAdmins ? 'Search admins...' : 'Search users...';

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>{emptyStateText}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{user.email}</div>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {getRoleIcon(user.role)}
                    {getRoleLabel(user.role)}
                  </Badge>
                </div>
                {(user.first_name || user.last_name) && (
                  <div className="text-sm text-gray-600">
                    {user.first_name} {user.last_name}
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  Joined: {formatDate(user.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUser(user)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                {!readOnly && !isCoachView && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingUserId === user.id}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete {user.email}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete User
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <UserDetailModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
};

export default UserManagement;