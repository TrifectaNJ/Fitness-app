import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Plus, X, GripVertical, User, Calendar, Dumbbell, Save } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  description: string;
  category: string;
  muscle_groups: string[];
  equipment: string;
}

interface UserWithCoach {
  id: string;
  name: string;
  email: string;
  has_coach: boolean;
}

interface ProgramExercise {
  exercise_id: string;
  exercise: Exercise;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string;
  order: number;
}

interface PersonalizedProgramCreatorProps {
  onSuccess: () => void;
  editingProgram?: any;
}

export const PersonalizedProgramCreator: React.FC<PersonalizedProgramCreatorProps> = ({ 
  onSuccess, 
  editingProgram 
}) => {
  const [title, setTitle] = useState(editingProgram?.title || '');
  const [description, setDescription] = useState(editingProgram?.description || '');
  const [selectedUserId, setSelectedUserId] = useState(editingProgram?.user_id || '');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [programExercises, setProgramExercises] = useState<ProgramExercise[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserWithCoach[]>([]);
  const [loading, setLoading] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const { currentUser, userRole } = useRolePermissions();

  useEffect(() => {
    loadExercises();
    loadAvailableUsers();
    if (editingProgram?.exercises) {
      setProgramExercises(editingProgram.exercises);
    }
  }, []);

  const loadExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      let query = supabase
        .from('user_profiles')
        .select(`
          id, name, email,
          coach_assignments!inner(coach_id)
        `);

      // Filter based on role
      if (userRole === 'coach' && currentUser) {
        query = query.eq('coach_assignments.coach_id', currentUser.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const usersWithCoach = data?.map(user => ({
        ...user,
        has_coach: true
      })) || [];

      setAvailableUsers(usersWithCoach);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const addExercise = (exercise: Exercise) => {
    const newProgramExercise: ProgramExercise = {
      exercise_id: exercise.id,
      exercise: exercise,
      sets: 3,
      reps: '10-12',
      rest_seconds: 60,
      notes: '',
      order: programExercises.length
    };
    setProgramExercises([...programExercises, newProgramExercise]);
    setShowExerciseSelector(false);
  };

  const removeExercise = (index: number) => {
    const updated = programExercises.filter((_, i) => i !== index);
    // Reorder
    const reordered = updated.map((ex, i) => ({ ...ex, order: i }));
    setProgramExercises(reordered);
  };

  const updateExercise = (index: number, field: keyof ProgramExercise, value: any) => {
    const updated = [...programExercises];
    updated[index] = { ...updated[index], [field]: value };
    setProgramExercises(updated);
  };

  const moveExercise = (fromIndex: number, toIndex: number) => {
    const updated = [...programExercises];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    // Reorder
    const reordered = updated.map((ex, i) => ({ ...ex, order: i }));
    setProgramExercises(reordered);
  };

  const handleSave = async () => {
    if (!title.trim() || !selectedUserId || programExercises.length === 0) {
      alert('Please fill in all required fields and add at least one exercise');
      return;
    }

    setLoading(true);
    try {
      const programData = {
        title: title.trim(),
        description: description.trim(),
        user_id: selectedUserId,
        created_by: currentUser?.id,
        exercises: programExercises,
        status: 'active'
      };

      if (editingProgram) {
        const { error } = await supabase
          .from('personalized_workout_programs')
          .update(programData)
          .eq('id', editingProgram.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('personalized_workout_programs')
          .insert([programData]);
        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving program:', error);
      alert('Error saving program. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Program Title *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter program title"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the program goals and focus"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Assign to User *</label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user with assigned coach" />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    {user.name} ({user.email})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Exercises Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Exercises ({programExercises.length})</h3>
          <Button 
            onClick={() => setShowExerciseSelector(true)}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Exercise
          </Button>
        </div>

        {programExercises.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No exercises added yet</p>
              <Button 
                onClick={() => setShowExerciseSelector(true)}
                className="mt-4"
                variant="outline"
              >
                Add First Exercise
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {programExercises.map((programEx, index) => (
              <Card key={`${programEx.exercise_id}-${index}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      <Badge variant="outline">{index + 1}</Badge>
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{programEx.exercise.name}</h4>
                          <p className="text-sm text-gray-600">{programEx.exercise.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">{programEx.exercise.category}</Badge>
                            {programEx.exercise.muscle_groups?.map(muscle => (
                              <Badge key={muscle} variant="outline" className="text-xs">
                                {muscle}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExercise(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Sets</label>
                          <Input
                            type="number"
                            value={programEx.sets}
                            onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                            min="1"
                            max="10"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Reps</label>
                          <Input
                            value={programEx.reps}
                            onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                            placeholder="10-12"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Rest (sec)</label>
                          <Input
                            type="number"
                            value={programEx.rest_seconds}
                            onChange={(e) => updateExercise(index, 'rest_seconds', parseInt(e.target.value))}
                            min="0"
                            max="300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Notes</label>
                        <Input
                          value={programEx.notes}
                          onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                          placeholder="Special instructions or modifications"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] m-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Select Exercise</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowExerciseSelector(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 overflow-y-auto">
              {exercises.map((exercise) => (
                <Card key={exercise.id} className="cursor-pointer hover:bg-gray-50" onClick={() => addExercise(exercise)}>
                  <CardContent className="p-4">
                    <h4 className="font-semibold">{exercise.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{exercise.description}</p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{exercise.category}</Badge>
                      <Badge variant="outline">{exercise.equipment}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {editingProgram ? 'Update Program' : 'Create Program'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};