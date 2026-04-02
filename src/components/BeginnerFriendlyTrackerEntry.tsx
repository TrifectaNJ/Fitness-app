import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Droplets, Scale, Activity, Utensils, Plus, Trash2 } from 'lucide-react';

interface TodayEntry {
  id: string;
  value: number;
  notes?: string;
  meal_tag?: string;
  created_at: string;
}

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
  todayEntries?: TodayEntry[];
  onDeleteEntry?: (id: string) => void;
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: '🌅 Breakfast',
  lunch: '☀️ Lunch',
  dinner: '🌙 Dinner',
  snack: '🍿 Snack'
};

export const BeginnerFriendlyTrackerEntry: React.FC<TrackerEntryFormProps> = ({
  trackerName,
  unit,
  onSubmit,
  isLoading = false,
  todayEntries = [],
  onDeleteEntry
}) => {
  const [value, setValue] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [mealTag, setMealTag] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const isCalorieTracker = trackerName.toLowerCase().includes('calorie');
  const isWaterTracker = trackerName.toLowerCase().includes('water');
  const isWeightTracker = trackerName.toLowerCase().includes('weight');
  const isStepTracker = trackerName.toLowerCase().includes('step');

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

  const getTrackerConfig = () => {
    if (isWaterTracker) return {
      name: 'Water',
      icon: <Droplets className="w-6 h-6 text-blue-600" />,
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      totalColor: 'text-blue-600 bg-blue-50',
      placeholder: '16',
      example: 'e.g., 16 oz',
      hint: 'Enter how much water you drank (in oz)',
      emoji: '💧',
      inputLabel: 'Water Intake (oz)'
    };
    if (isWeightTracker) return {
      name: 'Weight',
      icon: <Scale className="w-6 h-6 text-purple-600" />,
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      totalColor: 'text-purple-600 bg-purple-50',
      placeholder: '150',
      example: 'e.g., 150 lbs',
      hint: 'Enter your current weight (in lbs)',
      emoji: '⚖️',
      inputLabel: 'Current Weight (lbs)'
    };
    if (isStepTracker) return {
      name: 'Steps',
      icon: <Activity className="w-6 h-6 text-green-600" />,
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-200',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      totalColor: 'text-green-600 bg-green-50',
      placeholder: '8000',
      example: 'e.g., 8000 steps',
      hint: 'Enter how many steps you took today',
      emoji: '👟',
      inputLabel: 'Steps Taken'
    };
    if (isCalorieTracker) return {
      name: 'Calories',
      icon: <Utensils className="w-6 h-6 text-orange-600" />,
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      borderColor: 'border-orange-200',
      buttonColor: 'bg-orange-600 hover:bg-orange-700',
      totalColor: 'text-orange-600 bg-orange-50',
      placeholder: '350',
      example: 'e.g., 350 calories',
      hint: 'Enter calories for this meal or snack',
      emoji: '🍎',
      inputLabel: 'Calories Eaten'
    };
    return {
      name: trackerName,
      icon: <Plus className="w-6 h-6 text-gray-600" />,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      buttonColor: 'bg-gray-600 hover:bg-gray-700',
      totalColor: 'text-gray-700 bg-gray-100',
      placeholder: '0',
      example: `Enter ${unit}`,
      hint: `Enter your ${trackerName.toLowerCase()} amount`,
      emoji: '📊',
      inputLabel: `Amount (${unit})`
    };
  };

  const config = getTrackerConfig();

  const renderTodayLog = () => {
    if (todayEntries.length === 0) return null;

    if (isCalorieTracker) {
      const grouped: Record<string, TodayEntry[]> = {};
      const untagged: TodayEntry[] = [];
      todayEntries.forEach(e => {
        if (e.meal_tag) {
          if (!grouped[e.meal_tag]) grouped[e.meal_tag] = [];
          grouped[e.meal_tag].push(e);
        } else {
          untagged.push(e);
        }
      });

      const totalCalories = todayEntries.reduce((sum, e) => sum + e.value, 0);
      const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
      const sortedMeals = [
        ...mealOrder.filter(m => grouped[m]),
        ...Object.keys(grouped).filter(m => !mealOrder.includes(m))
      ];

      return (
        <div className="bg-white/70 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-800">Today's Log</span>
            <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              {totalCalories.toLocaleString()} {unit} total
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {sortedMeals.map(meal => {
              const entries = grouped[meal];
              const mealTotal = entries.reduce((sum, e) => sum + e.value, 0);
              return (
                <div key={meal} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700">
                      {MEAL_LABELS[meal] || meal}
                    </span>
                    <span className="text-sm font-medium text-gray-600">{mealTotal} {unit}</span>
                  </div>
                  {entries.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between pl-4 py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-gray-700">{entry.value} {unit}</span>
                        {entry.notes && (
                          <span className="text-xs text-gray-500 truncate">{entry.notes}</span>
                        )}
                      </div>
                      {onDeleteEntry && (
                        <button
                          onClick={() => onDeleteEntry(entry.id)}
                          className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
            {untagged.length > 0 && (
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700">Other</span>
                  <span className="text-sm font-medium text-gray-600">
                    {untagged.reduce((sum, e) => sum + e.value, 0)} {unit}
                  </span>
                </div>
                {untagged.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between pl-4 py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-gray-700">{entry.value} {unit}</span>
                      {entry.notes && (
                        <span className="text-xs text-gray-500 truncate">{entry.notes}</span>
                      )}
                    </div>
                    {onDeleteEntry && (
                      <button
                        onClick={() => onDeleteEntry(entry.id)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Non-calorie trackers
    const total = isWeightTracker ? null : todayEntries.reduce((sum, e) => sum + e.value, 0);
    const latest = isWeightTracker ? todayEntries[todayEntries.length - 1]?.value : null;

    return (
      <div className="bg-white/70 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-semibold text-gray-800">Today's Log</span>
          {total !== null && (
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${config.totalColor}`}>
              {total.toLocaleString()} {unit} total
            </span>
          )}
          {latest !== null && (
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${config.totalColor}`}>
              Latest: {latest} {unit}
            </span>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {todayEntries.map(entry => (
            <div key={entry.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">
                  {entry.value.toLocaleString()} {unit}
                </span>
                {entry.notes && (
                  <span className="text-xs text-gray-500">{entry.notes}</span>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(entry.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
              {onDeleteEntry && (
                <button
                  onClick={() => onDeleteEntry(entry.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderTodayLog()}

      <Card className={`${config.bgColor} ${config.borderColor} border-2 shadow-lg`}>
        <CardHeader className="pb-4 text-center">
          <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold text-gray-800">
            <span className="text-2xl">{config.emoji}</span>
            <span>Add {config.name}</span>
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">Track your daily progress</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main Input */}
            <div className="text-center space-y-3">
              <Label htmlFor="value" className="text-lg font-semibold text-gray-800 block">
                {config.inputLabel}
              </Label>
              <Input
                id="value"
                type="number"
                step="0.1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={config.placeholder}
                className="h-16 text-2xl text-center font-bold border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
                required
              />
              <div className="space-y-1">
                <p className="text-sm text-gray-500 font-medium">{config.example}</p>
                <p className="text-xs text-gray-400">{config.hint}</p>
              </div>
            </div>

            {/* Date and Meal Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Date</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-12 justify-start text-left font-medium border-2 border-gray-300 hover:border-gray-400"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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

              {isCalorieTracker && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Meal</Label>
                  <Select value={mealTag} onValueChange={setMealTag}>
                    <SelectTrigger className="h-12 border-2 border-gray-300">
                      <SelectValue placeholder="Select meal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
                      <SelectItem value="lunch">☀️ Lunch</SelectItem>
                      <SelectItem value="dinner">🌙 Dinner</SelectItem>
                      <SelectItem value="snack">🍿 Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Notes */}
            {(isCalorieTracker || isWeightTracker) && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isCalorieTracker ? "What did you eat?" : "How are you feeling?"}
                  className="min-h-[80px] resize-none border-2 border-gray-300 focus:border-blue-500 rounded-lg"
                  rows={3}
                />
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className={`w-full h-14 text-lg font-bold ${config.buttonColor} shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl`}
              disabled={isLoading || !value}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{config.emoji}</span>
                  Add {config.name}
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
