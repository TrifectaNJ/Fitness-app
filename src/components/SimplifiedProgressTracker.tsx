import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart3, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { SimplifiedTrackerSummaryCard } from './SimplifiedTrackerSummaryCard';
import { ProgressChart } from './ProgressChart';
import { SimplifiedTrackerEntryForm } from './SimplifiedTrackerEntryForm';
import { ProgressStreakTracker } from './ProgressStreakTracker';
import { SimplifiedTrackerGoalCard } from './SimplifiedTrackerGoalCard';

interface ProgressEntry {
  id: string;
  date: string;
  value: number;
  notes?: string;
  meal_tag?: string;
}

interface ProgressTracker {
  id: string;
  tracker_name: string;
  daily_goal: number;
  unit: string;
}

interface SimplifiedProgressTrackerProps {
  trackerName: string;
  onBack: () => void;
}

export const SimplifiedProgressTracker: React.FC<SimplifiedProgressTrackerProps> = ({ 
  trackerName, 
  onBack 
}) => {
  const [tracker, setTracker] = useState<ProgressTracker | null>(null);
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({
    daysGoalMet: 0,
    totalDays: 7,
    averageValue: 0,
    weeklyChange: 0,
    unit: ''
  });
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [goalValue, setGoalValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTracker();
  }, [trackerName]);

  const getSimpleTrackerName = () => {
    if (trackerName.toLowerCase().includes('water')) return 'Water Tracker';
    if (trackerName.toLowerCase().includes('weight')) return 'Weight Tracker';
    if (trackerName.toLowerCase().includes('step')) return 'Step Tracker';
    if (trackerName.toLowerCase().includes('calorie')) return 'Calorie Tracker';
    return trackerName;
  };

  const loadTracker = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let { data: existingTracker } = await supabase
        .from('progress_trackers')
        .select('*')
        .eq('user_id', user.id)
        .eq('tracker_name', trackerName)
        .single();

      if (!existingTracker) {
        const unit = getDefaultUnit(trackerName);
        const { data: newTracker } = await supabase
          .from('progress_trackers')
          .insert({
            user_id: user.id,
            tracker_name: trackerName,
            daily_goal: 0,
            unit
          })
          .select()
          .single();
        existingTracker = newTracker;
      }

      setTracker(existingTracker);
      setGoalValue(existingTracker?.daily_goal?.toString() || '');

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      
      const { data: entriesData } = await supabase
        .from('progress_entries')
        .select('*')
        .eq('tracker_id', existingTracker?.id)
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .order('date', { ascending: true });

      setEntries(entriesData || []);
      calculateWeeklyStats(entriesData || [], existingTracker);
    } catch (error) {
      console.error('Error loading tracker:', error);
    }
  };

  const calculateWeeklyStats = (entriesData: ProgressEntry[], trackerData: ProgressTracker) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekEntries = entriesData.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekAgo && entryDate <= now;
    });

    const daysGoalMet = weekEntries.filter(entry => 
      entry.value >= trackerData.daily_goal
    ).length;

    const averageValue = weekEntries.length > 0 
      ? weekEntries.reduce((sum, entry) => sum + entry.value, 0) / weekEntries.length
      : 0;

    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const previousWeekEntries = entriesData.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= twoWeeksAgo && entryDate < weekAgo;
    });

    const previousWeekAverage = previousWeekEntries.length > 0
      ? previousWeekEntries.reduce((sum, entry) => sum + entry.value, 0) / previousWeekEntries.length
      : 0;

    const weeklyChange = averageValue - previousWeekAverage;

    setWeeklyStats({
      daysGoalMet,
      totalDays: 7,
      averageValue,
      weeklyChange,
      unit: trackerData.unit
    });
  };

  const getDefaultUnit = (name: string) => {
    if (name.toLowerCase().includes('water')) return 'oz';
    if (name.toLowerCase().includes('weight')) return 'lbs';
    if (name.toLowerCase().includes('step')) return 'steps';
    if (name.toLowerCase().includes('calorie')) return 'calories';
    return 'units';
  };

  const saveGoal = async () => {
    if (!tracker || !goalValue) return;

    try {
      await supabase
        .from('progress_trackers')
        .update({ daily_goal: parseFloat(goalValue) })
        .eq('id', tracker.id);

      setTracker({ ...tracker, daily_goal: parseFloat(goalValue) });
      setShowGoalDialog(false);
      toast({ title: 'Goal updated successfully!' });
      loadTracker();
    } catch (error) {
      toast({ title: 'Error updating goal', variant: 'destructive' });
    }
  };

  const handleEntrySubmit = async (entryData: {
    value: number;
    date: Date;
    notes?: string;
    mealTag?: string;
  }) => {
    if (!tracker) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const dateStr = entryData.date.toISOString().split('T')[0];
      
      await supabase
        .from('progress_entries')
        .upsert({
          tracker_id: tracker.id,
          user_id: user?.id,
          date: dateStr,
          value: entryData.value,
          notes: entryData.notes,
          meal_tag: entryData.mealTag
        });

      toast({ title: 'Entry saved successfully!' });
      loadTracker();
    } catch (error) {
      toast({ title: 'Error saving entry', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = entries.map(entry => ({
    date: entry.date,
    value: entry.value,
    goalMet: tracker ? entry.value >= tracker.daily_goal : false
  }));

  if (!tracker) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack} className="hover:bg-white/80">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{getSimpleTrackerName()}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <SimplifiedTrackerSummaryCard 
            trackerName={trackerName}
            weeklyStats={weeklyStats}
          />
        </div>
        <div>
          <ProgressStreakTracker
            entries={entries}
            dailyGoal={tracker.daily_goal}
            trackerName={trackerName}
          />
        </div>
      </div>

      <Tabs defaultValue="log" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-white border border-gray-200 rounded-lg p-1">
          <TabsTrigger value="log" className="font-medium">Log Entry</TabsTrigger>
          <TabsTrigger value="chart" className="font-medium">
            <BarChart3 className="w-4 h-4 mr-2" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="calendar" className="font-medium">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimplifiedTrackerEntryForm
              trackerName={trackerName}
              unit={tracker.unit}
              onSubmit={handleEntrySubmit}
              isLoading={isLoading}
            />
            
            <SimplifiedTrackerGoalCard
              trackerName={trackerName}
              dailyGoal={tracker.daily_goal}
              unit={tracker.unit}
              onUpdateGoal={() => setShowGoalDialog(true)}
            />
          </div>
        </TabsContent>

        <TabsContent value="chart" className="mt-6">
          <ProgressChart
            data={chartData}
            trackerName={getSimpleTrackerName()}
            unit={tracker.unit}
            dailyGoal={tracker.daily_goal}
            chartType={trackerName.toLowerCase().includes('weight') ? 'line' : 'bar'}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">Monthly Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Calendar view coming soon!</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Set Daily Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Goal ({tracker.unit})</Label>
              <Input
                type="number"
                value={goalValue}
                onChange={(e) => setGoalValue(e.target.value)}
                placeholder="Enter your daily goal"
                className="h-11"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={saveGoal} className="flex-1">
                Save Goal
              </Button>
              <Button variant="outline" onClick={() => setShowGoalDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};