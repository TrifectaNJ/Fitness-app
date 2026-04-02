import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Droplets, Scale, Activity, Utensils, Sparkles } from 'lucide-react';

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

export const TrackerEntryFormRedesigned: React.FC<TrackerEntryFormProps> = ({
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
    if (trackerName.toLowerCase().includes('water')) return <Droplets className="w-5 h-5 text-blue-500" />;
    if (trackerName.toLowerCase().includes('weight')) return <Scale className="w-5 h-5 text-purple-500" />;
    if (trackerName.toLowerCase().includes('step')) return <Activity className="w-5 h-5 text-green-500" />;
    if (trackerName.toLowerCase().includes('calorie')) return <Utensils className="w-5 h-5 text-orange-500" />;
    return <Sparkles className="w-5 h-5 text-indigo-500" />;
  };

  const getGradientClass = () => {
    if (trackerName.toLowerCase().includes('water')) return 'from-blue-50 via-blue-50 to-cyan-50 border-blue-100';
    if (trackerName.toLowerCase().includes('weight')) return 'from-purple-50 via-purple-50 to-pink-50 border-purple-100';
    if (trackerName.toLowerCase().includes('step')) return 'from-green-50 via-green-50 to-emerald-50 border-green-100';
    if (trackerName.toLowerCase().includes('calorie')) return 'from-orange-50 via-orange-50 to-amber-50 border-orange-100';
    return 'from-indigo-50 via-indigo-50 to-blue-50 border-indigo-100';
  };

  const getPlaceholder = () => {
    if (trackerName.toLowerCase().includes('water')) return 'e.g., 16';
    if (trackerName.toLowerCase().includes('weight')) return 'e.g., 150.5';
    if (trackerName.toLowerCase().includes('step')) return 'e.g., 8000';
    if (trackerName.toLowerCase().includes('calorie')) return 'e.g., 350';
    return `Enter ${trackerName.toLowerCase()}`;
  };

  const mealOptions = [
    'Breakfast',
    'Lunch', 
    'Dinner',
    'Snack',
    'Pre-workout',
    'Post-workout'
  ];

  return (
    <Card className={`bg-gradient-to-br ${getGradientClass()} shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
          {getTrackerIcon()}
          <span>Log {trackerName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="h-11 text-base border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-11 justify-start text-left font-normal border-gray-200 hover:border-gray-300"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">
                      {date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
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
                <SelectTrigger className="h-11 border-gray-200 focus:border-blue-400">
                  <SelectValue placeholder="Select meal type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {mealOptions.map((meal) => (
                    <SelectItem key={meal} value={meal.toLowerCase()}>
                      {meal}
                    </SelectItem>
                  ))}
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
                className="min-h-[80px] resize-none border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                rows={3}
              />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
            disabled={isLoading || !value}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              `Log ${trackerName}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};