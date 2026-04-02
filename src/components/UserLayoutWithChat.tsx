import React, { useState, useEffect, useRef } from 'react';
import { useDesign } from '@/contexts/DesignContext';
import { useHomePage } from '@/contexts/HomePageContext';
import { useFitness } from '@/contexts/FitnessContext';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate, Link } from 'react-router-dom';

import { Crown, Home, Heart, Calculator, Menu, X } from 'lucide-react';
import ModernUserDashboard from './ModernUserDashboard';
import UserProfile from './UserProfile';
import UserProfileDropdown from './UserProfileDropdown';
import AuthForm from './AuthForm';
import UserChatPanel from './UserChatPanel';
import EnhancedFloatingChatButton from './EnhancedFloatingChatButton';
import MobileBottomNavigation from './MobileBottomNavigation';
import ChatNotificationBadge from './ChatNotificationBadge';
import { NotificationBellIcon } from './NotificationBellIcon';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';
import RedesignedProgramDetailComplete from './RedesignedProgramDetailComplete';
import { FitnessProgram } from '@/types/fitness';

const UserLayoutWithChat: React.FC = () => {
  const { refreshPrograms } = useFitness();
  const { homePageItems, refreshHomePageItems } = useHomePage();
  const { isAdmin, checkAdminStatus } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [viewingProgram, setViewingProgram] = useState<FitnessProgram | undefined>();
  const [showProfile, setShowProfile] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'home';
  });
  
  const initRef = useRef(false);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(location.search);
    if (newTab === 'home') params.delete('tab');
    else params.set('tab', newTab);
    navigate(`${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`, { replace: true });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab') || 'home';
    if (tabFromUrl !== activeTab) setActiveTab(tabFromUrl);
  }, [location.search]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const initializeUser = async () => {
      try {
        setLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) setUser(null);
        else {
          setUser(user);
          if (user) {
            const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
            if (profile) setUserProfile(profile);
            checkAdminStatus(); refreshPrograms(); refreshHomePageItems();
          }
        }
      } catch { setUser(null); }
      finally { setLoading(false); }
    };
    initializeUser();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        setShowProfile(false);
        setViewingProgram(undefined);
        setShowChatPanel(false);
        initRef.current = false;
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = async (authUser: any) => { setUser(authUser); initRef.current = false; };
  const handleSignOut = async () => {
    try { await supabase.auth.signOut(); } catch {}
    setUser(null); setUserProfile(null); setShowProfile(false); setViewingProgram(undefined); setShowChatPanel(false); initRef.current = false;
  };
  const getUserDisplayName = () => userProfile?.first_name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';
  const handleChatOpen = () => setShowChatPanel(true);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto animate-spin">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <p className="text-xl text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );

  if (!user) return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  if (showProfile) return <UserProfile user={user} userProfile={userProfile} onBack={() => setShowProfile(false)} onProfileUpdate={checkAdminStatus} />;
  if (viewingProgram) return <RedesignedProgramDetailComplete program={viewingProgram} onBack={() => setViewingProgram(undefined)} onStartProgram={() => {}} />;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* ── Fixed Header ─────────────────────────────────────── */}
      {/* Hard-coded 40px padding-top on the container itself    */}
      <header
        className="bg-white/70 backdrop-blur-xl border-b border-white/20 fixed top-0 left-0 right-0 z-50 shadow-lg shadow-black/5"
        style={{ paddingTop: '40px' }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 md:max-w-7xl md:mx-auto">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
              <img src="https://d64gsuwffb70l.cloudfront.net/683f455091f9cbb716202747_1750122931110_fd1cfd7e.png" alt="Logo" className="w-9 h-9 object-contain flex-shrink-0" />
              <h1 className="font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent leading-tight text-sm md:text-xl md:whitespace-nowrap">
                <span className="block md:inline">Murray</span>
                <span className="block md:inline md:ml-1">Mania</span>
              </h1>
            </div>
            <nav className="hidden md:flex items-center space-x-1 flex-shrink-0">
              <Button variant="ghost" size="sm" className={activeTab === 'home' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'} onClick={() => handleTabChange('home')}><Home className="w-4 h-4 mr-2" />Home</Button>
              <Button variant="ghost" size="sm" className={activeTab === 'personal-path' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'} onClick={() => handleTabChange('personal-path')}><Heart className="w-4 h-4 mr-2" />Diet</Button>
              <Button variant="ghost" size="sm" className={activeTab === 'calculator' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'} onClick={() => handleTabChange('calculator')}><Calculator className="w-4 h-4 mr-2" />Calculator</Button>
            </nav>
            <div className="flex items-center flex-shrink-0" style={{ gap: '6px' }}>
              <NotificationBellIcon userId={user?.id} />
              <ChatNotificationBadge userId={user?.id} onClick={handleChatOpen} variant="user" />
              <div style={{ marginLeft: '6px' }}><UserProfileDropdown userDisplayName={getUserDisplayName()} onProfileClick={() => { setShowProfile(true); setViewingProgram(undefined); }} onSignOut={handleSignOut} onSettingsClick={() => setShowNotificationPreferences(true)} isAdmin={isAdmin} /></div>
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</Button>
            </div>



          </div>
        </div>
      </header>

      {/* ── Main Scrollable Content ──────────────────────────── */}
      {/* Top: 40px safe padding + 64px header = 104px           */}
      {/* Bottom: 56px nav + 32px safe padding = 88px (mobile)   */}
      <main style={{ paddingTop: '104px', paddingBottom: '96px' }} className="md:pb-0">
        <ModernUserDashboard homePageItems={homePageItems} onViewProgram={setViewingProgram} isAdmin={isAdmin} currentUser={user ? { id: user.id, name: getUserDisplayName() } : null} onChatOpen={handleChatOpen} activeTab={activeTab} onTabChange={handleTabChange} />
        
        {/* ── Need Support Link ──────────────────────────────── */}
        <div className="text-center py-6 pb-8">
          <Link to="/support" className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline">
            Need Support?
          </Link>
        </div>
      </main>


      {/* ── Fixed Bottom Nav (mobile only) ───────────────────── */}
      <MobileBottomNavigation activeTab={activeTab} onTabChange={handleTabChange} onChatOpen={handleChatOpen} unreadCount={0} />

      {/* ── Floating Chat Button (desktop only) ──────────────── */}
      <EnhancedFloatingChatButton currentUser={user ? { id: user.id, name: getUserDisplayName() } : null} onClick={handleChatOpen} />

      <UserChatPanel isOpen={showChatPanel} onClose={() => setShowChatPanel(false)} currentUser={user ? { id: user.id, name: getUserDisplayName() } : null} />
      <NotificationPreferencesModal
        isOpen={showNotificationPreferences}
        onClose={() => setShowNotificationPreferences(false)}
        userId={user?.id}
      />
    </div>
  );
};

export default UserLayoutWithChat;
