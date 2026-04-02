import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { Shield, User, Search, Crown, Trash2, UserCheck, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RoleChangeConfirmDialog from './RoleChangeConfirmDialog';
import UserDetailModal from './UserDetailModal';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

interface UnifiedUserManagementPart3Props {
  users: UserProfile[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onFetchData: () => void;
  loading: boolean;
  deletingUserId: string | null;
  onSetMessage: (msg: string, type: 'success' | 'error') => void;
  readOnly?: boolean;
}

const UnifiedUserManagementPart3: React.FC<UnifiedUserManagementPart3Props> = ({
  users,
  searchTerm,
  onSearchChange,
  onFetchData,
  loading,
  deletingUserId,
  onSetMessage,
  readOnly = false
}) => {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    isOpen: boolean;
    userId: string;
    currentRole: string;
    newRole: string;
    userEmail: string;
  }>({ isOpen: false, userId: '', currentRole: '', newRole: '', userEmail: '' });

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

  const handleRoleChangeRequest = (userId: string, newRole: string, currentRole: string, userEmail: string) => {
    if (newRole === currentRole) return;
    
    setRoleChangeDialog({
      isOpen: true,
      userId,
      currentRole,
      newRole,
      userEmail
    });
  };

  const handleRoleChangeConfirm = async () => {
    const { userId, newRole } = roleChangeDialog;
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      const successMessage = newRole === 'user' 
        ? 'User role updated successfully. This account is now a regular user.'
        : `Role updated to ${getRoleLabel(newRole)}`;

      toast({
        title: "Success",
        description: successMessage
      });

      onFetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive"
      });
    } finally {
      setRoleChangeDialog({ isOpen: false, userId: '', currentRole: '', newRole: '', userEmail: '' });
    }
  };

  const handleViewUserDetails = (user: UserProfile) => {
    setSelectedUser(user);
    setIsUserDetailModalOpen(true);
  };

  const deleteUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        body: { userId }
      });

      if (error) throw error;

      if (data?.success) {
        onSetMessage(data.message || 'User deleted successfully', 'success');
        onFetchData();
      } else {
        throw new Error(data?.error || 'Failed to delete user');
      }
    } catch (error: any) {
      onSetMessage(`Failed to delete user: ${error.message}`, 'error');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="border-b pb-2">
        <h2 className="text-xl font-semibold text-gray-900">User Panel</h2>
        <p className="text-sm text-gray-600">Manage existing users and their roles</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Management
          </CardTitle>
          <div className="text-sm text-gray-600 mt-2">
            💡 <strong>Note:</strong> Use the role dropdown to change user permissions. Deleting a user will fully remove their account from the system.
          </div>
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by email or name..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={onFetchData} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No users found</p>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}` 
                            : user.email.split('@')[0]
                          }
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {getRoleIcon(user.role)}
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                   <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewUserDetails(user)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Select
                      value={user.role}
                      onValueChange={(newRole) => handleRoleChangeRequest(user.id, newRole, user.role, user.email)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                    {!readOnly && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={deletingUserId === user.id}
                          >
                            {deletingUserId === user.id ? (
                              'Deleting...'
                            ) : (
                              <><Trash2 className="w-4 h-4 mr-1" /> Delete</>
                            )}
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
        </CardContent>
      </Card>

      <RoleChangeConfirmDialog
        isOpen={roleChangeDialog.isOpen}
        onClose={() => setRoleChangeDialog({ isOpen: false, userId: '', currentRole: '', newRole: '', userEmail: '' })}
        onConfirm={handleRoleChangeConfirm}
        currentRole={roleChangeDialog.currentRole}
        newRole={roleChangeDialog.newRole}
        userEmail={roleChangeDialog.userEmail}
      />

      <UserDetailModal
        isOpen={isUserDetailModalOpen}
        onClose={() => setIsUserDetailModalOpen(false)}
        user={selectedUser}
      />
    </div>
  );
};

export default UnifiedUserManagementPart3;