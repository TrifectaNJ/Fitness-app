import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { Users, Shield, UserCheck, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RoleChangeConfirmDialog from './RoleChangeConfirmDialog';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

const AdminManagement: React.FC = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    isOpen: boolean;
    userId: string;
    currentRole: string;
    newRole: string;
    userEmail: string;
  }>({ isOpen: false, userId: '', currentRole: '', newRole: '', userEmail: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, role, created_at')
        .in('role', ['super_admin', 'admin', 'coach'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching admin users:', error);
      toast({
        title: "Error",
        description: "Failed to load admin users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'coach': return 'Coach';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'coach': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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

      // Update the local state to reflect the change without refetching
      setAdminUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      const successMessage = newRole === 'user' 
        ? 'User role updated successfully. This account is now a regular user and will appear in the All Users tab.'
        : `Role updated to ${getRoleLabel(newRole)}`;

      toast({
        title: "Success",
        description: successMessage
      });

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading admin users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Manage admin roles and permissions. All admins remain visible regardless of role changes.
            </AlertDescription>
          </Alert>

          {adminUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No admin users found.</p>
              <p className="text-sm mt-2">Use the Admin Invites tab to create admin accounts.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => handleRoleChangeRequest(user.id, newRole, user.role, user.email)}
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
    </>
  );
};

export default AdminManagement;