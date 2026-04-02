import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExerciseForm } from './ExerciseForm';
import { Exercise } from '@/types/fitness';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Dumbbell, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminExerciseManager: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exercise.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      const formattedExercises = data.map(ex => ({
        id: ex.id,
        name: ex.name,
        duration: ex.duration,
        reps: ex.reps,
        sets: ex.sets,
        description: ex.description,
        instructions: ex.instructions || [],
        imageUrl: ex.image_url,
        videoUrl: ex.video_url,
        order: ex.order_index
      }));
      
      setExercises(formattedExercises);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load exercises',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const handleSave = async (exerciseData: Omit<Exercise, 'id'>) => {
    try {
      const dbData = {
        name: exerciseData.name,
        duration: exerciseData.duration,
        reps: exerciseData.reps,
        sets: exerciseData.sets,
        description: exerciseData.description,
        instructions: exerciseData.instructions,
        image_url: exerciseData.imageUrl,
        video_url: exerciseData.videoUrl,
        order_index: exerciseData.order
      };

      if (editingExercise) {
        const { error } = await supabase
          .from('exercises')
          .update(dbData)
          .eq('id', editingExercise.id);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Exercise updated successfully' });
      } else {
        const { error } = await supabase
          .from('exercises')
          .insert([dbData]);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Exercise created successfully' });
      }
      
      fetchExercises();
      handleFormClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save exercise',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this exercise?')) return;
    
    try {
      const { error } = await supabase
        .from('exercises')
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

  const handleFormClose = () => {
    setShowForm(false);
    setEditingExercise(undefined);
  };

  if (showForm) {
    return (
      <div className="p-6">
        <ExerciseForm
          exercise={editingExercise}
          onSave={handleSave}
          onCancel={handleFormClose}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Exercise
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading exercises...</div>
      ) : filteredExercises.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {exercises.length === 0 ? 'No exercises yet' : 'No exercises found'}
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {exercises.length === 0 
                ? 'Create your first exercise to get started'
                : 'Try adjusting your search terms'
              }
            </p>
            {exercises.length === 0 && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Exercise
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(exercise)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(exercise.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {exercise.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {exercise.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{exercise.duration}s</Badge>
                    {exercise.reps > 0 && (
                      <Badge variant="outline">{exercise.reps} reps</Badge>
                    )}
                    {exercise.sets > 1 && (
                      <Badge variant="outline">{exercise.sets} sets</Badge>
                    )}
                  </div>
                  {exercise.instructions && exercise.instructions.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {exercise.instructions.length} step{exercise.instructions.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminExerciseManager;