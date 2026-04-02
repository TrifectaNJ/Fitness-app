import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BarChart3, Target, Calendar, ArrowLeft, Droplets, Scale, Activity, Utensils } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { BeginnerFriendlyTrackerSummary } from './BeginnerFriendlyTrackerSummary';
import { ProgressChart } from './ProgressChart';
import { BeginnerFriendlyTrackerEntry } from './BeginnerFriendlyTrackerEntry';
import { BeginnerFriendlyTrackerGoal } from './BeginnerFriendlyTrackerGoal';

interface TrackerData {
  id: string;
  value: number;
  date: string;
  notes?: string;
  meal_tag?: string;
  created_at: string;
}

interface TrackerConfig {
  name: string;
  unit: string;
  defaultGoal: number;
  icon: React.ReactNode;
  emoji: string;
  bgColor: string;
  borderColor: string;
}

const TRACKER_CONFIGS: Record<string, TrackerConfig> = {
  water: {
    name: 'Water Tracker',
    unit: 'oz',
    defaultGoal: 64,
    icon: <Droplets className="w-6 h-6 text-blue-600" />,
    emoji: '💧',
    bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
    borderColor: 'border-blue-200'
  },
  weight: {
    name: 'Weight Tracker',
    unit: 'lbs',
    defaultGoal: 150,
    icon: <Scale className="w-6 h-6 text-purple-600" />,
    emoji: '⚖️',
    bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
    borderColor: 'border-purple-200'
  },
  steps: {
    name: 'Step Tracker',
    unit: 'steps',
    defaultGoal: 8000,
    icon: <Activity className="w-6 h-6 text-green-600" />,
    emoji: '👟',
    bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
    borderColor: 'border-green-200'
  },
  calories: {
    name: 'Calorie Tracker',
    unit: 'calories',
    defaultGoal: 2000,
    icon: <Utensils className="w-6 h-6 text-orange-600" />,
    emoji: '🍎',
    bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
    borderColor: 'border-orange-200'
  }
};

interface BeginnerFriendlyProgressTrackerProps {
  trackerName: string;
  userId: string;
  onBack?: () => void;
}

