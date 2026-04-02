import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, GripVertical, Edit, Calendar } from 'lucide-react';
import { CoachProgramExerciseBuilder } from './CoachProgramExerciseBuilder';
import { AddWeekModal } from './AddWeekModal';
import { AddDayModal } from './AddDayModal';

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

interface Day {
  id: string;
  title: string;
  notes?: string;
  exercises: ProgramExercise[];
}

interface Week {
  id: string;
  title: string;
  days: Day[];
}

interface CoachProgramWeekBuilderEnhancedProps {
  weeks: Week[];
  onWeeksChange: (weeks: Week[]) => void;
}

export const CoachProgramWeekBuilderEnhanced: React.FC<CoachProgramWeekBuilderEnhancedProps> = ({
  weeks,
  onWeeksChange
}) => {
  const [selectedDay, setSelectedDay] = useState<{ weekId: string; dayId: string } | null>(null);
  const [exerciseBuilderOpen, setExerciseBuilderOpen] = useState(false);

  const addWeek = () => {
    const newWeek: Week = {
      id: `week-${Date.now()}`,
      title: `Week ${weeks.length + 1}`,
      days: []
    };
    onWeeksChange([...weeks, newWeek]);
  };

  const updateWeek = (weekId: string, updates: Partial<Week>) => {
    onWeeksChange(weeks.map(week => 
      week.id === weekId ? { ...week, ...updates } : week
    ));
  };

  const deleteWeek = (weekId: string) => {
    onWeeksChange(weeks.filter(week => week.id !== weekId));
  };

  const addDay = (weekId: string) => {
    const week = weeks.find(w => w.id === weekId);
    if (!week) return;

    const newDay: Day = {
      id: `day-${Date.now()}`,
      title: `Day ${week.days.length + 1}`,
      exercises: []
    };

    updateWeek(weekId, {
      days: [...week.days, newDay]
    });
  };

  const updateDay = (weekId: string, dayId: string, updates: Partial<Day>) => {
    const week = weeks.find(w => w.id === weekId);
    if (!week) return;

    updateWeek(weekId, {
      days: week.days.map(day => 
        day.id === dayId ? { ...day, ...updates } : day
      )
    });
  };

  const deleteDay = (weekId: string, dayId: string) => {
    const week = weeks.find(w => w.id === weekId);
    if (!week) return;

    updateWeek(weekId, {
      days: week.days.filter(day => day.id !== dayId)
    });
  };

  const handleExercisesUpdate = (exercises: ProgramExercise[]) => {
    if (!selectedDay) return;
    
    updateDay(selectedDay.weekId, selectedDay.dayId, { exercises });
    setExerciseBuilderOpen(false);
    setSelectedDay(null);
  };

  const openExerciseBuilder = (weekId: string, dayId: string) => {
    setSelectedDay({ weekId, dayId });
    setExerciseBuilderOpen(true);
  };

  const getCurrentDayExercises = (): ProgramExercise[] => {
    if (!selectedDay) return [];
    const week = weeks.find(w => w.id === selectedDay.weekId);
    const day = week?.days.find(d => d.id === selectedDay.dayId);
    return day?.exercises || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Program Structure</h3>
        <Button onClick={addWeek} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Week
        </Button>
      </div>

      {weeks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No weeks added yet</p>
            <Button onClick={addWeek} className="mt-4" variant="outline">
              Add First Week
            </Button>
          </CardContent>
        </Card>
      ) : (
        weeks.map((week, weekIndex) => (
          <Card key={week.id} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <Input
                    value={week.title}
                    onChange={(e) => updateWeek(week.id, { title: e.target.value })}
                    className="font-semibold text-lg border-none p-0 h-auto"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteWeek(week.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Days</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addDay(week.id)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Day
                </Button>
              </div>

              <div className="grid gap-3">
                {week.days.map((day) => (
                  <Card key={day.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Input
                          value={day.title}
                          onChange={(e) => updateDay(week.id, day.id, { title: e.target.value })}
                          className="font-medium border-none p-0 h-auto"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openExerciseBuilder(week.id, day.id)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Exercises ({day.exercises.length})
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDay(week.id, day.id)}
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {day.exercises.length > 0 && (
                        <div className="space-y-2">
                          {day.exercises.map((exercise, idx) => (
                            <div key={exercise.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{exercise.exercise_name}</span>
                                {exercise.superset_group && (
                                  <Badge variant="outline" className="text-xs">
                                    Superset {exercise.superset_group}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                {exercise.sets} × {exercise.reps}
                                {exercise.duration && ` • ${exercise.duration}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <Textarea
                        placeholder="Day notes (optional)"
                        value={day.notes || ''}
                        onChange={(e) => updateDay(week.id, day.id, { notes: e.target.value })}
                        className="mt-3"
                        rows={2}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={exerciseBuilderOpen} onOpenChange={setExerciseBuilderOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Exercises - {selectedDay && weeks.find(w => w.id === selectedDay.weekId)?.days.find(d => d.id === selectedDay.dayId)?.title}
            </DialogTitle>
          </DialogHeader>
          <CoachProgramExerciseBuilder
            exercises={getCurrentDayExercises()}
            onExercisesChange={handleExercisesUpdate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};