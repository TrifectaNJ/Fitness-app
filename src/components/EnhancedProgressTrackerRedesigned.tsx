import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart3, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { TrackerSummaryCardRedesigned } from './TrackerSummaryCardRedesigned';
import { ProgressChart } from './ProgressChart';
import { TrackerEntryFormRedesigned } from './TrackerEntryFormRedesigned';
import { ProgressStreakTracker } from './ProgressStreakTracker';
import { TrackerGoalCard } from './TrackerGoalCard';

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

interface EnhancedProgressTrackerProps {
  trackerName: string;
  onBack: () => void;
}

export const EnhancedProgressTrackerRedesigned: React.FC<EnhancedProgressTrackerProps> = ({ 
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTracker();
  }, [trackerName]);

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

      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const { data: entriesData } = await supabase
        .from('progress_entries')
        .select('*')
        .eq('tracker_id', existingTracker?.id)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
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

  const renderCalendarDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const entry = entries.find(e => e.date === dateStr);
    const goalMet = entry && tracker ? entry.value >= tracker.daily_goal : false;
    
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-1">
        <span className="text-sm">{date.getDate()}</span>
        {entry && (
          <div className={`w-2 h-2 rounded-full mt-1 ${
            goalMet ? 'bg-emerald-500' : 'bg-amber-500'
          }`} />
        )}
      </div>
    );
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack} className="hover:bg-white/60">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{trackerName} Tracker</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <TrackerSummaryCardRedesigned 
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
            <TrackerEntryFormRedesigned
              trackerName={trackerName}
              unit={tracker.unit}
              onSubmit={handleEntrySubmit}
              isLoading={isLoading}
            />
            
            <TrackerGoalCard
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
            trackerName={trackerName}
            unit={tracker.unit}
            dailyGoal={tracker.daily_goal}
            chartType={trackerName.toLowerCase().includes('weight') ? 'line' : 'bar'}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <CalendarIcon className="w-5 h-5" />
                Monthly Progress Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                components={{
                  Day: ({ date }) => renderCalendarDay(date)
                }}
                className="rounded-lg border border-gray-200"
              />
              <div className="flex items-center gap-6 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-gray-700">Goal Achieved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-gray-700">Logged but Goal Missed</span>
                </div>
              </div>
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