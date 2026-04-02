import React from 'react';
import { Button } from '@/components/ui/button';
import { PremiumTrackerCard } from './PremiumTrackerCard';
import { PremiumWorkoutCard } from './PremiumWorkoutCard';
import { WorkoutTrackerCard } from './WorkoutTrackerCard';
import { HomePageItemCard } from './HomePageItemCard';
import { WelcomeHero } from './ModernUserDashboardRedesignedPart3';


interface RedesignedHomeContentProps {
  currentDate: Date;
  formatDate: (date: Date) => string;
  handleTrackerClick: (trackerName: string) => void;
  homePageItems: any[];
  handleHomePageItemClick: (item: any) => void;
  getIcon: (iconName: string) => React.ReactNode;
  isTrackableItem: (title: string) => boolean;
  setShowWorkoutHistory: (show: boolean) => void;
  selectedDifficulty: string;
  setSelectedDifficulty: (difficulty: string) => void;
  difficulties: string[];
  filteredWorkouts: any[];
  handleProgramClick: (program: any) => void;
}

export const RedesignedHomeContent: React.FC<RedesignedHomeContentProps> = ({
  currentDate,
  formatDate,
  handleTrackerClick,
  homePageItems,
  handleHomePageItemClick,
  getIcon,
  isTrackableItem,
  setShowWorkoutHistory,
  selectedDifficulty,
  setSelectedDifficulty,
  difficulties,
  filteredWorkouts,
  handleProgramClick
}) => {
  return (
    <div className="space-y-8">
      <WelcomeHero currentDate={currentDate} formatDate={formatDate} />

      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-900">Track Your Progress</h3>
        <PremiumTrackerCard onTrackerClick={handleTrackerClick} />
      </div>

      {homePageItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">My Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homePageItems.sort((a, b) => a.order - b.order).map((item) => (
              <HomePageItemCard key={item.id} item={item} onItemClick={handleHomePageItemClick} getIcon={getIcon} isTrackableItem={isTrackableItem} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">Recommended for You</h3>
          <Button variant="ghost" className="text-orange-600 hover:text-orange-700">See All</Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {difficulties.map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-5 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                selectedDifficulty === diff
                  ? 'bg-black text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-500'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkouts.map((workout, index) => (
            <PremiumWorkoutCard
              key={index}
              title={workout.title}
              duration={workout.duration}
              calories={workout.calories}
              difficulty={workout.difficulty}
              imageUrl={workout.imageUrl}
              onClick={() => handleProgramClick(workout)}
              isPremium={index > 2}
            />
          ))}
        </div>
      </div>


    </div>
  );
};
