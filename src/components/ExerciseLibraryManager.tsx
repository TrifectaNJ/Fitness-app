import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExerciseForm } from './ExerciseForm';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, Clock, RotateCcw } from 'lucide-react';
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
  created_at: string;
}

export function ExerciseLibraryManager() {
  const [exercises, setExercises] = useState<LibraryExercise[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<LibraryExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .order('created_at', { ascending: false });

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

  const handleSave = async (exerciseData: any) => {
    try {
      const payload = {
        name: exerciseData.name,
        description: exerciseData.description,
        instructions: exerciseData.instructions,
        duration: exerciseData.duration,
        reps: exerciseData.reps,
        sets: exerciseData.sets,
        image_url: exerciseData.imageUrl,
        video_url: exerciseData.videoUrl
      };

      if (editingExercise) {
        const { error } = await supabase
          .from('exercise_library')
          .update(payload)
          .eq('id', editingExercise.id);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Exercise updated successfully' });
      } else {
        const { error } = await supabase
          .from('exercise_library')
          .insert([payload]);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Exercise created successfully' });
      }

      setShowForm(false);
      setEditingExercise(null);
      fetchExercises();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save exercise',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return;

    try {
      const { error } = await supabase
        .from('exercise_library')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: 'Success', description: 'Exercise deleted successfully' });
      fetchExercises();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete exercise',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (exercise: LibraryExercise) => {
    setEditingExercise(exercise);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingExercise(null);
  };

  if (showForm) {
    const formExercise = editingExercise ? {
      id: editingExercise.id,
      name: editingExercise.name,
      description: editingExercise.description,
      instructions: editingExercise.instructions,
      duration: editingExercise.duration,
      reps: editingExercise.reps,
      sets: editingExercise.sets,
      imageUrl: editingExercise.image_url,
      videoUrl: editingExercise.video_url,
      order: 0
    } : undefined;

    return (
      <div className="p-6">
        <ExerciseForm
          exercise={formExercise}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Exercise Library</h2>
          <p className="text-gray-600">Manage reusable exercises for your programs</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Exercise
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading exercises...</div>
          </CardContent>
        </Card>
      ) : exercises.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No exercises yet</h3>
              <p className="text-gray-600 mb-4">Create your first exercise to get started</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Exercise
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Exercises ({exercises.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Reps/Sets</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exercises.map((exercise) => (
                  <TableRow key={exercise.id}>
                    <TableCell className="font-medium">{exercise.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {exercise.duration}s
                      </div>
                    </TableCell>
                    <TableCell>
                      {exercise.reps > 0 && (
                        <div className="flex items-center">
                          <RotateCcw className="w-4 h-4 mr-1" />
                          {exercise.reps} × {exercise.sets}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {exercise.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(exercise)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(exercise.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}