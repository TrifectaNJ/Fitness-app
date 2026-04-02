import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { ExerciseLibraryManager } from './ExerciseLibraryManager';
import AdminPanelTab from './AdminPanelTab';
import UserPanelTab from './UserPanelTab';
import SystemControlTab from './SystemControlTab';
import { useRolePermissions } from '@/hooks/useRolePermissions';

interface RoleBasedTabContentProps {
  userRole: string;
}

const RoleBasedTabContent: React.FC<RoleBasedTabContentProps> = ({ userRole }) => {
  const { permissions } = useRolePermissions();

  return (
    <>
      {permissions.canViewExercises && (
        <TabsContent value="exercises">
          <ExerciseLibraryManager />
        </TabsContent>
      )}
      
      {permissions.canViewPersonalPath && (
        <TabsContent value="personal-path">
          <Card>
            <CardHeader>
              <CardTitle>Personal Path Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Configure personal path to success content.</p>
            </CardContent>
          </Card>
        </TabsContent>
      )}
      
      {permissions.canViewMedia && (
        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Media Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Upload and manage media files.</p>
            </CardContent>
          </Card>
        </TabsContent>
      )}
      
      {permissions.canViewTimers && (
        <TabsContent value="timers">
          <Card>
            <CardHeader>
              <CardTitle>Timer Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Configure workout timers and intervals.</p>
            </CardContent>
          </Card>
        </TabsContent>
      )}
      
      {permissions.canViewAdminInvites && (
        <TabsContent value="admin-invites">
          <AdminPanelTab />
        </TabsContent>
      )}
      
      {permissions.canViewAllUsers && (
        <TabsContent value="all-users">
          <UserPanelTab isCoach={userRole === 'coach'} />
        </TabsContent>
      )}
      
      {permissions.canViewSettings && (
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Configure application-wide settings here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      )}
      
      {permissions.canViewSystemControl && (
        <TabsContent value="system-control">
          <SystemControlTab />
        </TabsContent>
      )}
    </>
  );
};

export default RoleBasedTabContent;