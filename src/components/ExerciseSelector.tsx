import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Search, Clock, RotateCcw, Image, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface ExerciseSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exercise: any) => void;
}

export function ExerciseSelector({ open, onOpenChange, onSelect }: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<LibraryExercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchExercises();
    }
  }, [open]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch exercises',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exercise.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (exercise: LibraryExercise) => {
    // Convert library exercise to the format expected by WorkoutForm
    const convertedExercise = {
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
      instructions: exercise.instructions,
      duration: exercise.duration,
      reps: exercise.reps,
      sets: exercise.sets,
      imageUrl: exercise.image_url,
      videoUrl: exercise.video_url,
      order: 0
    };
    
    onSelect(convertedExercise);
    onOpenChange(false);
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select Exercise from Library</DialogTitle>
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
                <Card key={exercise.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{exercise.name}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {exercise.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {exercise.duration}s
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
                        
                        {exercise.instructions.length > 0 && (
                          <div className="text-sm text-gray-500">
                            <strong>Steps:</strong> {exercise.instructions.slice(0, 2).join(', ')}
                            {exercise.instructions.length > 2 && '...'}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => handleSelect(exercise)}
                        className="ml-4"
                      >
                        Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}