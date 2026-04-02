import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Filter, Dumbbell, Heart, Target } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  equipment: string;
  difficulty: string;
  instructions?: string;
}

interface EnhancedExerciseLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectExercise: (exercise: Exercise) => void;
  selectedExercises?: string[];
}

export const EnhancedExerciseLibrary: React.FC<EnhancedExerciseLibraryProps> = ({
  open,
  onOpenChange,
  onSelectExercise,
  selectedExercises = []
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = ['Strength', 'Cardio', 'Flexibility', 'Balance', 'Sports'];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

  useEffect(() => {
    if (open) {
      fetchExercises();
    }
  }, [open]);

  useEffect(() => {
    filterExercises();
  }, [exercises, searchTerm, categoryFilter, difficultyFilter]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      // Fallback to mock data
      setExercises(mockExercises);
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exercises;

    if (searchTerm) {
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.muscle_groups.some(group => 
          group.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(exercise => exercise.category === categoryFilter);
    }

    if (difficultyFilter) {
      filtered = filtered.filter(exercise => exercise.difficulty === difficultyFilter);
    }

    setFilteredExercises(filtered);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Strength': return <Dumbbell className="w-4 h-4" />;
      case 'Cardio': return <Heart className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Exercise Library
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1">
          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search exercises or muscle groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Levels</SelectItem>
                {difficulties.map(diff => (
                  <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exercise List */}
          <ScrollArea className="flex-1 border rounded-lg">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading exercises...</p>
              </div>
            ) : (
              <div className="grid gap-3 p-4">
                {filteredExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                      selectedExercises.includes(exercise.id) ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getCategoryIcon(exercise.category)}
                          <h3 className="font-medium">{exercise.name}</h3>
                          <Badge className={getDifficultyColor(exercise.difficulty)}>
                            {exercise.difficulty}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {exercise.muscle_groups.map((group, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {group}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">
                          Equipment: {exercise.equipment}
                        </p>
                      </div>
                      <Button
                        onClick={() => onSelectExercise(exercise)}
                        size="sm"
                        variant={selectedExercises.includes(exercise.id) ? "default" : "outline"}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {selectedExercises.includes(exercise.id) ? 'Selected' : 'Add'}
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredExercises.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No exercises found matching your criteria</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Mock data for fallback
const mockExercises: Exercise[] = [
  {
    id: '1',
    name: 'Push-ups',
    category: 'Strength',
    muscle_groups: ['Chest', 'Shoulders', 'Triceps'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner'
  },
  {
    id: '2',
    name: 'Squats',
    category: 'Strength',
    muscle_groups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner'
  },
  {
    id: '3',
    name: 'Deadlifts',
    category: 'Strength',
    muscle_groups: ['Hamstrings', 'Glutes', 'Back'],
    equipment: 'Barbell',
    difficulty: 'Intermediate'
  }
];