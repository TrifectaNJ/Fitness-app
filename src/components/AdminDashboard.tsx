import React from 'react';
import AdminAccessGuard from './AdminAccessGuard';
import EnhancedAdminDashboard from './EnhancedAdminDashboard';

const AdminDashboard: React.FC = () => {
  return (
    <AdminAccessGuard>
      <EnhancedAdminDashboard />
    </AdminAccessGuard>
  );
};

export default AdminDashboard;