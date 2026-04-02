import React from 'react';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import UserPanelTab from './UserPanelTab';
import { Card, CardContent } from '@/components/ui/card';
import { Eye } from 'lucide-react';

const RoleBasedUserPanelTab: React.FC = () => {
  const { permissions, userRole } = useRolePermissions();

  if (userRole === 'coach') {
    return (
      <div className="space-y-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-700">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">
                Coach View: You can view user information but cannot delete users or change roles.
              </span>
            </div>
          </CardContent>
        </Card>
        <UserPanelTab isCoachView={true} />
      </div>
    );
  }

  return <UserPanelTab />;
};

export default RoleBasedUserPanelTab;