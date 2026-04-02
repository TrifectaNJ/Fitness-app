import React, { useState, useEffect } from 'react';
import { useDesign } from '@/contexts/DesignContext';
import { useFitness } from '@/contexts/FitnessContext';
import { useHomePage } from '@/contexts/HomePageContext';
import { useAppContext } from '@/contexts/AppContext';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import AdminSidebarRedesigned from './AdminSidebarRedesigned';
import AdminTopBar from './AdminTopBar';
import AuthForm from './AuthForm';
import AdminAccessGuard from './AdminAccessGuard';
import CoachChatPanel from './CoachChatPanel';
import { supabase } from '@/lib/supabase';


import AdminProgramManager from './AdminProgramManager';
import CoachProgramManagerNew from './CoachProgramManagerNew';
import CoachProgramManager from './CoachProgramManager';
import AdminMediaManager from './AdminMediaManager';
import AdminTimerManager from './AdminTimerManager';
import AdminHomePageManager from './AdminHomePageManager';
import AdminPanelTab from './AdminPanelTab';
import UserPanelTab from './UserPanelTab';
import SystemControlTab from './SystemControlTab';
import AdminPersonalPathManager from './AdminPersonalPathManager';
import { ExerciseLibraryManager } from './ExerciseLibraryManager';
import SimpleCoachProgramsTest from './SimpleCoachProgramsTest';
import AdminOverviewDashboard from './AdminOverviewDashboard';
import UserProgressTab from './UserProgressTab';
import UserAssignmentManager from './UserAssignmentManager';
import PermissionsDebugger from './PermissionsDebugger';
import DebugUserProgress from './DebugUserProgress';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
const AdminLayoutWithChat: React.FC = () => {
  const { settings, updateSettings } = useDesign();
  const { refreshPrograms } = useFitness();
  const { refreshHomePageItems } = useHomePage();
  const { currentUser } = useAppContext();
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
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setShowChatPanel(false);
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

  const handleSettingsClick = () => {
    setActiveTab('settings');
  };

  if (loading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">Loading...</div>;
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
      case 'coach-programs':
        return permissions.canViewCoachPrograms ? <CoachProgramManager /> : null;
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
        return <UserProgressTab />;
      case 'admin-invites':
        return permissions.canViewAdminInvites ? <AdminPanelTab /> : null;
      case 'all-users':
        return permissions.canViewAllUsers ? <UserPanelTab isCoachView={userRole === 'coach'} /> : null;
      case 'settings':
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Application Settings</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Customize the appearance and behavior of your fitness application.</p>
            <Button onClick={() => setShowDesignEditor(true)} className="bg-gradient-to-r from-orange-500 to-blue-600 text-white hover:from-orange-600 hover:to-blue-700">
              <Palette className="w-4 h-4 mr-2" />
              Open Design Editor
            </Button>
          </div>
        );
      case 'system-control':
        return permissions.canViewSystemControl ? <SystemControlTab /> : null;
      case 'debug-permissions':
        return <PermissionsDebugger />;
      default:
        return <AdminOverviewDashboard onTabChange={setActiveTab} />;
    }
  };

  return (
    <AdminAccessGuard>
      <div className="h-screen flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <AdminSidebarRedesigned 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          permissions={permissions}
          userRole={userRole}
        />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminTopBar 
            userDisplayName={getUserDisplayName()}
            onProfileClick={() => console.log('Profile clicked')}
            onSignOut={handleSignOut}
            onSettingsClick={handleSettingsClick}
            onChatClick={() => setShowChatPanel(true)}
            userId={user?.id}
          />
          
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 min-w-0">
            <div className="w-full max-w-full">
              {renderTabContent()}
            </div>
          </main>
        </div>
      </div>

      {showDesignEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Design Editor</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Design editor functionality will be implemented here.</p>
            <Button onClick={() => setShowDesignEditor(false)}>Close</Button>
          </div>
        </div>
      )}
      <CoachChatPanel 
        isOpen={showChatPanel} 
        onClose={() => setShowChatPanel(false)}
        currentUser={user ? { id: user.id, name: getUserDisplayName() } : null}
      />
    </AdminAccessGuard>
  );
};

export default AdminLayoutWithChat;