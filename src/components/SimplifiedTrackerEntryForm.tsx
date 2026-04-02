import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Droplets, Scale, Activity, Utensils } from 'lucide-react';

interface TrackerEntryFormProps {
  trackerName: string;
  unit: string;
  onSubmit: (data: {
    value: number;
    date: Date;
    notes?: string;
    mealTag?: string;
  }) => void;
  isLoading?: boolean;
}

export const SimplifiedTrackerEntryForm: React.FC<TrackerEntryFormProps> = ({
  trackerName,
  unit,
  onSubmit,
  isLoading = false
}) => {
  const [value, setValue] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [mealTag, setMealTag] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const isCalorieTracker = trackerName.toLowerCase().includes('calorie');
  const isWeightTracker = trackerName.toLowerCase().includes('weight');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;

    onSubmit({
      value: parseFloat(value),
      date,
      notes: notes.trim() || undefined,
      mealTag: mealTag || undefined
    });

    setValue('');
    setNotes('');
    setMealTag('');
  };

  const getTrackerIcon = () => {
    if (trackerName.toLowerCase().includes('water')) return <Droplets className="w-5 h-5 text-blue-600" />;
    if (trackerName.toLowerCase().includes('weight')) return <Scale className="w-5 h-5 text-purple-600" />;
    if (trackerName.toLowerCase().includes('step')) return <Activity className="w-5 h-5 text-green-600" />;
    if (trackerName.toLowerCase().includes('calorie')) return <Utensils className="w-5 h-5 text-orange-600" />;
    return <Droplets className="w-5 h-5 text-blue-600" />;
  };

  const getCardStyle = () => {
    if (trackerName.toLowerCase().includes('water')) return 'bg-blue-50 border-blue-200';
    if (trackerName.toLowerCase().includes('weight')) return 'bg-purple-50 border-purple-200';
    if (trackerName.toLowerCase().includes('step')) return 'bg-green-50 border-green-200';
    if (trackerName.toLowerCase().includes('calorie')) return 'bg-orange-50 border-orange-200';
    return 'bg-blue-50 border-blue-200';
  };

  const getPlaceholder = () => {
    if (trackerName.toLowerCase().includes('water')) return 'e.g., 16';
    if (trackerName.toLowerCase().includes('weight')) return 'e.g., 150.5';
    if (trackerName.toLowerCase().includes('step')) return 'e.g., 8000';
    if (trackerName.toLowerCase().includes('calorie')) return 'e.g., 350';
    return 'Enter amount';
  };

  const getSimpleTrackerName = () => {
    if (trackerName.toLowerCase().includes('water')) return 'Water Tracker';
    if (trackerName.toLowerCase().includes('weight')) return 'Weight Tracker';
    if (trackerName.toLowerCase().includes('step')) return 'Step Tracker';
    if (trackerName.toLowerCase().includes('calorie')) return 'Calorie Tracker';
    return trackerName;
  };

  return (
    <Card className={`${getCardStyle()} shadow-sm`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg font-medium text-gray-800">
          {getTrackerIcon()}
          <span>Log {getSimpleTrackerName()}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value" className="text-sm font-medium text-gray-700">
                Amount ({unit})
              </Label>
              <Input
                id="value"
                type="number"
                step="0.1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={getPlaceholder()}
                className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                required
              />
              <p className="text-xs text-gray-500">Enter how much you want to log today</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-10 justify-start text-left font-normal border-gray-300"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">
                      {date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      if (selectedDate) {
                        setDate(selectedDate);
                        setShowCalendar(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {isCalorieTracker && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Meal Type</Label>
              <Select value={mealTag} onValueChange={setMealTag}>
                <SelectTrigger className="h-10 border-gray-300">
                  <SelectValue placeholder="Select meal type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {(isWeightTracker || isCalorieTracker) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isWeightTracker 
                    ? "How are you feeling? Any observations..." 
                    : "What did you eat? How did it taste..."
                }
                className="min-h-[60px] resize-none border-gray-300 focus:border-blue-500"
                rows={2}
              />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-11 text-base font-medium bg-blue-600 hover:bg-blue-700 shadow-sm"
            disabled={isLoading || !value}
          >
            {isLoading ? 'Saving...' : `Log ${getSimpleTrackerName()}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};