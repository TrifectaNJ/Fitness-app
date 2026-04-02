import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
// import { format } from 'date-fns';

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

export const TrackerEntryForm: React.FC<TrackerEntryFormProps> = ({
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

    // Reset form
    setValue('');
    setNotes('');
    setMealTag('');
  };

  const getPlaceholder = () => {
    if (trackerName.toLowerCase().includes('water')) return 'Enter amount in oz/ml';
    if (trackerName.toLowerCase().includes('weight')) return 'Enter weight';
    if (trackerName.toLowerCase().includes('step')) return 'Enter step count';
    if (trackerName.toLowerCase().includes('calorie')) return 'Enter calories';
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
    <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-900">
          <Plus className="w-5 h-5" />
          Log {trackerName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">
                {trackerName} ({unit})
              </Label>
              <Input
                id="value"
                type="number"
                step="0.1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={getPlaceholder()}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
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
              <Label>Meal Tag (Optional)</Label>
              <Select value={mealTag} onValueChange={setMealTag}>
                <SelectTrigger>
                  <SelectValue placeholder="Select meal type" />
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
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isWeightTracker 
                    ? "Add notes about your weight measurement..." 
                    : "Add notes about this meal..."
                }
                rows={2}
              />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isLoading || !value}
          >
            {isLoading ? 'Saving...' : `Log ${trackerName}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};