import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ProgramCard from './ProgramCard';
import CalorieCalculator from './CalorieCalculator';
import PersonalPathToSuccess from './PersonalPathToSuccess';
import { BeginnerFriendlyProgressTracker } from './BeginnerFriendlyProgressTracker';
import { WorkoutTrackerCard } from './WorkoutTrackerCard';
import { WorkoutHistoryDetail } from './WorkoutHistoryDetail';
import { PersonalizedProgramsSection } from './PersonalizedProgramsSection';
import { HomePageItemCard } from './HomePageItemCard';
import { useOptimizedPrograms } from '@/hooks/useOptimizedPrograms';
import { useHomePage } from '@/contexts/HomePageContext';
import { ChevronRight, Dumbbell, Camera, Scale, Activity, Droplets, Calculator, Target, Heart, RefreshCw, MessageCircle, TrendingUp, Award, Zap, Flame, Crown } from 'lucide-react';
import { CombinedChatInterface } from './CombinedChatInterface';
import { UserCoachProgramsTab } from './UserCoachProgramsTab';
import { FitnessProgram } from '@/types/fitness';
import { supabase } from '@/lib/supabase';
import { isTrackableItem, handleHomePageItemClickLogic } from './ModernUserDashboardRedesignedPart2';
import { RedesignedHomeContentV3 } from './RedesignedHomeContentV3';




interface ModernUserDashboardRedesignedProps {
  homePageItems: any[];
  onViewProgram?: (program: FitnessProgram) => void;
  isAdmin?: boolean;
  currentUser?: { id: string; name: string } | null;
  onChatOpen?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const ModernUserDashboardRedesigned: React.FC<ModernUserDashboardRedesignedProps> = ({ 
  homePageItems, onViewProgram, isAdmin = false, activeTab = 'home', onTabChange, currentUser, onChatOpen 
}) => {
  const [selectedProgram, setSelectedProgram] = useState<FitnessProgram | null>(null);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [showWorkoutHistory, setShowWorkoutHistory] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const { programs, refreshPrograms, loading } = useOptimizedPrograms();
  const { refreshHomePageItems } = useHomePage();
  const [currentDate] = useState(new Date());

  useEffect(() => {
    refreshHomePageItems();
  }, []);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  const workoutImages = [
    'https://d64gsuwffb70l.cloudfront.net/683f45c6bca03efa5a546f2b_1759904385016_86ff64c5.webp',
    'https://d64gsuwffb70l.cloudfront.net/683f45c6bca03efa5a546f2b_1759904387042_3eb2c971.webp',
    'https://d64gsuwffb70l.cloudfront.net/683f45c6bca03efa5a546f2b_1759904388795_c8adaacf.webp',
    'https://d64gsuwffb70l.cloudfront.net/683f45c6bca03efa5a546f2b_1759904390594_cf22b9e0.webp',
    'https://d64gsuwffb70l.cloudfront.net/683f45c6bca03efa5a546f2b_1759904392344_2b2f30e8.webp',
    'https://d64gsuwffb70l.cloudfront.net/683f45c6bca03efa5a546f2b_1759904394412_8b36a8be.webp'
  ];


  const featuredWorkouts = [
    { title: 'Attack your Abs Workout', duration: '15 Min', calories: '97 Kcal', difficulty: 'Newbie', imageUrl: workoutImages[0] },
    { title: 'Abs and Obliques Day', duration: '15 Min', calories: '105 Kcal', difficulty: 'Medium', imageUrl: workoutImages[1] },
    { title: 'Lean and Strong Legs', duration: '20 Min', calories: '120 Kcal', difficulty: 'Medium', imageUrl: workoutImages[2] },
    { title: 'Full Body Burnout', duration: '12 Min', calories: '85 Kcal', difficulty: 'Newbie', imageUrl: workoutImages[3] },
    { title: 'Core Strength Builder', duration: '18 Min', calories: '110 Kcal', difficulty: 'Advanced', imageUrl: workoutImages[4] },
    { title: 'Power HIIT Session', duration: '25 Min', calories: '150 Kcal', difficulty: 'Advanced', imageUrl: workoutImages[5] }
  ];

  const difficulties = ['All', 'Newbie', 'Medium', 'Advanced'];

  const filteredWorkouts = selectedDifficulty === 'All' 
    ? featuredWorkouts 
    : featuredWorkouts.filter(w => w.difficulty === selectedDifficulty);

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

  const handleHomePageItemClick = async (item: any) => {
    await handleHomePageItemClickLogic(
      item, programs, onViewProgram, onTabChange, 
      setSelectedTracker, setShowProgressTracker, supabase
    );
  };

  const handleTrackerClick = (trackerName: string) => {
    setSelectedTracker(trackerName);
    setShowProgressTracker(true);
  };

  const handleProgramClick = (program: FitnessProgram) => {
    if (onViewProgram) onViewProgram(program);
  };


  if (showProgressTracker) {
    return (
      <div className="min-h-screen bg-gray-50">

        <div className="w-full px-4 py-8 md:max-w-4xl md:mx-auto">
          <BeginnerFriendlyProgressTracker trackerName={selectedTracker} userId={currentUser?.id || 'anonymous'} onBack={() => setShowProgressTracker(false)} />
        </div>
      </div>
    );
  }

  if (showWorkoutHistory) {
    return (
      <div className="min-h-screen bg-gray-50">

        <div className="w-full px-4 py-8 md:max-w-4xl md:mx-auto">
          <WorkoutHistoryDetail onBack={() => setShowWorkoutHistory(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 py-6 md:py-8 md:max-w-6xl md:mx-auto">

        <div className="space-y-6">
          {activeTab === 'home' && (
            <RedesignedHomeContentV3
              handleTrackerClick={handleTrackerClick}
              homePageItems={homePageItems}
              handleHomePageItemClick={handleHomePageItemClick}
              getIcon={getIcon}
              isTrackableItem={isTrackableItem}
              setShowWorkoutHistory={setShowWorkoutHistory}
              selectedDifficulty={selectedDifficulty}
              setSelectedDifficulty={setSelectedDifficulty}
              difficulties={difficulties}
              filteredWorkouts={filteredWorkouts}
              handleProgramClick={handleProgramClick}
            />
          )}


          {activeTab === 'personal-path' && (
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <PersonalPathToSuccess />
            </div>
          )}
          {activeTab === 'calculator' && (
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Calculator className="w-6 h-6 text-orange-600" />
                <h3 className="text-2xl font-bold text-gray-900">Calorie Calculator</h3>
              </div>
              <CalorieCalculator />
            </div>
          )}
          {activeTab === 'programs' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-orange-600" />
                <h3 className="text-2xl font-bold text-gray-900">Fitness Programs</h3>
              </div>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
                  <p className="text-gray-600">Loading programs...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <PersonalizedProgramsSection />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">All Programs</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {programs.filter(p => p.isActive).map((program) => (
                        <ProgramCard key={program.id} program={program} onView={() => handleProgramClick(program)} isAdmin={false} />
                      ))}
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
                <h3 className="text-2xl font-bold text-gray-900">Communication Center</h3>
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

export default ModernUserDashboardRedesigned;
