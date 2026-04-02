import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, User, Dumbbell, Calendar, ArrowUp, ArrowDown, Copy } from 'lucide-react';
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
  scheduled_date?: string;
  is_template?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  has_coach: boolean;
}

export const EnhancedPersonalizedWorkoutManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [programs, setPrograms] = useState<PersonalizedProgram[]>([]);
  const [templates, setTemplates] = useState<PersonalizedProgram[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
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
    const allPrograms = data || [];
    setPrograms(allPrograms.filter(p => !p.is_template));
    setTemplates(allPrograms.filter(p => p.is_template));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = [...selectedExercises];
    if (direction === 'up' && index > 0) {
      [newExercises[index], newExercises[index - 1]] = [newExercises[index - 1], newExercises[index]];
    } else if (direction === 'down' && index < newExercises.length - 1) {
      [newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
    }
    setSelectedExercises(newExercises);
  };

  const handleSaveProgram = async () => {
    if (!title || (!isTemplate && !selectedUser) || selectedExercises.length === 0) {
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
        assigned_user_id: isTemplate ? null : selectedUser,
        exercises: selectedExercises,
        created_by: user?.id,
        scheduled_date: scheduledDate || null,
        is_template: isTemplate
      });

    if (error) {
      console.error('Error saving program:', error);
      toast.error('Failed to save program');
    } else {
      toast.success(isTemplate ? 'Template saved successfully' : 'Program saved successfully');
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
    setScheduledDate('');
    setIsTemplate(false);
  };

  const useTemplate = (template: PersonalizedProgram) => {
    setTitle(template.title);
    setDescription(template.description);
    setSelectedExercises(template.exercises);
    setIsTemplate(false);
    toast.success('Template loaded');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Dumbbell className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold">Enhanced Personalized Workout Programs</h2>
      </div>

      {/* Create New Program/Template */}
      <Card>
        <CardHeader>
          <CardTitle>Create New {isTemplate ? 'Template' : 'Personalized Program'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isTemplate"
              checked={isTemplate}
              onChange={(e) => setIsTemplate(e.target.checked)}
            />
            <Label htmlFor="isTemplate">Save as Template</Label>
          </div>

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
            {!isTemplate && (
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
            )}
          </div>

          {!isTemplate && (
            <div>
              <Label htmlFor="scheduledDate">Schedule Date (Optional)</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
          )}

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
            <Select onValueChange={(exerciseId) => {
              if (!selectedExercises.includes(exerciseId)) {
                setSelectedExercises([...selectedExercises, exerciseId]);
              }
            }}>
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

          {/* Selected Exercises with Reordering */}
          {selectedExercises.length > 0 && (
            <div>
              <Label>Selected Exercises ({selectedExercises.length}) - Drag to reorder</Label>
              <div className="space-y-2 mt-2">
                {selectedExercises.map((exerciseId, index) => {
                  const exercise = exercises.find(e => e.id === exerciseId);
                  return (
                    <div key={exerciseId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{index + 1}.</span>
                      <span className="flex-1">{exercise?.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveExercise(index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveExercise(index, 'down')}
                        disabled={index === selectedExercises.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedExercises(selectedExercises.filter(id => id !== exerciseId))}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSaveProgram} disabled={loading}>
              {loading ? 'Saving...' : `Save ${isTemplate ? 'Template' : 'Program'}`}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Program Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{template.title}</h3>
                  <p className="text-gray-600 mb-2">{template.description}</p>
                  <Badge variant="outline">
                    {template.exercises.length} exercises
                  </Badge>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => useTemplate(template)}>
                      <Copy className="w-4 h-4 mr-1" />
                      Use Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Programs */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {programs.map((program) => (
              <div key={program.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{program.title}</h3>
                    <p className="text-gray-600 mb-2">{program.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Assigned to: {(program as any).user_profiles?.name}</span>
                      </div>
                      {program.scheduled_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Scheduled: {new Date(program.scheduled_date).toLocaleDateString()}</span>
                        </div>
                      )}
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
                    onClick={async () => {
                      if (program.id) {
                        const { error } = await supabase
                          .from('personalized_workout_programs')
                          .delete()
                          .eq('id', program.id);
                        if (!error) {
                          toast.success('Program deleted');
                          fetchPrograms();
                        }
                      }
                    }}
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