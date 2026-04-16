import React, { useState, useEffect } from 'react';
import { useFitness } from '@/contexts/FitnessContext';
import { useHomePage } from '@/contexts/HomePageContext';
import AdminSidebarRedesigned from './AdminSidebarRedesigned';
import AdminTopBar from './AdminTopBar';
import AdminOverviewDashboard from './AdminOverviewDashboard';
import AuthForm from './AuthForm';
import CoachChatPanel from './CoachChatPanel';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from './theme-provider';

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
import UserAssignmentManager from './UserAssignmentManager';

const AdminLayoutSimplified: React.FC = () => {
  const { refreshPrograms } = useFitness();
  const { refreshHomePageItems } = useHomePage();
  const { theme, setTheme } = useTheme();
  
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
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
        return permissions.canViewAdminInvites ? <AdminPanelTab /> : null;
      case 'all-users':
        return <UserPanelTab />;
      case 'settings':
        return (
          <div className="p-6 max-w-lg">
            <h3 className="text-xl font-semibold mb-1 text-gray-900 dark:text-gray-100">Settings</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage your admin preferences.</p>
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark Mode</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Switch between light and dark theme</p>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Account</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-3">Signed in as {user?.email}</p>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950">
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        );
      case 'system-control':
        return userRole === 'super_admin' ? <SystemControlTab /> : null;
      default:
        return <AdminOverviewDashboard onTabChange={setActiveTab} />;
    }
  };

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  // Permissions — coaches see only what's relevant to them
  const permissions = {
    canViewOverview: true,
    canViewHome: isAdmin,
    canViewPrograms: isAdmin,
    canViewCoachPrograms: true,
    canViewPersonalizedPrograms: isAdmin,
    canViewExercises: true,
    canViewPersonalPath: isAdmin,
    canViewMedia: isAdmin,
    canViewTimers: isAdmin,
    canViewUserProgress: true,
    canAssignUsers: userRole === 'super_admin',
    canViewAdminInvites: isAdmin,
    canViewAllUsers: isAdmin,
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
        onChatOpen={() => setShowChatPanel(true)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopBar 
          userDisplayName={getUserDisplayName()}
          onProfileClick={() => setActiveTab('settings')}
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

      <CoachChatPanel
        isOpen={showChatPanel} 
        onClose={() => setShowChatPanel(false)}
        currentUser={user ? { id: user.id, name: getUserDisplayName() } : null}
      />
    </div>
  );
};

export default AdminLayoutSimplified;