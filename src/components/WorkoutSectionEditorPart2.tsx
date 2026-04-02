import React, { useState } from 'react';
import { WorkoutSubsection, Exercise } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowUpDown } from 'lucide-react';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';
import { SubsectionExerciseReorder } from './SubsectionExerciseReorder';
import { supabase } from '@/lib/supabase';


interface WorkoutSectionEditorUIProps {
  subsections: WorkoutSubsection[];
  editingSubsection: string | null;
  editingTitle: string;
  loading: boolean;
  libraryOpen: boolean;
  selectedSubsectionId: string | null;
  adding: boolean;
  toast: any;
  loadSubsections: () => Promise<void>;
  addSubsection: (sectionKey: string) => Promise<void>;
  debouncedUpdateTitle: (subsectionId: string, newTitle: string) => Promise<void>;
  setEditingSubsection: (id: string | null) => void;
  setEditingTitle: (title: string) => void;
  setLibraryOpen: (open: boolean) => void;
  setSelectedSubsectionId: (id: string | null) => void;
  setSubsections: React.Dispatch<React.SetStateAction<WorkoutSubsection[]>>;
}

const HARDCODED_SECTIONS = [
  { key: 'warm-up', title: 'Warm Up' },
  { key: 'main-workout', title: 'Main Workout' },
  { key: 'cool-down', title: 'Cool Down' }
];

