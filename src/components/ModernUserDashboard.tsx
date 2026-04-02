import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import ProgramCard from './ProgramCard';
import CalorieCalculator from './CalorieCalculator';
import PersonalPathToSuccess from './PersonalPathToSuccess';
import { BeginnerFriendlyProgressTracker } from './BeginnerFriendlyProgressTracker';
import { WorkoutTrackerCard } from './WorkoutTrackerCard';
import { WorkoutHistoryDetail } from './WorkoutHistoryDetail';
import { AutoTrackerCards } from './AutoTrackerCards';
import { PersonalizedProgramsSection } from './PersonalizedProgramsSection';
import { HomePageItemCard } from './HomePageItemCard';
import { useOptimizedPrograms } from '@/hooks/useOptimizedPrograms';
import { useHomePage } from '@/contexts/HomePageContext';
import { ChevronRight, Dumbbell, Camera, Scale, Activity, Droplets, Calculator, Target, Heart, RefreshCw, MessageCircle, TrendingUp, Award, Zap, Flame } from 'lucide-react';
import { CombinedChatInterface } from './CombinedChatInterface';
import { UserCoachProgramsTab } from './UserCoachProgramsTab';
import { FitnessProgram } from '@/types/fitness';
import { supabase } from '@/lib/supabase';

