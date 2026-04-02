import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesign } from '@/contexts/DesignContext';
import { useHomePage } from '@/contexts/HomePageContext';
import { useFitness } from '@/contexts/FitnessContext';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Crown, MessageCircle, Home, Heart, Calculator, Target, Menu, X, GraduationCap } from 'lucide-react';
import ModernUserDashboardRedesigned from './ModernUserDashboardRedesigned';
import RedesignedProgramDetailComplete from './RedesignedProgramDetailComplete';
import EnhancedUserProfile from './EnhancedUserProfile';

import UserProfileDropdown from './UserProfileDropdown';
import AuthForm from './AuthForm';
import CombinedChatPanel from './CombinedChatPanel';
import FloatingChatButton from './FloatingChatButton';
import MessageNotificationBadge from './MessageNotificationBadge';
import MobileBottomNavigation from './MobileBottomNavigation';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { FitnessProgram } from '@/types/fitness';
import { supabase } from '@/lib/supabase';


const ModernUserLayout: React.FC = () => {
  const navigate = useNavigate();
  const { programs, refreshPrograms } = useFitness();
  const { settings } = useDesign();
  const { homePageItems, refreshHomePageItems } = useHomePage();
  const { isAdmin, checkAdminStatus, forceRefresh } = useAppContext();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [viewingProgram, setViewingProgram] = useState<FitnessProgram | undefined>();
  const [showProfile, setShowProfile] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);

  const [purchasedPrograms, setPurchasedPrograms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const initRef = useRef(false);
  const { markMessagesAsRead } = useUnreadMessages(user?.id);


  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    const initializeUser = async () => {
      try {
        setLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.warn('Auth error:', error);
          setUser(null);
        } else {
          setUser(user);
          
          if (user) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (profile) {
              setUserProfile(profile);
              setPurchasedPrograms(profile.purchased_programs || []);
            }
            
            checkAdminStatus();
            refreshPrograms();
            refreshHomePageItems();
          }
        }
      } catch (err) {
        console.warn('User initialization error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  const handleAuthSuccess = async (authUser: any) => {
    setUser(authUser);
    initRef.current = false;
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Clear all state
      setUser(null);
      setUserProfile(null);
      setPurchasedPrograms([]);
      setShowProfile(false);
      setViewingProgram(undefined);
      setShowChatPanel(false);
      initRef.current = false;
      // Navigate to home/login page
      navigate('/', { replace: true });
      // Force a page reload to ensure clean state
      window.location.reload();
    } catch (error) {
      console.warn('Sign out error:', error);
      // Even if there's an error, clear local state and redirect
      setUser(null);
      navigate('/', { replace: true });
      window.location.reload();
    }
  };


  const getUserDisplayName = () => {
    if (userProfile?.first_name) return userProfile.first_name;
    if (user?.user_metadata?.first_name) return user.user_metadata.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const handleProfileClick = () => {
    setShowProfile(true);
    setViewingProgram(undefined);
  };

  const handleBackFromProfile = () => setShowProfile(false);
  const handleProfileUpdate = async () => await checkAdminStatus();
  const handleChatOpen = async () => {
    setShowChatPanel(true);
    await markMessagesAsRead();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center mx-auto animate-spin">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <p className="text-xl text-gray-800 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  if (showProfile) {
    return <EnhancedUserProfile user={user} userProfile={userProfile} onBack={handleBackFromProfile} onProfileUpdate={handleProfileUpdate} />;
  }
  if (viewingProgram) {
    return <RedesignedProgramDetailComplete program={viewingProgram as any} onBack={() => setViewingProgram(undefined)} onStartProgram={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="https://d64gsuwffb70l.cloudfront.net/683f455091f9cbb716202747_1750122931110_fd1cfd7e.png" alt="Logo" className="w-10 h-10" />
              <h1 className="text-xl font-bold text-gray-900">Murray Mania</h1>
            </div>

            <nav className="hidden md:flex items-center space-x-1">
              {[
                { id: 'home', icon: Home, label: 'Home' },
                { id: 'personal-path', icon: Heart, label: 'Diet' },
                { id: 'calculator', icon: Calculator, label: 'Calculator' },
                { id: 'programs', icon: Target, label: 'Programs' },
                { id: 'coach-programs', icon: GraduationCap, label: 'Coach Programs' }
              ].map(({ id, icon: Icon, label }) => (

                <Button key={id} variant="ghost" size="sm" 
                  className={`${activeTab === id ? 'text-orange-600 bg-orange-50' : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'}`}
                  onClick={() => setActiveTab(id)}>
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </Button>
              ))}
            </nav>

            <div className="flex items-center space-x-3">
              <MessageNotificationBadge userId={user?.id} onClick={handleChatOpen} variant="user" />
              <UserProfileDropdown userDisplayName={getUserDisplayName()} onProfileClick={handleProfileClick} onSignOut={handleSignOut} onSettingsClick={() => setShowNotificationPreferences(true)} isAdmin={isAdmin} />

              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-3 space-y-1">
              {[
                { id: 'home', icon: Home, label: 'Home' },
                { id: 'personal-path', icon: Heart, label: 'Diet' },
                { id: 'calculator', icon: Calculator, label: 'Calculator' },
                { id: 'programs', icon: Target, label: 'Programs' },
                { id: 'coach-programs', icon: GraduationCap, label: 'Coach Programs' }
              ].map(({ id, icon: Icon, label }) => (

                <Button key={id} variant="ghost" size="sm" className="w-full justify-start text-gray-700 hover:text-orange-600 hover:bg-orange-50"
                  onClick={() => { setActiveTab(id); setMobileMenuOpen(false); }}>
                  <Icon className="w-4 h-4 mr-3" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pb-20 md:pb-0">
        <ModernUserDashboardRedesigned homePageItems={homePageItems} onViewProgram={setViewingProgram} isAdmin={isAdmin}
          activeTab={activeTab} onTabChange={setActiveTab} currentUser={user ? { id: user.id, name: getUserDisplayName() } : null} onChatOpen={handleChatOpen} />
      </main>

      
      <MobileBottomNavigation activeTab={activeTab} onTabChange={setActiveTab} onChatOpen={handleChatOpen} />
      <FloatingChatButton currentUser={user ? { id: user.id, name: getUserDisplayName() } : null} />
      <CombinedChatPanel isOpen={showChatPanel} onClose={() => setShowChatPanel(false)} currentUser={user ? { id: user.id, name: getUserDisplayName() } : null} />
      <NotificationPreferencesModal
        isOpen={showNotificationPreferences}
        onClose={() => setShowNotificationPreferences(false)}
        userId={user?.id}
      />
    </div>

  );
};

export default ModernUserLayout;
