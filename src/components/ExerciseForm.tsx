import React, { useState } from 'react';
import { Exercise } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaUpload } from './MediaUpload';
import { Plus, Trash2 } from 'lucide-react';

interface ExerciseFormProps {
  exercise?: Exercise;
  onSave: (exercise: Omit<Exercise, 'id'>) => void;
  onCancel: () => void;
}

export function ExerciseForm({ exercise, onSave, onCancel }: ExerciseFormProps) {
  const [formData, setFormData] = useState({
    name: exercise?.name || '',
    duration: exercise?.duration || 30,
    reps: exercise?.reps || 0,
    sets: exercise?.sets || 1,
    description: exercise?.description || '',
    instructions: exercise?.instructions || [''],
    imageUrl: exercise?.imageUrl || '',
    videoUrl: exercise?.videoUrl || '',
    order: exercise?.order || 0
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData(prev => ({ ...prev, instructions: newInstructions }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const handleMediaUpload = (url: string, type: 'image' | 'video') => {
    if (type === 'image') {
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } else {
      setFormData(prev => ({ ...prev, videoUrl: url }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      instructions: formData.instructions.filter(inst => inst.trim() !== '')
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{exercise ? 'Edit Exercise' : 'Add Exercise'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Exercise Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                type="number"
                value={formData.reps}
                onChange={(e) => handleInputChange('reps', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="sets">Sets</Label>
              <Input
                id="sets"
                type="number"
                value={formData.sets}
                onChange={(e) => handleInputChange('sets', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => handleInputChange('order', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label>Instructions</Label>
            {formData.instructions.map((instruction, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  value={instruction}
                  onChange={(e) => handleInstructionChange(index, e.target.value)}
                  placeholder={`Step ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeInstruction(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addInstruction}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <MediaUpload
              type="image"
              onUpload={handleMediaUpload}
              existingUrl={formData.imageUrl}
            />
            <MediaUpload
              type="video"
              onUpload={handleMediaUpload}
              existingUrl={formData.videoUrl}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit">Save Exercise</Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}