interface ModernUserDashboardProps {
  homePageItems: any[];
  onViewProgram?: (program: FitnessProgram) => void;
  isAdmin?: boolean;
  currentUser?: { id: string; name: string } | null;
  onChatOpen?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const ModernUserDashboard: React.FC<ModernUserDashboardProps> = ({ 
  homePageItems, onViewProgram, isAdmin = false, activeTab = 'home', onTabChange, currentUser, onChatOpen 
}) => {
  const [selectedProgram, setSelectedProgram] = useState<FitnessProgram | null>(null);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [showWorkoutHistory, setShowWorkoutHistory] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<string>('');
  const { programs, refreshPrograms, loading } = useOptimizedPrograms();
  const { refreshHomePageItems } = useHomePage();
  const [currentDate] = useState(new Date());
  const [dashboardStats, setDashboardStats] = useState({ streak: 0, goalsCompleted: 0, progressPercent: 0 });

  useEffect(() => {
    refreshHomePageItems();
  }, []);

  useEffect(() => {
    if (currentUser?.id) fetchDashboardStats(currentUser.id);
  }, [currentUser?.id]);

  const fetchDashboardStats = async (userId: string) => {
    try {
      const [completionsRes, dayCompletionsRes] = await Promise.all([
        supabase
          .from('workout_completions')
          .select('completed_at')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false }),
        supabase
          .from('day_completions')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
      ]);

      // Calculate streak (consecutive days with workout completions)
      let streak = 0;
      if (completionsRes.data && completionsRes.data.length > 0) {
        const days = new Set(completionsRes.data.map((c: any) => c.completed_at.split('T')[0]));
        const check = new Date();
        // Allow streak to count if today or yesterday had activity
        if (!days.has(check.toISOString().split('T')[0])) {
          check.setDate(check.getDate() - 1);
        }
        while (days.has(check.toISOString().split('T')[0])) {
          streak++;
          check.setDate(check.getDate() - 1);
        }
      }

      const goalsCompleted = dayCompletionsRes.count ?? 0;

      // Progress: completed days as % of total program days available
      const totalProgramDays = programs.filter(p => p.isActive).reduce((sum, p) => sum + (p.days?.length || 0), 0);
      const progressPercent = totalProgramDays > 0
        ? Math.min(100, Math.round((goalsCompleted / totalProgramDays) * 100))
        : 0;

      setDashboardStats({ streak, goalsCompleted, progressPercent });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      dumbbell: <Dumbbell className="w-5 h-5" />,
      camera: <Camera className="w-5 h-5" />,
      scale: <Scale className="w-5 h-5" />,
      activity: <Activity className="w-5 h-5" />,
      droplets: <Droplets className="w-5 h-5" />
    };
    return icons[iconName] || <Dumbbell className="w-5 h-5" />;
  };

  const isTrackableItem = (title: string) => {
    const trackableItems = ['water tracker', 'weight tracker', 'step tracker', 'calorie tracker'];
    return trackableItems.some(item => title.toLowerCase().includes(item.toLowerCase()));
  };

  const handleProgramClick = (program: FitnessProgram) => {
    if (onViewProgram) onViewProgram(program);
  };

  const handleHomePageItemClick = async (item: any) => {
    if (isTrackableItem(item.title)) {
      setSelectedTracker(item.title);
      setShowProgressTracker(true);
      return;
    }
    
    if (item.coachProgramId) {
      try {
        const { data: coachProgram, error } = await supabase.from('coach_programs').select('*').eq('id', item.coachProgramId).eq('is_active', true).single();
        if (error) return;
        if (coachProgram && onViewProgram) {
          const { data: daysData } = await supabase
            .from('coach_program_days')
            .select('*')
            .eq('coach_program_id', coachProgram.id)
            .order('day_number', { ascending: true });
          const convertedProgram = {
            id: coachProgram.id, title: coachProgram.title, description: coachProgram.description,
            difficulty: coachProgram.difficulty, duration: coachProgram.duration, category: coachProgram.category,
            imageUrl: coachProgram.image_url, days: daysData || [], price: 0, isActive: coachProgram.is_active, showOnHomePage: false
          };
          onViewProgram(convertedProgram);
          return;
        }
      } catch (error) {
        return;
      }
    }
    
    if (item.programId) {
      const program = programs.find(p => p.id === item.programId);
      if (program && onViewProgram) {
        onViewProgram(program);
        return;
      }
    }
    
    if (item.link) {
      if (item.link === '/page/programs' || item.link === 'programs') {
        if (onTabChange) onTabChange('programs');
        return;
      }
      if (item.link.startsWith('/program/')) {
        const programId = item.link.replace('/program/', '');
        const program = programs.find(p => p.id === programId);
        if (program && onViewProgram) onViewProgram(program);
        return;
      }
      if (item.link.startsWith('http')) {
        window.open(item.link, '_blank');
        return;
      }
      if (item.link.startsWith('/page/')) {
        const page = item.link.replace('/page/', '');
        if (onTabChange) onTabChange(page);
        return;
      }
    }
  };

  const handleTrackerClick = (trackerName: string) => {
    setSelectedTracker(trackerName);
    setShowProgressTracker(true);
  };

  if (showProgressTracker) {
    return (
      <div className="bg-gray-50">
        <div className="w-full px-4 py-8 md:max-w-4xl md:mx-auto">
          <BeginnerFriendlyProgressTracker trackerName={selectedTracker} userId={currentUser?.id || 'anonymous'} onBack={() => setShowProgressTracker(false)} />
        </div>
      </div>
    );
  }

  if (showWorkoutHistory) {
    return (
      <div className="bg-gray-50">
        <div className="w-full px-4 py-8 md:max-w-4xl md:mx-auto">
          <WorkoutHistoryDetail onBack={() => setShowWorkoutHistory(false)} />
        </div>
      </div>
    );
  }


  const renderHomeContent = () => (
    <div className="space-y-6">
      <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 md:p-8 text-white overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Welcome Back!</h2>
              <p className="text-orange-100 text-sm md:text-base">{formatDate(currentDate)}</p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Flame className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2">
              <Award className="w-4 h-4" />
              <span className="text-sm font-semibold">{dashboardStats.streak} Day Streak</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2">
              <Target className="w-4 h-4" />
              <span className="text-sm font-semibold">{dashboardStats.goalsCompleted} Days Completed</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">{dashboardStats.progressPercent}% Progress</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg md:text-xl font-bold text-gray-900">Track Your Progress</h3>
        <AutoTrackerCards onTrackerClick={handleTrackerClick} />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg md:text-xl font-bold text-gray-900">Workout History</h3>
        <div
          className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-200 group"
          onClick={() => setShowWorkoutHistory(true)}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Dumbbell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">View Workout History</h3>
              <p className="text-gray-600 text-sm">See all your completed workouts and stats</p>
              <p className="text-xs text-orange-600 mt-1 font-semibold">Tap to view →</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
        </div>
      </div>

      {homePageItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg md:text-xl font-bold text-gray-900">My Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homePageItems.sort((a, b) => a.order - b.order).map((item) => (
              <HomePageItemCard key={item.id} item={item} onItemClick={handleHomePageItemClick} getIcon={getIcon} isTrackableItem={isTrackableItem} />
            ))}
          </div>
        </div>
      )}


    </div>
  );

  return (
    <div className="flex-1 bg-gray-50">
      <div className="w-full px-4 py-6 md:py-8 md:max-w-6xl md:mx-auto">

        <div className="space-y-6">
          {activeTab === 'home' && renderHomeContent()}
          {activeTab === 'personal-path' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <PersonalPathToSuccess />
            </div>
          )}
          {activeTab === 'calculator' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <Calculator className="w-6 h-6 text-orange-600" />
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">Calorie Calculator</h3>
              </div>
              <CalorieCalculator />
            </div>
          )}
          {activeTab === 'programs' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-orange-600" />
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">Fitness Programs</h3>
              </div>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
                  <p className="text-gray-600">Loading programs...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <PersonalizedProgramsSection onViewProgram={onViewProgram} />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">All Programs</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {programs.filter(p => p.isActive).map((program) => (
                        <ProgramCard key={program.id} program={program} onView={() => handleProgramClick(program)} isAdmin={false} />
                      ))}
                      {programs.filter(p => p.isActive).length === 0 && (
                        <div className="col-span-full text-center py-12">
                          <p className="text-gray-600">No active programs available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'coach-programs' && <UserCoachProgramsTab onViewProgram={onViewProgram} currentUserId={currentUser?.id} />}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-orange-600" />
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">Communication Center</h3>
              </div>
              <div className="w-full md:max-w-5xl md:mx-auto">
                <CombinedChatInterface />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernUserDashboard;
