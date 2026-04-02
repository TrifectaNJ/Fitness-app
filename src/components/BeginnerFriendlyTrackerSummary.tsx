import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, BarChart3, Droplets, Scale, Activity, Utensils } from 'lucide-react';

interface WeeklyStats {
  daysGoalMet: number;
  totalDays: number;
  averageValue: number;
  weeklyChange: number;
  unit: string;
  isWeightTracker?: boolean;
  currentWeight?: number | null;
  goalWeight?: number;
  daysLogged?: number;
}

interface TrackerSummaryProps {
  trackerName: string;
  weeklyStats: WeeklyStats;
}

export const BeginnerFriendlyTrackerSummary: React.FC<TrackerSummaryProps> = ({
  trackerName,
  weeklyStats
}) => {
  const isWaterTracker = trackerName.toLowerCase().includes('water');
  const isWeightTracker = trackerName.toLowerCase().includes('weight') || weeklyStats.isWeightTracker;
  const isStepTracker = trackerName.toLowerCase().includes('step');
  const isCalorieTracker = trackerName.toLowerCase().includes('calorie');

  const goalPercentage = (weeklyStats.daysGoalMet / weeklyStats.totalDays) * 100;

  const getTrackerConfig = () => {
    if (isWaterTracker) return {
      name: 'Water Tracker',
      icon: <Droplets className="w-6 h-6 text-blue-600" />,
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      progressColor: 'bg-blue-500',
      emoji: '💧',
      encouragement: goalPercentage >= 70 ? 'Great hydration!' : 'Keep drinking water!'
    };
    if (isWeightTracker) return {
      name: 'Weight Tracker',
      icon: <Scale className="w-6 h-6 text-purple-600" />,
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      progressColor: 'bg-purple-500',
      emoji: '⚖️',
      encouragement: (weeklyStats.daysLogged ?? 0) >= 4 ? 'Consistent tracking!' : 'Keep logging your weight!'
    };
    if (isStepTracker) return {
      name: 'Step Tracker',
      icon: <Activity className="w-6 h-6 text-green-600" />,
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-200',
      progressColor: 'bg-green-500',
      emoji: '👟',
      encouragement: goalPercentage >= 70 ? 'Keep moving!' : 'More steps await!'
    };
    if (isCalorieTracker) return {
      name: 'Calorie Tracker',
      icon: <Utensils className="w-6 h-6 text-orange-600" />,
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      borderColor: 'border-orange-200',
      progressColor: 'bg-orange-500',
      emoji: '🍎',
      encouragement: goalPercentage >= 70 ? 'Great nutrition tracking!' : 'Keep logging meals!'
    };
    return {
      name: trackerName + ' Tracker',
      icon: <BarChart3 className="w-6 h-6 text-gray-600" />,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      progressColor: 'bg-gray-500',
      emoji: '📊',
      encouragement: goalPercentage >= 70 ? 'Great progress!' : 'Keep it up!'
    };
  };

  const config = getTrackerConfig();

  // Weight-specific summary
  if (isWeightTracker) {
    const currentWeight = weeklyStats.currentWeight;
    const goalWeight = weeklyStats.goalWeight ?? 0;
    const daysLogged = weeklyStats.daysLogged ?? 0;
    const weightChange = weeklyStats.weeklyChange;

    // Calculate progress toward goal (% of gap closed)
    // If no starting point, show 0; if at goal, show 100
    let progressToGoal = 0;
    if (currentWeight !== null && currentWeight !== undefined && goalWeight > 0) {
      if (currentWeight <= goalWeight) {
        progressToGoal = 100;
      } else {
        // Show how far we've come isn't possible without initial weight,
        // so just show current vs goal as a ratio (capped at 100%)
        progressToGoal = Math.min(100, (goalWeight / currentWeight) * 100);
      }
    }

    const isMovingTowardGoal = currentWeight !== null && currentWeight !== undefined && goalWeight > 0
      ? currentWeight <= goalWeight
      : weightChange <= 0;

    return (
      <Card className={`${config.bgColor} ${config.borderColor} border-2 shadow-lg`}>
        <CardHeader className="pb-4 text-center">
          <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold text-gray-800">
            {config.icon}
            <span>{config.name}</span>
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">Your weekly progress summary</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current vs Goal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/70 rounded-xl p-4 text-center border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {currentWeight !== null && currentWeight !== undefined
                  ? currentWeight.toFixed(1)
                  : '—'}
              </div>
              <p className="text-sm font-medium text-gray-600">Current weight (lbs)</p>
            </div>
            <div className="bg-white/70 rounded-xl p-4 text-center border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-purple-700 mb-1">
                {goalWeight > 0 ? goalWeight.toFixed(1) : '—'}
              </div>
              <p className="text-sm font-medium text-gray-600">Goal weight (lbs)</p>
            </div>
          </div>

          {/* Progress toward goal */}
          {currentWeight !== null && currentWeight !== undefined && goalWeight > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-gray-800">Progress Toward Goal</span>
                <span className="text-sm font-medium text-gray-600">
                  {Math.abs(currentWeight - goalWeight).toFixed(1)} lbs to go
                </span>
              </div>
              <Progress
                value={progressToGoal}
                className="h-4 bg-white/60 rounded-full"
              />
            </div>
          )}

          {/* Weekly change + days logged */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/70 rounded-xl p-4 text-center border border-gray-200 shadow-sm">
              <div className={`flex items-center justify-center gap-1 text-2xl font-bold mb-1 ${
                isMovingTowardGoal ? 'text-green-600' : 'text-red-500'
              }`}>
                {isMovingTowardGoal ? (
                  <TrendingDown className="w-5 h-5" />
                ) : (
                  <TrendingUp className="w-5 h-5" />
                )}
                <span>
                  {weightChange === 0 ? '—' : `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}`}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600">lbs this week</p>
            </div>
            <div className="bg-white/70 rounded-xl p-4 text-center border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-gray-900 mb-1">{daysLogged}/7</div>
              <p className="text-sm font-medium text-gray-600">days logged</p>
            </div>
          </div>

          {/* Encouragement */}
          <div className="bg-white/70 rounded-xl p-4 border border-gray-200 shadow-sm text-center">
            <p className="text-base font-medium text-gray-700">
              <span className="text-lg mr-2">{config.emoji}</span>
              {config.encouragement}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Standard (non-weight) summary
  const isPositiveTrend = weeklyStats.weeklyChange >= 0;

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2 shadow-lg`}>
      <CardHeader className="pb-4 text-center">
        <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold text-gray-800">
          {config.icon}
          <span>{config.name}</span>
        </CardTitle>
        <p className="text-gray-600 text-sm mt-2">Your weekly progress summary</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weekly Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-800">This Week's Progress</span>
            <span className="text-lg font-bold text-gray-900 bg-white/60 px-3 py-1 rounded-full">
              {weeklyStats.daysGoalMet}/{weeklyStats.totalDays} days
            </span>
          </div>

          <div className="space-y-2">
            <Progress
              value={goalPercentage}
              className="h-4 bg-white/60 rounded-full"
            />
            <p className="text-center text-base font-medium text-gray-700">
              {goalPercentage.toFixed(0)}% of your weekly goal completed
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/70 rounded-xl p-4 text-center border border-gray-200 shadow-sm">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {isStepTracker || isCalorieTracker
                ? weeklyStats.averageValue.toFixed(0)
                : weeklyStats.averageValue.toFixed(1)}
            </div>
            <p className="text-sm font-medium text-gray-600">
              {isWaterTracker ? 'oz/day average' :
               isStepTracker ? 'steps/day average' :
               isCalorieTracker ? 'calories/day average' :
               `${weeklyStats.unit}/day average`}
            </p>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center border border-gray-200 shadow-sm">
            <div className={`flex items-center justify-center gap-1 text-lg font-bold mb-1 ${
              isPositiveTrend ? 'text-green-600' : 'text-red-500'
            }`}>
              {isPositiveTrend ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              <span>{Math.abs(weeklyStats.weeklyChange).toFixed(1)}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">
              {isWaterTracker ? 'oz weekly change' :
               isStepTracker ? 'steps weekly change' :
               isCalorieTracker ? 'calories weekly change' :
               'weekly change'}
            </p>
          </div>
        </div>

        {/* Encouragement Message */}
        <div className="bg-white/70 rounded-xl p-4 border border-gray-200 shadow-sm text-center">
          <p className="text-base font-medium text-gray-700">
            <span className="text-lg mr-2">{config.emoji}</span>
            {config.encouragement}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
