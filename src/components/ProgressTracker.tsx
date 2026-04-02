import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Plus, Target, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ProgressEntry {
  id: string;
  date: string;
  value: number;
}

interface ProgressTracker {
  id: string;
  tracker_name: string;
  daily_goal: number;
  unit: string;
}

interface ProgressTrackerProps {
  trackerName: string;
  onBack: () => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ trackerName, onBack }) => {
  const [tracker, setTracker] = useState<ProgressTracker | null>(null);
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [goalValue, setGoalValue] = useState('');
  const [entryValue, setEntryValue] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    loadTracker();
  }, [trackerName]);

  const loadTracker = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or create tracker
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

      // Load entries for current month
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const { data: entriesData } = await supabase
        .from('progress_entries')
        .select('*')
        .eq('tracker_id', existingTracker?.id)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('date', { ascending: false });

      setEntries(entriesData || []);
    } catch (error) {
      console.error('Error loading tracker:', error);
    }
  };

  const getDefaultUnit = (name: string) => {
    if (name.toLowerCase().includes('water')) return 'oz';
    if (name.toLowerCase().includes('weight')) return 'lbs';
    if (name.toLowerCase().includes('step')) return 'steps';
    if (name.toLowerCase().includes('calorie')) return 'calories';
    return 'units';
  };

  const getGoalLabel = (name: string) => {
    if (name.toLowerCase().includes('weight')) return 'Goal';
    return 'Daily Goal';
  };

  const saveGoal = async () => {
    if (!tracker || !goalValue) return;

    try {
      const updatedUnit = getDefaultUnit(trackerName);
      await supabase
        .from('progress_trackers')
        .update({ 
          daily_goal: parseFloat(goalValue),
          unit: updatedUnit
        })
        .eq('id', tracker.id);

      setTracker({ ...tracker, daily_goal: parseFloat(goalValue), unit: updatedUnit });
      setShowGoalDialog(false);
      toast({ title: 'Goal updated successfully!' });
    } catch (error) {
      toast({ title: 'Error updating goal', variant: 'destructive' });
    }
  };

  const saveEntry = async () => {
    if (!tracker || !entryValue) return;

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('progress_entries')
        .upsert({
          tracker_id: tracker.id,
          user_id: user?.id,
          date: dateStr,
          value: parseFloat(entryValue)
        });

      setShowEntryDialog(false);
      setEntryValue('');
      loadTracker();
      toast({ title: 'Entry saved successfully!' });
    } catch (error) {
      toast({ title: 'Error saving entry', variant: 'destructive' });
    }
  };

  const getEntryForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return entries.find(entry => entry.date === dateStr);
  };

  const getProgressPercentage = (value: number) => {
    if (!tracker?.daily_goal) return 0;
    return Math.min((value / tracker.daily_goal) * 100, 100);
  };

  const renderCalendarDay = (date: Date) => {
    const entry = getEntryForDate(date);
    const percentage = entry ? getProgressPercentage(entry.value) : 0;
    
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-1">
        <span className="text-sm">{date.getDate()}</span>
        {entry && (
          <div className="w-4 h-1 bg-gray-200 rounded mt-1">
            <div 
              className={`h-full rounded ${
                percentage >= 100 ? 'bg-green-500' : 
                percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(percentage, 10)}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  if (!tracker) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">{trackerName}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {getGoalLabel(trackerName)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {tracker.daily_goal} {tracker.unit}
            </div>
            <Button onClick={() => setShowGoalDialog(true)}>
              Set Goal
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Log Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => {
              setSelectedDate(new Date());
              setShowEntryDialog(true);
            }}>
              Add Entry
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Monthly Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            components={{
              Day: ({ date }) => renderCalendarDay(date)
            }}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set {getGoalLabel(trackerName)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Goal ({tracker.unit})</Label>
              <Input
                type="number"
                value={goalValue}
                onChange={(e) => setGoalValue(e.target.value)}
                placeholder="Enter goal"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveGoal}>Save Goal</Button>
              <Button variant="outline" onClick={() => setShowGoalDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Entry for {selectedDate.toLocaleDateString()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Value ({tracker.unit})</Label>
              <Input
                type="number"
                value={entryValue}
                onChange={(e) => setEntryValue(e.target.value)}
                placeholder="Enter value"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveEntry}>Save Entry</Button>
              <Button variant="outline" onClick={() => setShowEntryDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};