export const BeginnerFriendlyProgressTracker: React.FC<BeginnerFriendlyProgressTrackerProps> = ({
  trackerName,
  userId,
  onBack
}) => {
  const [trackerData, setTrackerData] = useState<TrackerData[]>([]);
  const [dailyGoal, setDailyGoal] = useState(0);
  const [trackerId, setTrackerId] = useState<string | null>(null);
  const [effectiveUserId, setEffectiveUserId] = useState(userId);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('add');
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState('');
  const { toast } = useToast();

  const normalizeTrackerName = (name: string) => {
    const normalized = name.toLowerCase().replace(/\s+tracker$/i, '').trim();
    if (normalized === 'step') return 'steps';
    if (normalized === 'calorie') return 'calories';
    return normalized;
  };

  const normalizedTrackerName = normalizeTrackerName(trackerName);
  const config = TRACKER_CONFIGS[normalizedTrackerName] || TRACKER_CONFIGS.water;
  const isWeightTracker = normalizedTrackerName === 'weight';

  useEffect(() => {
    initializeTracker();
  }, [trackerName, userId]);

  const initializeTracker = async () => {
    try {
      // Resolve actual user ID — never fall back to 'anonymous'
      let resolvedUserId = userId;
      if (!resolvedUserId || resolvedUserId === 'anonymous') {
        const { data: { user } } = await supabase.auth.getUser();
        resolvedUserId = user?.id || '';
      }
      if (!resolvedUserId) return;
      setEffectiveUserId(resolvedUserId);

      let { data: existingTracker, error: trackerError } = await supabase
        .from('progress_trackers')
        .select('*')
        .eq('user_id', resolvedUserId)
        .eq('tracker_name', normalizedTrackerName)
        .single();

      if (trackerError && trackerError.code !== 'PGRST116') throw trackerError;

      if (!existingTracker) {
        const { data: newTracker, error: createError } = await supabase
          .from('progress_trackers')
          .insert({
            user_id: resolvedUserId,
            tracker_name: normalizedTrackerName,
            daily_goal: config.defaultGoal,
            unit: config.unit,
            current_value: 0
          })
          .select()
          .single();

        if (createError) throw createError;
        existingTracker = newTracker;
      }

      setTrackerId(existingTracker.id);
      setDailyGoal(existingTracker.daily_goal || config.defaultGoal);
      await fetchTrackerEntries(existingTracker.id, resolvedUserId);
    } catch (error) {
      console.error('Error initializing tracker:', error);
      toast({
        title: "Error",
        description: "Failed to initialize tracker. Please try again.",
        variant: "destructive"
      });
    }
  };

  const fetchTrackerEntries = async (trackerIdToUse: string, uid?: string) => {
    try {
      const { data, error } = await supabase
        .from('progress_entries')
        .select('*')
        .eq('tracker_id', trackerIdToUse)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTrackerData(data || []);
    } catch (error) {
      console.error('Error fetching tracker entries:', error);
    }
  };

  const handleSubmitEntry = async (entryData: {
    value: number;
    date: Date;
    notes?: string;
    mealTag?: string;
  }) => {
    if (!trackerId) {
      toast({ title: "Error", description: "Tracker not initialized. Please refresh.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('progress_entries')
        .insert({
          tracker_id: trackerId,
          user_id: effectiveUserId,
          date: entryData.date.toISOString().split('T')[0],
          value: entryData.value,
          notes: entryData.notes || null,
          meal_tag: entryData.mealTag || null
        });

      if (error) throw error;

      toast({
        title: "Entry Added! 🎉",
        description: `Successfully logged ${entryData.value} ${config.unit}`,
      });

      // Check if today's goal was just reached
      const entryDateStr = entryData.date.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      if (!isWeightTracker && dailyGoal > 0 && entryDateStr === todayStr) {
        const prevTotal = trackerData
          .filter(e => e.date === todayStr)
          .reduce((sum, e) => sum + e.value, 0);
        const newTotal = prevTotal + entryData.value;
        if (prevTotal < dailyGoal && newTotal >= dailyGoal) {
          setTimeout(() => {
            toast({
              title: `🏆 Daily Goal Reached!`,
              description: `You hit your ${config.name} goal of ${dailyGoal} ${config.unit} today!`,
            });
          }, 600);
        }
      }

      await fetchTrackerEntries(trackerId, effectiveUserId);
      setActiveTab('progress');
    } catch (error) {
      console.error('Error submitting entry:', error);
      toast({ title: "Error", description: "Failed to save your entry. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!trackerId) return;
    try {
      const { error } = await supabase
        .from('progress_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', effectiveUserId);

      if (error) throw error;

      await fetchTrackerEntries(trackerId, effectiveUserId);
      toast({ title: "Entry deleted" });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({ title: "Error", description: "Failed to delete entry.", variant: "destructive" });
    }
  };

  const handleUpdateGoal = () => {
    setNewGoalInput(dailyGoal.toString());
    setShowGoalDialog(true);
  };

  const handleSaveGoal = async () => {
    if (!trackerId || !newGoalInput || isNaN(Number(newGoalInput))) return;
    const newGoal = Number(newGoalInput);
    try {
      const { error } = await supabase
        .from('progress_trackers')
        .update({ daily_goal: newGoal, updated_at: new Date().toISOString() })
        .eq('id', trackerId);
      if (error) throw error;
      setDailyGoal(newGoal);
      setShowGoalDialog(false);
      toast({
        title: "Goal Updated! 🎯",
        description: isWeightTracker
          ? `Your target weight is now ${newGoal} lbs`
          : `Your daily goal is now ${newGoal} ${config.unit}`,
      });
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({ title: "Error", description: "Failed to update your goal.", variant: "destructive" });
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayEntries = trackerData.filter(e => e.date === today);

  const calculateWeeklyStats = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    if (isWeightTracker) {
      // For weight: use latest reading per day, show trend toward goal
      const entriesByDay = last7Days.map(date => {
        const dayEntries = trackerData.filter(e => e.date === date);
        // Use last entry of the day (most recent weigh-in)
        return dayEntries.length > 0 ? dayEntries[dayEntries.length - 1].value : null;
      }).filter(v => v !== null) as number[];

      const currentWeight = entriesByDay[0] ?? null;
      const daysLogged = entriesByDay.length;

      // Previous week for trend
      const prevWeekEntries = trackerData.filter(e => {
        const d = new Date(e.date);
        const daysAgo = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
        return daysAgo >= 7 && daysAgo < 14;
      });
      const prevWeekLatest = prevWeekEntries.length > 0
        ? prevWeekEntries[prevWeekEntries.length - 1].value
        : null;

      const weeklyChange = currentWeight !== null && prevWeekLatest !== null
        ? currentWeight - prevWeekLatest
        : 0;

      return {
        daysGoalMet: daysLogged,
        totalDays: 7,
        averageValue: currentWeight ?? 0,
        weeklyChange,
        unit: config.unit,
        isWeightTracker: true,
        currentWeight,
        goalWeight: dailyGoal,
        daysLogged
      };
    }

    // Water / steps / calories: sum per day
    const weekData = last7Days.map(date => {
      const dayTotal = trackerData
        .filter(e => e.date === date)
        .reduce((sum, e) => sum + e.value, 0);
      return { date, value: dayTotal, goalMet: dayTotal >= dailyGoal };
    });

    const daysGoalMet = weekData.filter(d => d.goalMet).length;
    const averageValue = weekData.reduce((sum, d) => sum + d.value, 0) / 7;

    const lastWeekData = trackerData.filter(e => {
      const d = new Date(e.date);
      const daysAgo = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
      return daysAgo >= 7 && daysAgo < 14;
    });
    const lastWeekAvg = lastWeekData.length > 0
      ? lastWeekData.reduce((sum, e) => sum + e.value, 0) / 7
      : 0;

    return {
      daysGoalMet,
      totalDays: 7,
      averageValue,
      weeklyChange: averageValue - lastWeekAvg,
      unit: config.unit,
      isWeightTracker: false,
      currentWeight: null,
      goalWeight: dailyGoal,
      daysLogged: weekData.filter(d => d.value > 0).length
    };
  };

  const weeklyStats = calculateWeeklyStats();

  const goalLabel = isWeightTracker ? 'target weight (lbs)' : `daily ${config.unit} goal`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update {isWeightTracker ? 'Target Weight' : 'Daily Goal'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-3">Enter your new {goalLabel}:</p>
            <Input
              type="number"
              step="0.1"
              value={newGoalInput}
              onChange={e => setNewGoalInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveGoal()}
              className="text-lg font-semibold text-center h-12"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveGoal} disabled={!newGoalInput || isNaN(Number(newGoalInput))}>
              Save Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {onBack && (
        <Button
          onClick={onBack}
          variant="outline"
          className="flex items-center gap-2 mb-6 hover:bg-gray-50 transition-colors border-2 border-gray-300 h-12 px-6 font-semibold rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Button>
      )}

      <Card className={`${config.bgColor} ${config.borderColor} border-2 shadow-xl`}>
        <CardHeader className="pb-6 text-center">
          <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold text-gray-800">
            <span className="text-3xl">{config.emoji}</span>
            <span>{config.name}</span>
          </CardTitle>
          <p className="text-gray-600 text-base mt-2">Track your daily progress and reach your goals</p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-14 bg-white/60 rounded-xl border border-gray-200">
              <TabsTrigger value="add" className="flex items-center gap-2 text-base font-semibold h-12 rounded-lg">
                <Plus className="w-5 h-5" />
                Add Entry
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2 text-base font-semibold h-12 rounded-lg">
                <BarChart3 className="w-5 h-5" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="goal" className="flex items-center gap-2 text-base font-semibold h-12 rounded-lg">
                <Target className="w-5 h-5" />
                Goal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="space-y-4">
              <BeginnerFriendlyTrackerEntry
                trackerName={trackerName}
                unit={config.unit}
                onSubmit={handleSubmitEntry}
                isLoading={isLoading}
                todayEntries={todayEntries}
                onDeleteEntry={handleDeleteEntry}
              />
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <BeginnerFriendlyTrackerSummary
                trackerName={trackerName}
                weeklyStats={weeklyStats}
              />

              {trackerData.length > 0 && (
                <Card className="bg-white/70 border-2 border-gray-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                      <Calendar className="w-6 h-6" />
                      30-Day Progress Chart
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProgressChart
                      data={trackerData}
                      trackerName={trackerName}
                      unit={config.unit}
                      dailyGoal={dailyGoal}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="goal" className="space-y-4">
              <BeginnerFriendlyTrackerGoal
                trackerName={trackerName}
                dailyGoal={dailyGoal}
                unit={config.unit}
                onUpdateGoal={handleUpdateGoal}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
