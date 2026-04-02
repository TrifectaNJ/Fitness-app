import React from 'react';
import { useRolePermissions } from '@/hooks/useRolePermissions';

const DebugUserProgress: React.FC = () => {
  const { userRole, permissions, loading } = useRolePermissions();

  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Debug User Progress Tab</h3>
      <div className="space-y-2 text-sm">
        <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
        <p><strong>User Role:</strong> {userRole}</p>
        <p><strong>canViewUserProgress:</strong> {permissions.canViewUserProgress ? 'true' : 'false'}</p>
        <p><strong>canViewAllUsers:</strong> {permissions.canViewAllUsers ? 'true' : 'false'}</p>
        <p><strong>canAssignUsers:</strong> {permissions.canAssignUsers ? 'true' : 'false'}</p>
        <div className="mt-4">
          <p><strong>All Permissions:</strong></p>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(permissions, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DebugUserProgress;