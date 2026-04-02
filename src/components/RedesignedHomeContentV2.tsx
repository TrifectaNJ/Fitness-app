import React from 'react';
import { Button } from '@/components/ui/button';
import { ModernTrackerCards } from './ModernTrackerCards';
import { CleanWorkoutCard } from './CleanWorkoutCard';
import { WorkoutTrackerCard } from './WorkoutTrackerCard';
import { HomePageItemCard } from './HomePageItemCard';
import { FitnessWelcomeHero } from './FitnessWelcomeHero';

interface RedesignedHomeContentV2Props {
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

export const RedesignedHomeContentV2: React.FC<RedesignedHomeContentV2Props> = ({
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
    <div className="space-y-6">
      <FitnessWelcomeHero currentDate={currentDate} formatDate={formatDate} />

      <div className="space-y-3">
        <h3 className="text-xl font-bold text-gray-900">Track Your Progress</h3>
        <ModernTrackerCards onTrackerClick={handleTrackerClick} />
      </div>

      {homePageItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-900">My Plan</h3>
          <div className="grid grid-cols-1 gap-3">
            {homePageItems.sort((a, b) => a.order - b.order).map((item) => (
              <HomePageItemCard key={item.id} item={item} onItemClick={handleHomePageItemClick} getIcon={getIcon} isTrackableItem={isTrackableItem} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Recommended for you</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {difficulties.map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-5 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                selectedDifficulty === diff
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {filteredWorkouts.map((workout, index) => (
            <CleanWorkoutCard
              key={index}
              title={workout.title}
              duration={workout.duration}
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
