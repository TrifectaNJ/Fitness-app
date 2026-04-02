import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgramDay } from '@/types/fitness';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';

interface ProgramFormDaysProps {
  days: ProgramDay[];
  onAddDay: () => void;
  onEditDay: (day: ProgramDay, index: number) => void;
  onDeleteDay: (index: number) => void;
}

export const ProgramFormDays: React.FC<ProgramFormDaysProps> = ({ 
  days, onAddDay, onEditDay, onDeleteDay 
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Program Days ({days.length})
        </h3>
        <Button onClick={onAddDay}>
          <Plus className="w-4 h-4 mr-2" />
          Add Day
        </Button>
      </div>
      
      {days.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No program days added yet.</p>
              <p className="text-sm">Click "Add Day" to create your first workout day.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {days.map((day, index) => (
            <Card key={day.id || index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Day {day.dayNumber}: {day.title}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditDay(day, index)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteDay(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {day.description && (
                  <p className="text-sm text-gray-600 mb-3">{day.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{day.workouts?.length || 0} workouts</span>
                  {day.workouts && day.workouts.length > 0 && (
                    <span>
                      Total: {day.workouts.reduce((total, workout) => total + (workout.duration || 0), 0)} min
                    </span>
                  )}
                </div>
                {day.workouts && day.workouts.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">Workouts:</div>
                    <div className="flex flex-wrap gap-1">
                      {day.workouts.map((workout, workoutIndex) => (
                        <span 
                          key={workoutIndex}
                          className="px-2 py-1 bg-gray-100 rounded text-xs"
                        >
                          {workout.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};