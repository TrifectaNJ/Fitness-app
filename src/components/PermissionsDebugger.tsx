import React from 'react';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const PermissionsDebugger: React.FC = () => {
  const { userRole, permissions, loading, currentUser } = useRolePermissions();

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Permissions Debug</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>User Info</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Role:</strong> {userRole}</p>
            <p><strong>User ID:</strong> {currentUser?.id || 'None'}</p>
            <p><strong>Email:</strong> {currentUser?.email || 'None'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>canViewUserProgress:</strong> {permissions.canViewUserProgress ? '✅' : '❌'}</p>
            <p><strong>canViewAllUsers:</strong> {permissions.canViewAllUsers ? '✅' : '❌'}</p>
            <p><strong>canAssignUsers:</strong> {permissions.canAssignUsers ? '✅' : '❌'}</p>
            <p><strong>canAccessAdminDashboard:</strong> {permissions.canAccessAdminDashboard ? '✅' : '❌'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>All Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(permissions, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionsDebugger;