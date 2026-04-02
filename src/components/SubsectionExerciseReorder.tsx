import React, { useState, useEffect } from 'react';
import { Exercise } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GripVertical, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface SubsectionExerciseReorderProps {
  subsectionId: string;
  exercises: Exercise[];
  onReorderComplete: () => void;
  onCancel: () => void;
}

export const SubsectionExerciseReorder: React.FC<SubsectionExerciseReorderProps> = ({
  subsectionId,
  exercises,
  onReorderComplete,
  onCancel
}) => {
  const [currentOrder, setCurrentOrder] = useState<Exercise[]>(exercises);
  const [originalOrder] = useState<Exercise[]>(exercises);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentOrder(exercises);
  }, [exercises]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...currentOrder];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    
    setCurrentOrder(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleReset = () => {
    setCurrentOrder([...originalOrder]);
    toast({
      title: 'Order Reset',
      description: 'Exercise order has been restored to original.'
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from('workout_subsection_exercises')
        .delete()
        .eq('subsection_id', subsectionId);

      const rowsToInsert = currentOrder.map((ex, index) => ({
        subsection_id: subsectionId,
        exercise_id: ex.id,
        sort_order: index
      }));

      const { error } = await supabase
        .from('workout_subsection_exercises')
        .insert(rowsToInsert);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Exercise order saved successfully.'
      });
      onReorderComplete();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to save order: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4 bg-orange-50 border-orange-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Reorder Exercises</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            type="button"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2 text-sm">Current Order (Drag to Reorder)</h4>
            <div className="space-y-2">
              {currentOrder.map((exercise, index) => (
                <div
                  key={exercise.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 bg-white p-3 rounded border cursor-move hover:shadow-md transition-shadow ${
                    draggedIndex === index ? 'opacity-50' : ''
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <span className="font-bold text-orange-600 min-w-[24px]">{index + 1}.</span>
                  <span className="flex-1 font-medium">{exercise.name}</span>
                  <span className="text-xs text-gray-500">{exercise.duration}s</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2 text-sm text-gray-600">Original Order (Reference)</h4>
            <div className="space-y-2">
              {originalOrder.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="flex items-center gap-2 bg-gray-50 p-3 rounded border border-gray-200"
                >
                  <span className="font-bold text-gray-400 min-w-[24px]">{index + 1}.</span>
                  <span className="flex-1 text-gray-700">{exercise.name}</span>
                  <span className="text-xs text-gray-500">{exercise.duration}s</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-700"
            type="button"
          >
            {saving ? 'Saving...' : 'Save Order'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
