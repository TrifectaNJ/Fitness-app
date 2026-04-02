import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface Day {
  id: string;
  title: string;
  notes?: string;
  exercises: any[];
}

interface AddDayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDay: (day: Day) => void;
  dayNumber: number;
}

const dayTypes = [
  'Upper Body',
  'Lower Body',
  'Push',
  'Pull',
  'Legs',
  'Full Body',
  'Cardio',
  'Rest/Recovery',
  'Custom'
];

export const AddDayModal: React.FC<AddDayModalProps> = ({
  open,
  onOpenChange,
  onAddDay,
  dayNumber
}) => {
  const [title, setTitle] = useState(`Day ${dayNumber}`);
  const [notes, setNotes] = useState('');
  const [dayType, setDayType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDay: Day = {
      id: `day-${Date.now()}`,
      title: dayType === 'Custom' ? title : dayType || title,
      notes,
      exercises: []
    };
    onAddDay(newDay);
    setTitle(`Day ${dayNumber + 1}`);
    setNotes('');
    setDayType('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Add New Day
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dayType">Day Type</Label>
            <Select value={dayType} onValueChange={setDayType}>
              <SelectTrigger>
                <SelectValue placeholder="Select day type" />
              </SelectTrigger>
              <SelectContent>
                {dayTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {dayType === 'Custom' && (
            <div className="space-y-2">
              <Label htmlFor="title">Custom Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter custom day title"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions or focus for this day"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Day
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};