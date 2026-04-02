import React from 'react';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DebugPermissions: React.FC = () => {
  const { userRole, permissions, loading, currentUser } = useRolePermissions();

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug: User Role & Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">User Info:</h3>
            <p>User ID: {currentUser?.id || 'Not logged in'}</p>
            <p>Email: {currentUser?.email || 'N/A'}</p>
            <p>Role: <Badge variant="outline">{userRole}</Badge></p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Permissions:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>canViewCoachPrograms: <Badge variant={permissions.canViewCoachPrograms ? "default" : "destructive"}>{permissions.canViewCoachPrograms ? "✓" : "✗"}</Badge></div>
              <div>canViewPrograms: <Badge variant={permissions.canViewPrograms ? "default" : "destructive"}>{permissions.canViewPrograms ? "✓" : "✗"}</Badge></div>
              <div>canViewHome: <Badge variant={permissions.canViewHome ? "default" : "destructive"}>{permissions.canViewHome ? "✓" : "✗"}</Badge></div>
              <div>canViewExercises: <Badge variant={permissions.canViewExercises ? "default" : "destructive"}>{permissions.canViewExercises ? "✓" : "✗"}</Badge></div>
              <div>canViewAllUsers: <Badge variant={permissions.canViewAllUsers ? "default" : "destructive"}>{permissions.canViewAllUsers ? "✓" : "✗"}</Badge></div>
              <div>canAccessAdminDashboard: <Badge variant={permissions.canAccessAdminDashboard ? "default" : "destructive"}>{permissions.canAccessAdminDashboard ? "✓" : "✗"}</Badge></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugPermissions;