import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, GripVertical, Calendar } from 'lucide-react';

interface ProgramWeek {
  id: string;
  title: string;
  description: string;
  order: number;
  days: ProgramDay[];
}

interface ProgramDay {
  id: string;
  title: string;
  description: string;
  order: number;
  exercises: ProgramExercise[];
}

interface ProgramExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  duration: string;
  tempo: string;
  rest_seconds: number;
  notes: string;
  order: number;
  superset_group?: string;
}

interface CoachProgramWeekBuilderProps {
  weeks: ProgramWeek[];
  onWeeksChange: (weeks: ProgramWeek[]) => void;
}

export const CoachProgramWeekBuilder: React.FC<CoachProgramWeekBuilderProps> = ({
  weeks,
  onWeeksChange
}) => {
  const [showWeekForm, setShowWeekForm] = useState(false);
  const [editingWeek, setEditingWeek] = useState<ProgramWeek | null>(null);
  const [weekTitle, setWeekTitle] = useState('');
  const [weekDescription, setWeekDescription] = useState('');

  const addWeek = () => {
    const newWeek: ProgramWeek = {
      id: Date.now().toString(),
      title: weekTitle.trim() || `Week ${weeks.length + 1}`,
      description: weekDescription.trim(),
      order: weeks.length,
      days: []
    };
    
    onWeeksChange([...weeks, newWeek]);
    setWeekTitle('');
    setWeekDescription('');
    setShowWeekForm(false);
  };

  const updateWeek = (weekId: string, updates: Partial<ProgramWeek>) => {
    const updatedWeeks = weeks.map(week => 
      week.id === weekId ? { ...week, ...updates } : week
    );
    onWeeksChange(updatedWeeks);
  };

  const deleteWeek = (weekId: string) => {
    const updatedWeeks = weeks.filter(week => week.id !== weekId);
    // Reorder remaining weeks
    const reordered = updatedWeeks.map((week, index) => ({ ...week, order: index }));
    onWeeksChange(reordered);
  };

  const addDayToWeek = (weekId: string) => {
    const week = weeks.find(w => w.id === weekId);
    if (!week) return;

    const newDay: ProgramDay = {
      id: Date.now().toString(),
      title: `Day ${week.days.length + 1}`,
      description: '',
      order: week.days.length,
      exercises: []
    };

    updateWeek(weekId, { days: [...week.days, newDay] });
  };

  const updateDay = (weekId: string, dayId: string, updates: Partial<ProgramDay>) => {
    const week = weeks.find(w => w.id === weekId);
    if (!week) return;

    const updatedDays = week.days.map(day => 
      day.id === dayId ? { ...day, ...updates } : day
    );
    updateWeek(weekId, { days: updatedDays });
  };

  const deleteDay = (weekId: string, dayId: string) => {
    const week = weeks.find(w => w.id === weekId);
    if (!week) return;

    const updatedDays = week.days.filter(day => day.id !== dayId);
    // Reorder remaining days
    const reordered = updatedDays.map((day, index) => ({ ...day, order: index }));
    updateWeek(weekId, { days: reordered });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Program Structure ({weeks.length} weeks)</h3>
        <Button onClick={() => setShowWeekForm(true)} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Week
        </Button>
      </div>

      {/* Week Form */}
      {showWeekForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Week Title</label>
              <Input
                value={weekTitle}
                onChange={(e) => setWeekTitle(e.target.value)}
                placeholder={`Week ${weeks.length + 1}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={weekDescription}
                onChange={(e) => setWeekDescription(e.target.value)}
                placeholder="Week focus and goals"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addWeek} size="sm">Add Week</Button>
              <Button onClick={() => setShowWeekForm(false)} variant="outline" size="sm">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weeks List */}
      {weeks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No weeks added yet</p>
            <Button onClick={() => setShowWeekForm(true)} className="mt-4" variant="outline">
              Add First Week
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {weeks.map((week, weekIndex) => (
            <Card key={week.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div>
                      <CardTitle className="text-base">{week.title}</CardTitle>
                      {week.description && (
                        <p className="text-sm text-gray-600 mt-1">{week.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{week.days.length} days</Badge>
                    <Button
                      onClick={() => addDayToWeek(week.id)}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Day
                    </Button>
                    <Button
                      onClick={() => deleteWeek(week.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {week.days.length > 0 && (
                <CardContent>
                  <div className="space-y-3">
                    {week.days.map((day, dayIndex) => (
                      <div key={day.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {dayIndex + 1}
                            </Badge>
                            <Input
                              value={day.title}
                              onChange={(e) => updateDay(week.id, day.id, { title: e.target.value })}
                              className="font-medium bg-transparent border-none p-0 h-auto"
                              placeholder="Day title"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {day.exercises.length} exercises
                            </Badge>
                            <Button
                              onClick={() => deleteDay(week.id, day.id)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {day.description && (
                          <p className="text-xs text-gray-600 mt-1 ml-6">{day.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};