import React from 'react';
import AdminLayoutSimplified from '@/components/AdminLayoutSimplified';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { HomePageProvider } from '@/contexts/HomePageContext';
import AdminAccessGuard from '@/components/AdminAccessGuard';

const AdminApp: React.FC = () => {
  return (
    <HomePageProvider>
      <BackgroundWrapper page="admin">
        <AdminAccessGuard>
          <AdminLayoutSimplified />
        </AdminAccessGuard>
      </BackgroundWrapper>
    </HomePageProvider>
  );
};

export default AdminApp;