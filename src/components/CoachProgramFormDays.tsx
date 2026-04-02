import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { DayForm } from './DayForm';

interface CoachProgramFormDaysProps {
  days: any[];
  setFormData: (updater: (prev: any) => any) => void;
}

export const CoachProgramFormDays: React.FC<CoachProgramFormDaysProps> = ({
  days, setFormData
}) => {
  const [showDayForm, setShowDayForm] = useState(false);
  const [editingDay, setEditingDay] = useState<{day: any, index: number} | null>(null);

  const addDay = (dayData: any) => {
    const newDay = {
      ...dayData,
      id: Date.now().toString()
    };
    
    setFormData(prev => ({ 
      ...prev, 
      days: [...prev.days, newDay] 
    }));
    
    setShowDayForm(false);
  };

  const updateDay = (dayData: any) => {
    if (!editingDay) return;
    
    const updatedDay = {
      ...dayData,
      id: editingDay.day.id
    };

    setFormData(prev => {
      const updatedDays = [...prev.days];
      updatedDays[editingDay.index] = updatedDay;
      return { ...prev, days: updatedDays };
    });
    
    setEditingDay(null);
  };

  const deleteDay = (index: number) => {
    if (window.confirm('Are you sure you want to delete this day?')) {
      setFormData(prev => {
        const updatedDays = [...prev.days];
        updatedDays.splice(index, 1);
        return { ...prev, days: updatedDays };
      });
    }
  };

  if (showDayForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add New Day</h3>
          <Button variant="outline" onClick={() => setShowDayForm(false)}>
            Cancel
          </Button>
        </div>
        <DayForm
          onSave={addDay}
          onCancel={() => setShowDayForm(false)}
        />
      </div>
    );
  }

  if (editingDay) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Day</h3>
          <Button variant="outline" onClick={() => setEditingDay(null)}>
            Cancel
          </Button>
        </div>
        <DayForm
          day={editingDay.day}
          onSave={updateDay}
          onCancel={() => setEditingDay(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Program Days ({days.length})
        </h3>
        <Button 
          onClick={() => setShowDayForm(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Day
        </Button>
      </div>

      {days.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No days added yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Add workout days to structure your program
            </p>
            <Button 
              onClick={() => setShowDayForm(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Day
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {days.map((day, index) => (
            <Card key={day.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{day.title}</h4>
                    <Badge variant="outline">Day {index + 1}</Badge>
                    {day.restDay && <Badge variant="secondary">Rest Day</Badge>}
                  </div>
                  
                  {day.description && (
                    <p className="text-gray-600 text-sm mb-2">{day.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {day.workouts && (
                      <span>Workouts: {day.workouts.length}</span>
                    )}
                    {day.duration && (
                      <span>Duration: {day.duration}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDay({day, index})}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteDay(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};