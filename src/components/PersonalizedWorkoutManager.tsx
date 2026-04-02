import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, User, Dumbbell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Exercise {
  id: string;
  name: string;
  description: string;
  category: string;
  instructions: string;
}

interface PersonalizedProgram {
  id?: string;
  title: string;
  description: string;
  assigned_user_id: string;
  exercises: string[];
  created_by: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  has_coach: boolean;
}

export const PersonalizedWorkoutManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [programs, setPrograms] = useState<PersonalizedProgram[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchExercises();
    fetchPrograms();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, name, email')
      .eq('has_coach', true);
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    setUsers(data || []);
  };

  const fetchExercises = async () => {
    const { data, error } = await supabase
      .from('exercise_library')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching exercises:', error);
      return;
    }
    setExercises(data || []);
  };

  const fetchPrograms = async () => {
    const { data, error } = await supabase
      .from('personalized_workout_programs')
      .select(`
        *,
        user_profiles!assigned_user_id(name, email)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching programs:', error);
      return;
    }
    setPrograms(data || []);
  };

  const handleAddExercise = (exerciseId: string) => {
    if (!selectedExercises.includes(exerciseId)) {
      setSelectedExercises([...selectedExercises, exerciseId]);
    }
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises(selectedExercises.filter(id => id !== exerciseId));
  };

  const handleSaveProgram = async () => {
    if (!title || !selectedUser || selectedExercises.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('personalized_workout_programs')
      .insert({
        title,
        description,
        assigned_user_id: selectedUser,
        exercises: selectedExercises,
        created_by: user?.id
      });

    if (error) {
      console.error('Error saving program:', error);
      toast.error('Failed to save program');
    } else {
      toast.success('Program saved successfully');
      resetForm();
      fetchPrograms();
    }
    
    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedUser('');
    setSelectedExercises([]);
  };

  const handleDeleteProgram = async (programId: string) => {
    const { error } = await supabase
      .from('personalized_workout_programs')
      .delete()
      .eq('id', programId);

    if (error) {
      console.error('Error deleting program:', error);
      toast.error('Failed to delete program');
    } else {
      toast.success('Program deleted successfully');
      fetchPrograms();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Dumbbell className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold">Personalized Workout Programs</h2>
      </div>

      {/* Create New Program */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Personalized Program</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Program Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter program title"
              />
            </div>
            <div>
              <Label htmlFor="user">Assign to User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Program description"
            />
          </div>

          <div>
            <Label>Add Exercises</Label>
            <Select onValueChange={handleAddExercise}>
              <SelectTrigger>
                <SelectValue placeholder="Select exercise to add" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name} ({exercise.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Exercises */}
          {selectedExercises.length > 0 && (
            <div>
              <Label>Selected Exercises ({selectedExercises.length})</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedExercises.map((exerciseId) => {
                  const exercise = exercises.find(e => e.id === exerciseId);
                  return (
                    <Badge key={exerciseId} variant="secondary" className="flex items-center gap-2">
                      {exercise?.name}
                      <button
                        onClick={() => handleRemoveExercise(exerciseId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSaveProgram} disabled={loading}>
              {loading ? 'Saving...' : 'Save Program'}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Programs */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Personalized Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {programs.map((program) => (
              <div key={program.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{program.title}</h3>
                    <p className="text-gray-600 mb-2">{program.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="w-4 h-4" />
                      <span>Assigned to: {(program as any).user_profiles?.name}</span>
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline">
                        {program.exercises.length} exercises
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => program.id && handleDeleteProgram(program.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {programs.length === 0 && (
              <p className="text-gray-500 text-center py-8">No personalized programs created yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};