const addExercisesToSubsection = async (selectedExercises: Exercise[], subsectionId: string, toast: any) => {
  if (!selectedExercises || selectedExercises.length === 0 || !subsectionId) {
    toast({
      title: 'Error',
      description: 'Missing exercises or subsection ID',
      variant: 'destructive'
    });
    return false;
  }

  try {
    console.log('Adding exercises to subsection:', subsectionId, selectedExercises);
    
    // Delete existing exercises for this subsection
    await supabase
      .from('workout_subsection_exercises')
      .delete()
      .eq('subsection_id', subsectionId);

    // Insert new exercises
    const rowsToInsert = selectedExercises.map((ex, index) => ({
      subsection_id: subsectionId,
      exercise_id: ex.id,
      sort_order: index
    }));

    console.log('Inserting exercise rows:', rowsToInsert);

    const { error } = await supabase
      .from('workout_subsection_exercises')
      .insert(rowsToInsert);

    if (error) {
      console.error('Insert error:', error);
      toast({
        title: 'Failed to save exercises',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }

    toast({
      title: 'Success',
      description: `Added ${selectedExercises.length} exercises to subsection.`,
    });

    return true;
  } catch (error: any) {
    console.error('Error saving exercises:', error);
    toast({
      title: 'Error',
      description: `Failed to save exercises: ${error.message}`,
      variant: 'destructive'
    });
    return false;
  }
};

export const WorkoutSectionEditorUI: React.FC<WorkoutSectionEditorUIProps> = ({
  subsections,
  editingSubsection,
  editingTitle,
  loading,
  libraryOpen,
  selectedSubsectionId,
  adding,
  toast,
  loadSubsections,
  addSubsection,
  debouncedUpdateTitle,
  setEditingSubsection,
  setEditingTitle,
  setLibraryOpen,
  setSelectedSubsectionId,
  setSubsections
}) => {
  const [reorderingSubsectionId, setReorderingSubsectionId] = useState<string | null>(null);


  const handleLibrarySelect = async (exercises: Exercise[]) => {
    if (!selectedSubsectionId || exercises.length === 0) {
      setLibraryOpen(false);
      setSelectedSubsectionId(null);
      return;
    }

    const success = await addExercisesToSubsection(exercises, selectedSubsectionId, toast);
    
    if (success) {
      // Reload subsections to show updated exercises
      await loadSubsections();
    }
    
    setLibraryOpen(false);
    setSelectedSubsectionId(null);
  };

  const handleTitleBlur = async () => {
    if (editingSubsection && editingTitle.trim()) {
      await debouncedUpdateTitle(editingSubsection, editingTitle.trim());
    }
    setEditingSubsection(null);
    setEditingTitle('');
  };

  const handleTitleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await handleTitleBlur();
    }
  };

  const deleteSubsection = async (subsectionId: string) => {
    try {
      console.log('Deleting subsection:', subsectionId);
      
      // Delete exercises first
      await supabase
        .from('workout_subsection_exercises')
        .delete()
        .eq('subsection_id', subsectionId);
      
      // Delete subsection
      const { error } = await supabase
        .from('workout_subsections')
        .delete()
        .eq('id', subsectionId);
      
      if (error) throw error;
      
      setSubsections(prev => prev.filter(sub => sub.id !== subsectionId));
      
      toast({ 
        title: 'Success', 
        description: 'Subsection deleted successfully' 
      });
    } catch (error: any) {
      console.error('Error deleting subsection:', error);
      toast({ 
        title: 'Error', 
        description: `Failed to delete subsection: ${error.message}`, 
        variant: 'destructive' 
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading subsections...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        {HARDCODED_SECTIONS.map(hardcodedSection => {
          const sectionSubsections = subsections
            .filter(sub => sub.section_key === hardcodedSection.key)
            .sort((a, b) => a.sort_order - b.sort_order);

          return (
            <Card key={hardcodedSection.key} className="bg-gray-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{hardcodedSection.title}</CardTitle>
                    <Badge variant="secondary">{sectionSubsections.length} subsections</Badge>
                  </div>
                  <Button 
                    onClick={() => addSubsection(hardcodedSection.key)} 
                    size="sm" 
                    variant="outline" 
                    type="button" 
                    disabled={adding}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {adding ? 'Adding...' : 'Add Subsection'}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {sectionSubsections.map((subsection, subsectionIndex) => (
                  <Card key={subsection.id} className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-blue-600">
                            Subsection {subsectionIndex + 1}:
                          </span>
                          {editingSubsection === subsection.id ? (
                            <Input 
                              value={editingTitle} 
                              onChange={(e) => setEditingTitle(e.target.value)} 
                              onBlur={handleTitleBlur} 
                              onKeyDown={handleTitleKeyDown} 
                              className="h-8 w-48" 
                              autoFocus 
                            />
                          ) : (
                            <span 
                              className="font-medium cursor-pointer hover:text-blue-800" 
                              onClick={() => { 
                                setEditingSubsection(subsection.id); 
                                setEditingTitle(subsection.subsection_title); 
                              }}
                            >
                              {subsection.subsection_title}
                            </span>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteSubsection(subsection.id)} 
                          type="button"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-2">
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => { 
                            setSelectedSubsectionId(subsection.id); 
                            setLibraryOpen(true); 
                          }} 
                          size="sm" 
                          variant="outline" 
                          type="button"
                        >
                          📚 From Library
                        </Button>
                        {subsection.exercises && subsection.exercises.length > 0 && (
                          <Button 
                            onClick={() => setReorderingSubsectionId(subsection.id)} 
                            size="sm" 
                            variant="outline"
                            className="bg-orange-100 hover:bg-orange-200 border-orange-300"
                            type="button"
                          >
                            <ArrowUpDown className="h-4 w-4 mr-1" />
                            Reorder
                          </Button>
                        )}
                      </div>
                      
                      {reorderingSubsectionId === subsection.id ? (
                        <SubsectionExerciseReorder
                          subsectionId={subsection.id}
                          exercises={subsection.exercises || []}
                          onReorderComplete={async () => {
                            setReorderingSubsectionId(null);
                            await loadSubsections();
                          }}
                          onCancel={() => setReorderingSubsectionId(null)}
                        />
                       ) : (
                        <div className="space-y-1">
                          {subsection.exercises?.map((exercise, exerciseIndex) => (
                            <div key={`${exercise.id}-${exerciseIndex}`} className="flex items-center justify-between bg-white p-2 rounded border">
                              <span className="text-sm font-medium">{exercise.name}</span>
                              <div className="text-xs text-gray-500">
                                {exercise.duration}s
                                {exercise.reps && exercise.sets && ` • ${exercise.reps}×${exercise.sets}`}
                              </div>
                            </div>
                          )) || []}
                          {(!subsection.exercises || subsection.exercises.length === 0) && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              No exercises yet. Click "From Library" to add some.
                            </div>
                          )}
                        </div>
                      )}

                    </CardContent>
                  </Card>
                ))}
                
                {sectionSubsections.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No subsections yet. Click "Add Subsection" to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <ExerciseLibraryModal 
        open={libraryOpen} 
        onOpenChange={setLibraryOpen} 
        onSelect={handleLibrarySelect} 
      />
    </>
  );
};

export default WorkoutSectionEditorUI;