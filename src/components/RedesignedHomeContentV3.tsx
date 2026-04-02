import React from 'react';
import { ModernWelcomeHeader } from './ModernWelcomeHeader';
import { ModernTrackerSection } from './ModernTrackerSection';
import { PremiumWorkoutCardV2 } from './PremiumWorkoutCardV2';
import { WorkoutTrackerCard } from './WorkoutTrackerCard';
import { ModernPlanCard } from './ModernPlanCard';
import { Dumbbell, Activity } from 'lucide-react';

import { HomePageItemCard } from './HomePageItemCard';

interface RedesignedHomeContentV3Props {
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

export const RedesignedHomeContentV3: React.FC<RedesignedHomeContentV3Props> = ({
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
      <ModernWelcomeHeader title="Fitness at Home" />

      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {difficulties.map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-6 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                selectedDifficulty === diff
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {diff}
            </button>
          ))}
          <button className="px-6 py-2.5 rounded-full font-medium text-sm whitespace-nowrap bg-white text-gray-700 hover:bg-gray-50">
            10-20 min
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Recommended for you</h3>
        <div className="space-y-3">
          {filteredWorkouts.slice(0, 1).map((workout, index) => (
            <PremiumWorkoutCardV2
              key={index}
              title={workout.title}
              duration={workout.duration}
              imageUrl={workout.imageUrl}
              onClick={() => handleProgramClick(workout)}
              isPremium={false}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">{filteredWorkouts.length} Workout</h3>
        <div className="space-y-3">
          {filteredWorkouts.map((workout, index) => (
            <PremiumWorkoutCardV2
              key={index}
              title={workout.title}
              duration={workout.duration}
              imageUrl={workout.imageUrl}
              onClick={() => handleProgramClick(workout)}
              isPremium={index > 2}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Track Your Progress</h3>
        <ModernTrackerSection onTrackerClick={handleTrackerClick} />
      </div>

      {homePageItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">My Plan</h3>
          <div className="grid grid-cols-1 gap-3">
            {homePageItems.sort((a, b) => a.order - b.order).map((item) => (
              <HomePageItemCard key={item.id} item={item} onItemClick={handleHomePageItemClick} getIcon={getIcon} isTrackableItem={isTrackableItem} />
            ))}
          </div>
        </div>
      )}


    </div>
  );
};
