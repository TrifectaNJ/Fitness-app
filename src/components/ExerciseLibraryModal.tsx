import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { Search, Clock, RotateCcw, Image, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Exercise } from '@/types/fitness';

interface LibraryExercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  duration: number;
  reps: number;
  sets: number;
  image_url: string;
  video_url: string;
}

interface ExerciseLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exercises: Exercise[]) => void;
}

export function ExerciseLibraryModal({ open, onOpenChange, onSelect }: ExerciseLibraryModalProps) {
  const [exercises, setExercises] = useState<LibraryExercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchExercises();
      setSelectedExercises(new Set());
    }
  }, [open]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      console.log('Fetching exercises from exercise_library table...');
      const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching exercises:', error);
        throw error;
      }
      
      console.log('Fetched exercises:', data);
      setExercises(data || []);
    } catch (error: any) {
      console.error('Failed to fetch exercises:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch exercises: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exercise.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExerciseToggle = (exerciseId: string) => {
    const newSelected = new Set(selectedExercises);
    if (newSelected.has(exerciseId)) {
      newSelected.delete(exerciseId);
    } else {
      newSelected.add(exerciseId);
    }
    setSelectedExercises(newSelected);
  };

  const handleConfirmSelection = () => {
    console.log('Selected exercise IDs:', Array.from(selectedExercises));
    
    const selectedExerciseObjects = exercises
      .filter(ex => selectedExercises.has(ex.id))
      .map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        description: exercise.description || '',
        instructions: Array.isArray(exercise.instructions) ? exercise.instructions : [],
        duration: exercise.duration || 30,
        reps: exercise.reps || 0,
        sets: exercise.sets || 1,
        imageUrl: exercise.image_url,
        videoUrl: exercise.video_url,
        order: 0
      }));
    
    console.log('Sending selected exercises:', selectedExerciseObjects);
    onSelect(selectedExerciseObjects);
    onOpenChange(false);
    setSearchTerm('');
    setSelectedExercises(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select Exercises from Library</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-y-auto max-h-[50vh] space-y-3">
            {loading ? (
              <div className="text-center py-8">Loading exercises...</div>
            ) : filteredExercises.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {exercises.length === 0 
                    ? 'No exercises in library yet. Create some exercises first.'
                    : 'No exercises match your search.'
                  }
                </p>
              </div>
            ) : (
              filteredExercises.map((exercise) => (
                <Card key={exercise.id} className={`cursor-pointer transition-all ${
                  selectedExercises.has(exercise.id) ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedExercises.has(exercise.id)}
                        onCheckedChange={() => handleExerciseToggle(exercise.id)}
                        className="mt-1"
                      />
                      <div className="flex-1" onClick={() => handleExerciseToggle(exercise.id)}>
                        <h3 className="font-semibold text-lg mb-2">{exercise.name}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {exercise.description || 'No description available'}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {exercise.duration || 30}s
                          </Badge>
                          {exercise.reps > 0 && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" />
                              {exercise.reps} × {exercise.sets}
                            </Badge>
                          )}
                          {exercise.image_url && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Image className="w-3 h-3" />
                              Image
                            </Badge>
                          )}
                          {exercise.video_url && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              Video
                            </Badge>
                          )}
                        </div>
                        
                        {exercise.instructions && exercise.instructions.length > 0 && (
                          <div className="text-sm text-gray-500">
                            <strong>Steps:</strong> {exercise.instructions.slice(0, 2).join(', ')}
                            {exercise.instructions.length > 2 && '...'}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedExercises.size} exercise(s) selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmSelection}
                disabled={selectedExercises.size === 0}
              >
                Add Selected ({selectedExercises.size})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}