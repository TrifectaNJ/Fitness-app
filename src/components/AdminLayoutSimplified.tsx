import React, { useState, useEffect } from 'react';
import { useDesign } from '@/contexts/DesignContext';
import { useFitness } from '@/contexts/FitnessContext';
import { useHomePage } from '@/contexts/HomePageContext';
import { useAppContext } from '@/contexts/AppContext';
import AdminSidebarRedesigned from './AdminSidebarRedesigned';
import AdminTopBar from './AdminTopBar';
import { CoachProgramTabFixed } from './CoachProgramTabFixed';
import AdminOverviewDashboard from './AdminOverviewDashboard';
import AuthForm from './AuthForm';
import CoachChatPanel from './CoachChatPanel';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';

// Tab content components
import AdminProgramManager from './AdminProgramManager';
import CoachProgramManager from './CoachProgramManager';
import { EnhancedUserProgressTabComplete } from './EnhancedUserProgressTabComplete';
import AdminMediaManager from './AdminMediaManager';
import AdminTimerManager from './AdminTimerManager';
import AdminHomePageManager from './AdminHomePageManager';
import AdminPanelTab from './AdminPanelTab';
import UserPanelTab from './UserPanelTab';
import SystemControlTab from './SystemControlTab';
import AdminPersonalPathManager from './AdminPersonalPathManager';
import { ExerciseLibraryManager } from './ExerciseLibraryManager';
import EnhancedCoachProgressDashboard from './EnhancedCoachProgressDashboard';
import UserAssignmentManager from './UserAssignmentManager';

const AdminLayoutSimplified: React.FC = () => {
  const { refreshPrograms } = useFitness();
  const { refreshHomePageItems } = useHomePage();
  const { currentUser } = useAppContext();
  
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDesignEditor, setShowDesignEditor] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');

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
        setUserRole(profile?.role || 'user');
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
    setUserRole(profile?.role || 'user');
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

  const isAdminRole = () => {
    return ['super_admin', 'admin', 'coach'].includes(userRole);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} adminOnly={false} />;
  }

  // Access control is now handled by AdminAccessGuard wrapper
  // Remove duplicate access control check

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverviewDashboard onTabChange={setActiveTab} />;
      case 'homepage':
        return <AdminHomePageManager />;
      case 'programs':
        return <AdminProgramManager />;
      case 'coach-programs':
        return <CoachProgramManager />;
      case 'exercises':
        return <ExerciseLibraryManager />;
      case 'personal-path':
        return <AdminPersonalPathManager />;
      case 'media':
        return <AdminMediaManager />;
      case 'timers':
        return <AdminTimerManager />;
      case 'user-assignments':
        return userRole === 'super_admin' ? <UserAssignmentManager /> : null;
      case 'user-progress':
        return (userRole === 'coach' || userRole === 'admin' || userRole === 'super_admin') ? 
          <EnhancedUserProgressTabComplete userRole={userRole} currentUserId={user?.id} /> : null;
      case 'admin-invites':
      case 'all-users':
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
        return userRole === 'super_admin' ? <SystemControlTab /> : null;
      default:
        return <AdminOverviewDashboard onTabChange={setActiveTab} />;
    }
  };

  // Simple permissions for sidebar
  const permissions = {
    canViewOverview: true,
    canViewHome: true,
    canViewPrograms: true,
    canViewCoachPrograms: true,
    canViewPersonalizedPrograms: true,
    canViewExercises: true,
    canViewPersonalPath: true,
    canViewMedia: true,
    canViewTimers: true,

    canAssignUsers: userRole === 'super_admin',
    canViewAdminInvites: userRole !== 'coach',
    canViewAllUsers: true,
    canViewSettings: true,
    canViewSystemControl: userRole === 'super_admin'
  };

  return (
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
    </div>
  );
};

export default AdminLayoutSimplified;