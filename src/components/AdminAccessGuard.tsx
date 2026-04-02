import React from 'react';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

interface AdminAccessGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AdminAccessGuard: React.FC<AdminAccessGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const { permissions, loading } = useRolePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!permissions.canAccessAdminDashboard) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-red-100 p-3 mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 text-center mb-4">
              Admin access required
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Contact your administrator for access
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminAccessGuard;