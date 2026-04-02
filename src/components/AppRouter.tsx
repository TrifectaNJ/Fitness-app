import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Index from '@/pages/Index';
import AdminApp from '@/pages/AdminApp';
import AdminSignupForm from '@/components/AdminSignupForm';
import AcceptAdminInvite from '@/pages/AcceptAdminInvite';
import ProgramDetailPage from '@/pages/ProgramDetailPage';
import Support from '@/pages/Support';
import NotFound from '@/pages/NotFound';

const AppRouter = () => {
  const location = useLocation();

  useEffect(() => {
    // Store current route for potential future use
    // but DO NOT auto-restore to prevent unwanted redirects
    const currentPath = location.pathname + location.search + location.hash;
    sessionStorage.setItem('lastRoute', currentPath);
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/program/:id" element={<ProgramDetailPage />} />
      <Route path="/admin" element={<AdminApp />} />
      <Route path="/admin/signup" element={<AdminSignupForm />} />
      <Route path="/accept-admin-invite" element={<AcceptAdminInvite />} />
      <Route path="/support" element={<Support />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;

