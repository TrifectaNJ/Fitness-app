import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Award, Target } from 'lucide-react';

interface ProgressStreakTrackerProps {
  entries: Array<{
    date: string;
    value: number;
  }>;
  dailyGoal: number;
  trackerName: string;
}

export const ProgressStreakTracker: React.FC<ProgressStreakTrackerProps> = ({
  entries,
  dailyGoal,
  trackerName
}) => {
  const calculateStreaks = () => {
    const sortedEntries = entries
      .filter(entry => entry.value >= dailyGoal)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Calculate current streak
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const hasEntry = entries.some(entry => 
        entry.date === dateStr && entry.value >= dailyGoal
      );
      
      if (hasEntry) {
        if (i === 0 || currentStreak > 0) {
          currentStreak++;
        }
      } else if (i === 0) {
        // Check yesterday for current streak
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const hasYesterday = entries.some(entry => 
          entry.date === yesterdayStr && entry.value >= dailyGoal
        );
        if (hasYesterday) {
          currentStreak = 1;
          for (let j = 1; j < 30; j++) {
            const prevDate = new Date(yesterday);
            prevDate.setDate(prevDate.getDate() - j);
            const prevDateStr = prevDate.toISOString().split('T')[0];
            const hasPrevEntry = entries.some(entry => 
              entry.date === prevDateStr && entry.value >= dailyGoal
            );
            if (hasPrevEntry) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
        break;
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (let i = 0; i < sortedEntries.length; i++) {
      const currentDate = new Date(sortedEntries[i].date);
      tempStreak = 1;
      
      for (let j = i + 1; j < sortedEntries.length; j++) {
        const nextDate = new Date(sortedEntries[j].date);
        const dayDiff = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === tempStreak) {
          tempStreak++;
        } else {
          break;
        }
      }
      
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { currentStreak, longestStreak };
  };

  const { currentStreak, longestStreak } = calculateStreaks();
  
  const getStreakBadge = (streak: number) => {
    if (streak >= 30) return { color: 'bg-purple-500', text: 'Legendary' };
    if (streak >= 14) return { color: 'bg-yellow-500', text: 'Amazing' };
    if (streak >= 7) return { color: 'bg-green-500', text: 'Great' };
    if (streak >= 3) return { color: 'bg-blue-500', text: 'Good' };
    return { color: 'bg-gray-500', text: 'Building' };
  };

  const currentBadge = getStreakBadge(currentStreak);
  const longestBadge = getStreakBadge(longestStreak);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Streak Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Current Streak</span>
            </div>
            <div className="text-2xl font-bold">{currentStreak} days</div>
            <Badge className={`${currentBadge.color} text-white mt-1`}>
              {currentBadge.text}
            </Badge>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">Best Streak</span>
            </div>
            <div className="text-2xl font-bold">{longestStreak} days</div>
            <Badge className={`${longestBadge.color} text-white mt-1`}>
              {longestBadge.text}
            </Badge>
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-600">
          {currentStreak > 0 
            ? `Keep it up! You're doing great with your ${trackerName.toLowerCase()}.`
            : `Start your streak today by reaching your ${trackerName.toLowerCase()} goal!`
          }
        </div>
      </CardContent>
    </Card>
  );
};