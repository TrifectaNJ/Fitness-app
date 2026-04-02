import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { LogOut, Users, ChevronLeft, ChevronRight, Home, Dumbbell, MessageCircle, Settings, UserCog, BarChart3, Calendar, FileText, Timer, Image, Palette, Layout, UserPlus, Target, Apple } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { ReliableCoachUsersList } from '@/components/ReliableCoachUsersList';

interface AdminLayoutProps {
  children: ReactNode;
}
import AdminHomePageManager from './AdminHomePageManager';
import AdminPanelTab from './AdminPanelTab';
import UserPanelTab from './UserPanelTab';
import SystemControlTab from './SystemControlTab';
import AdminPersonalPathManager from './AdminPersonalPathManager';
import { ExerciseLibraryManager } from './ExerciseLibraryManager';

import DesignEditor from './DesignEditor';
import ComprehensiveUserProgressTab from './ComprehensiveUserProgressTab';
import UserAssignmentManager from './UserAssignmentManager';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useDesign } from '@/contexts/DesignContext';
import { useFitness } from '@/contexts/FitnessContext';
import { useHomePage } from '@/contexts/HomePageContext';
import AdminOverviewDashboard from './AdminOverviewDashboard';
import AdminProgramManager from './AdminProgramManager';
import AdminMediaManager from './AdminMediaManager';
import AdminTimerManager from './AdminTimerManager';
import AuthForm from './AuthForm';
import AdminAccessGuard from './AdminAccessGuard';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import EnhancedCoachChatPanel from './EnhancedCoachChatPanel';
import ChatDebugPanel from './ChatDebugPanel';
import { AssignmentTestPanel } from './AssignmentTestPanel';

const AdminLayout: React.FC = () => {

  const { settings, updateSettings } = useDesign();
  const { refreshPrograms } = useFitness();
  const { refreshHomePageItems } = useHomePage();
  const { permissions, userRole, loading: roleLoading } = useRolePermissions();
  
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDesignEditor, setShowDesignEditor] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);

  useEffect(() => {
    checkUser();
    refreshPrograms();
    refreshHomePageItems();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setUser(user);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (authUser: any) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    setUser(authUser);
    setUserProfile(profile);
    await Promise.all([
      refreshPrograms(),
      refreshHomePageItems()
    ]);
  };

  const handleSignOut = async () => {
    const navigate = useNavigate();
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setShowChatPanel(false);
      // Navigate to home/login page
      navigate('/', { replace: true });
      // Force a page reload to ensure clean state
      window.location.reload();
    } catch (error) {
      console.warn('Sign out error:', error);
      setUser(null);
      navigate('/', { replace: true });
      window.location.reload();
    }
  };


  const getUserDisplayName = () => {
    if (userProfile?.first_name) {
      return userProfile.first_name;
    }
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Admin';
  };

  if (loading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} adminOnly={false} />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverviewDashboard onTabChange={setActiveTab} />;
      case 'homepage':
        return permissions.canViewHome ? <AdminHomePageManager /> : null;
      case 'programs':
        return permissions.canViewPrograms ? <AdminProgramManager /> : null;
      case 'exercises':
        return permissions.canViewExercises ? <ExerciseLibraryManager /> : null;
      case 'personal-path':
        return permissions.canViewPersonalPath ? <AdminPersonalPathManager /> : null;
      case 'media':
        return permissions.canViewMedia ? <AdminMediaManager /> : null;
      case 'timers':
        return permissions.canViewTimers ? <AdminTimerManager /> : null;
      case 'user-assignments':
        return permissions.canAssignUsers ? <UserAssignmentManager /> : null;
      case 'user-progress':
        return (userRole === 'coach' || userRole === 'admin' || userRole === 'super_admin') ? <ComprehensiveUserProgressTab userRole={userRole} currentUserId={user?.id} /> : null;
      case 'admin-invites':
        return permissions.canViewAdminInvites ? <AdminPanelTab /> : null;
      case 'all-users':
        return permissions.canViewAllUsers ? <UserPanelTab isCoachView={userRole === 'coach'} /> : null;
      case 'settings':
        return permissions.canViewSettings ? (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Application Settings</h3>
            <p className="text-gray-600 mb-6">Customize the appearance and behavior of your fitness application.</p>
            <Button onClick={() => setShowDesignEditor(true)} className="bg-gradient-to-r from-orange-500 to-blue-600 text-white hover:from-orange-600 hover:to-blue-700">
              <Palette className="w-4 h-4 mr-2" />
              Open Design Editor
            </Button>
          </div>
        ) : null;
      case 'system-control':
        return permissions.canViewSystemControl ? <SystemControlTab /> : null;
      case 'messages':
        return (userRole === 'coach' || userRole === 'admin' || userRole === 'super_admin') ? <ReliableCoachUsersList /> : null;
      case 'chat-debug':
        return userRole === 'super_admin' ? <ChatDebugPanel /> : null;
      case 'assignment-test':
        return userRole === 'super_admin' ? <AssignmentTestPanel /> : null;
      default:
        return <AdminOverviewDashboard onTabChange={setActiveTab} />;
    }
  };

  return (
    <AdminAccessGuard>
      <div className="h-screen flex bg-gray-50">
        <AdminSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          permissions={permissions}
          userRole={userRole}
        />
        
        <div className="flex-1 flex flex-col">
          <AdminTopBar 
            userDisplayName={getUserDisplayName()}
            onProfileClick={() => console.log('Profile clicked')}
            onSignOut={handleSignOut}
            onChatClick={() => setShowChatPanel(true)}
            userId={user?.id}
          />
          
          <main className="flex-1 overflow-auto bg-gray-50">
            {renderTabContent()}
          </main>
        </div>
      </div>

      <DesignEditor
        open={showDesignEditor}
        onOpenChange={setShowDesignEditor}
        onSave={updateSettings}
        currentSettings={settings}
      />
      
      <EnhancedCoachChatPanel 
        isOpen={showChatPanel} 
        onClose={() => setShowChatPanel(false)} 
        currentUser={user ? { id: user.id, name: getUserDisplayName() } : null}
      />
    </AdminAccessGuard>
  );
};

export default AdminLayout;