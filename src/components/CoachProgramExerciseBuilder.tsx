import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, GripVertical, Search, Dumbbell, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string;
  muscle_groups: string[];
  equipment: string;
}

interface ProgramExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  duration: string;
  tempo: string;
  rest_seconds: number;
  notes: string;
  order: number;
  superset_group?: string;
}

interface CoachProgramExerciseBuilderProps {
  exercises: ProgramExercise[];
  onExercisesChange: (exercises: ProgramExercise[]) => void;
}

export const CoachProgramExerciseBuilder: React.FC<CoachProgramExerciseBuilderProps> = ({
  exercises,
  onExercisesChange
}) => {
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setAvailableExercises(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(ex => ex.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const filteredExercises = availableExercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addExercise = (exercise: Exercise) => {
    const newProgramExercise: ProgramExercise = {
      id: Date.now().toString(),
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      sets: 3,
      reps: '10-12',
      duration: '',
      tempo: '',
      rest_seconds: 60,
      notes: '',
      order: exercises.length
    };
    
    onExercisesChange([...exercises, newProgramExercise]);
    setShowExerciseSelector(false);
    setSearchTerm('');
  };

  const updateExercise = (index: number, field: keyof ProgramExercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    onExercisesChange(updated);
  };

  const removeExercise = (index: number) => {
    const updated = exercises.filter((_, i) => i !== index);
    // Reorder
    const reordered = updated.map((ex, i) => ({ ...ex, order: i }));
    onExercisesChange(reordered);
  };

  const moveExercise = (fromIndex: number, toIndex: number) => {
    const updated = [...exercises];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    // Reorder
    const reordered = updated.map((ex, i) => ({ ...ex, order: i }));
    onExercisesChange(reordered);
  };

  const createSuperset = (exerciseIndex: number) => {
    const supersetId = `superset_${Date.now()}`;
    updateExercise(exerciseIndex, 'superset_group', supersetId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Exercises ({exercises.length})</h4>
        <Button onClick={() => setShowExerciseSelector(true)} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Exercise
        </Button>
      </div>

      {exercises.length === 0 ? (
        <Card>
          <CardContent className="text-center py-6">
            <Dumbbell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No exercises added</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <Card key={exercise.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                    <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-medium">{exercise.exercise_name}</h5>
                        {exercise.superset_group && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Superset
                          </Badge>
                        )}
                      </div>
                      <Button
                        onClick={() => removeExercise(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Sets</label>
                        <Input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                          min="1"
                          max="10"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Reps</label>
                        <Input
                          value={exercise.reps}
                          onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                          placeholder="10-12"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Duration</label>
                        <Input
                          value={exercise.duration}
                          onChange={(e) => updateExercise(index, 'duration', e.target.value)}
                          placeholder="30s"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Rest (sec)</label>
                        <Input
                          type="number"
                          value={exercise.rest_seconds}
                          onChange={(e) => updateExercise(index, 'rest_seconds', parseInt(e.target.value))}
                          min="0"
                          max="300"
                          className="h-8"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Tempo</label>
                        <Input
                          value={exercise.tempo}
                          onChange={(e) => updateExercise(index, 'tempo', e.target.value)}
                          placeholder="2-1-2-1"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Notes</label>
                        <Input
                          value={exercise.notes}
                          onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                          placeholder="Special instructions"
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl max-h-[80vh] m-4">
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
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search exercises..."
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-2 overflow-y-auto">
              {filteredExercises.map((exercise) => (
                <Card 
                  key={exercise.id} 
                  className="cursor-pointer hover:bg-gray-50 transition-colors" 
                  onClick={() => addExercise(exercise)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{exercise.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{exercise.description}</p>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">{exercise.category}</Badge>
                          <Badge variant="outline" className="text-xs">{exercise.equipment}</Badge>
                          {exercise.muscle_groups?.slice(0, 2).map(muscle => (
                            <Badge key={muscle} variant="outline" className="text-xs">
                              {muscle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredExercises.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No exercises found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};