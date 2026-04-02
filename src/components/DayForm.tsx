import React, { useState } from 'react';
import { ProgramDay, Workout } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutForm } from './WorkoutForm';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface DayFormProps {
  day?: ProgramDay;
  onSave: (day: Omit<ProgramDay, 'id'>) => void;
  onCancel: () => void;
  programId?: string;
  isCoachProgram?: boolean;
}

export function DayForm({ day, onSave, onCancel, programId, isCoachProgram }: DayFormProps) {
  const [formData, setFormData] = useState({
    dayNumber: day?.dayNumber || 1,
    title: day?.title || '',
    description: day?.description || '',
    workouts: day?.workouts || []
  });

  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<{workout: Workout, index: number} | null>(null);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkoutSave = async (workoutData: Workout) => {
    try {
      let savedWorkout = workoutData;

      // Coach program workouts are stored as JSON in coach_program_days.workouts —
      // do NOT write to the workouts table (its program_id FK references programs, not coach_programs).
      if (!isCoachProgram) {
        if (!workoutData.id) {
          const { data, error } = await supabase
            .from('workouts')
            .insert([{
              title: workoutData.title,
              duration: workoutData.duration,
              calories: workoutData.calories,
              focus_zones: workoutData.focusZones,
              equipment: workoutData.equipment,
              image_url: workoutData.imageUrl,
              video_url: workoutData.videoUrl,
              description: workoutData.description,
              program_id: programId
            }])
            .select()
            .single();

          if (error) throw error;
          savedWorkout = { ...workoutData, id: data.id };
        } else {
          const { error } = await supabase
            .from('workouts')
            .update({
              title: workoutData.title,
              duration: workoutData.duration,
              calories: workoutData.calories,
              focus_zones: workoutData.focusZones,
              equipment: workoutData.equipment,
              image_url: workoutData.imageUrl,
              video_url: workoutData.videoUrl,
              description: workoutData.description
            })
            .eq('id', workoutData.id);

          if (error) throw error;
        }
      }

      if (editingWorkout) {
        setFormData(prev => {
          const workouts = [...prev.workouts];
          workouts[editingWorkout.index] = savedWorkout;
          return { ...prev, workouts };
        });
        setEditingWorkout(null);
      } else {
        setFormData(prev => ({
          ...prev,
          workouts: [...prev.workouts, savedWorkout]
        }));
      }
      
      setShowWorkoutForm(false);
      
      toast({
        title: 'Success',
        description: 'Workout saved successfully'
      });
    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: 'Error',
        description: 'Failed to save workout',
        variant: 'destructive'
      });
    }
  };

  const deleteWorkout = async (index: number) => {
    const workout = formData.workouts[index];
    
    try {
      if (workout.id) {
        const { error } = await supabase
          .from('workouts')
          .delete()
          .eq('id', workout.id);

        if (error) {
          console.error('Error deleting workout:', error);
          toast({
            title: 'Error',
            description: 'Failed to delete workout',
            variant: 'destructive'
          });
          return;
        }
      }

      setFormData(prev => {
        const workouts = [...prev.workouts];
        workouts.splice(index, 1);
        return { ...prev, workouts };
      });
      
      toast({
        title: 'Success',
        description: 'Workout deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete workout',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleWorkoutFormCancel = () => {
    setShowWorkoutForm(false);
    setEditingWorkout(null);
  };

  if (showWorkoutForm) {
    return (
      <WorkoutForm
        programId={programId}
        onSave={handleWorkoutSave}
        onCancel={handleWorkoutFormCancel}
        isCoachProgram={isCoachProgram}
      />
    );
  }

  if (editingWorkout) {
    return (
      <WorkoutForm
        workout={editingWorkout.workout}
        programId={programId}
        onSave={handleWorkoutSave}
        onCancel={handleWorkoutFormCancel}
        isCoachProgram={isCoachProgram}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{day ? 'Edit Day' : 'Add Day'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dayNumber">Day Number</Label>
              <Input
                id="dayNumber"
                type="number"
                value={formData.dayNumber}
                onChange={(e) => handleInputChange('dayNumber', parseInt(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="title">Day Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Leg Attack"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional description for this day"
              rows={3}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold">Workouts</Label>
              <Button
                type="button"
                onClick={() => setShowWorkoutForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Workout
              </Button>
            </div>
            
            <div className="space-y-4">
              {formData.workouts.map((workout, index) => (
                <Card key={workout.id || index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {workout.imageUrl && (
                        <img 
                          src={workout.imageUrl} 
                          alt={workout.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">{workout.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{workout.duration} min</span>
                          {workout.calories && (
                            <span>🔥 {workout.calories} Cal</span>
                          )}
                          {workout.focusZones && workout.focusZones.length > 0 && (
                            <span>{workout.focusZones.join(', ')}</span>
                          )}
                        </div>
                        {workout.equipment && workout.equipment.length > 0 && (
                          <div className="text-sm text-gray-500 mt-1">
                            Equipment: {workout.equipment.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingWorkout({workout, index})}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteWorkout(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {formData.workouts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No workouts added yet. Click "Add Workout" to get started.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit">Save Day</Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}