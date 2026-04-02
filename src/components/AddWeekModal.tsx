import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface Week {
  id: string;
  title: string;
  days: any[];
}

interface AddWeekModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWeek: (week: Week) => void;
  weekNumber: number;
}

export const AddWeekModal: React.FC<AddWeekModalProps> = ({
  open,
  onOpenChange,
  onAddWeek,
  weekNumber
}) => {
  const [title, setTitle] = useState(`Week ${weekNumber}`);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newWeek: Week = {
      id: `week-${Date.now()}`,
      title,
      days: []
    };
    onAddWeek(newWeek);
    setTitle(`Week ${weekNumber + 1}`);
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Week
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Week Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Week 1, Foundation Week"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this week's focus"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Week
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};