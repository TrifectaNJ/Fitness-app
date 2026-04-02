import React from 'react';
import AdminManagement from './AdminManagement';

const SystemControlTab: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">System Control</h2>
          <p className="text-gray-600">Admin and role management for Super Admins</p>
        </div>
      </div>

      {/* Admin Management Section */}
      <AdminManagement />
    </div>
  );
};

export default SystemControlTab;