import React, { useState, useEffect, useCallback } from 'react';
import { WorkoutSection, WorkoutSubsection, Exercise } from '@/types/fitness';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { WorkoutSectionEditorUI } from './WorkoutSectionEditorPart2';

interface WorkoutSectionEditorProps {
  workoutId: string;
  availableExercises: Exercise[];
  onSectionsChange?: (sections: WorkoutSection[]) => void;
}

const WorkoutSectionEditor: React.FC<WorkoutSectionEditorProps> = ({
  workoutId,
  availableExercises,
  onSectionsChange
}) => {
  const [subsections, setSubsections] = useState<WorkoutSubsection[]>([]);
  const [editingSubsection, setEditingSubsection] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedSubsectionId, setSelectedSubsectionId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  const loadSubsections = useCallback(async () => {
    if (!workoutId) {
      console.log('No workoutId provided, skipping subsection load');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading subsections for workout:', workoutId);
      
      // First, load subsections
      const { data: subsectionData, error: subsectionError } = await supabase
        .from('workout_subsections')
        .select('*')
        .eq('workout_id', workoutId)
        .order('sort_order');

      if (subsectionError) {
        console.error('Error loading subsections:', subsectionError);
        throw subsectionError;
      }
      
      console.log('Loaded subsections:', subsectionData);
      
      // Then load exercises for each subsection
      const subsectionsWithExercises = await Promise.all(
        (subsectionData || []).map(async (sub) => {
          try {
            const { data: exerciseData, error: exerciseError } = await supabase
              .from('workout_subsection_exercises')
              .select(`
                id,
                exercise_id,
                sort_order,
                exercise_library (
                  id,
                  name,
                  duration,
                  reps,
                  sets,
                  description,
                  instructions,
                  image_url,
                  video_url
                )
              `)
              .eq('subsection_id', sub.id)
              .order('sort_order');

            if (exerciseError) {
              console.error(`Error loading exercises for subsection ${sub.id}:`, exerciseError);
              // Don't throw here, just log and continue with empty exercises
            }
            
            console.log(`Exercises for subsection ${sub.id}:`, exerciseData);
            
            const exercises = (exerciseData || []).map((ex: any) => {
              const exerciseLib = ex.exercise_library;
              if (!exerciseLib) {
                console.warn(`No exercise_library data for exercise_id ${ex.exercise_id}`);
                return null;
              }
              
              return {
                id: exerciseLib.id,
                name: exerciseLib.name || 'Unknown Exercise',
                duration: exerciseLib.duration || 30,
                reps: exerciseLib.reps || 0,
                sets: exerciseLib.sets || 1,
                description: exerciseLib.description || '',
                instructions: Array.isArray(exerciseLib.instructions) ? 
                  exerciseLib.instructions : 
                  (exerciseLib.instructions ? [exerciseLib.instructions] : []),
                imageUrl: exerciseLib.image_url,
                videoUrl: exerciseLib.video_url,
                order: ex.sort_order || 0
              };
            }).filter(Boolean).sort((a: any, b: any) => a.order - b.order);
            
            return {
              id: sub.id,
              section_id: sub.section_id || '',
              section_key: sub.section_key,
              subsection_title: sub.subsection_title,
              repeat_count: sub.repeat_count || 1,
              sort_order: sub.sort_order,
              exercises
            };
          } catch (error) {
            console.error(`Error processing subsection ${sub.id}:`, error);
            return {
              id: sub.id,
              section_id: sub.section_id || '',
              section_key: sub.section_key,
              subsection_title: sub.subsection_title,
              repeat_count: sub.repeat_count || 1,
              sort_order: sub.sort_order,
              exercises: []
            };
          }
        })
      );
      
      console.log('Final formatted subsections:', subsectionsWithExercises);
      setSubsections(subsectionsWithExercises);
    } catch (error: any) {
      console.error('Error loading subsections:', error);
      toast({
        title: 'Error',
        description: `Failed to load subsections: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [workoutId, toast]);

  useEffect(() => {
    loadSubsections();
  }, [loadSubsections]);

  const addSubsection = async (sectionKey: string) => {
    if (adding || !workoutId) return;
    
    setAdding(true);
    
    try {
      const existingSubsections = subsections.filter(sub => sub.section_key === sectionKey);
      const sortOrder = existingSubsections.length;
      
      const insertData = {
        subsection_title: 'New Subsection',
        sort_order: sortOrder,
        section_key: sectionKey,
        repeat_count: 1,
        workout_id: workoutId
      };

      console.log('Inserting subsection:', insertData);

      const { data, error } = await supabase
        .from('workout_subsections')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('Inserted subsection:', data);

      const newSubsection: WorkoutSubsection = {
        id: data.id,
        section_id: data.section_id || '',
        section_key: sectionKey,
        subsection_title: data.subsection_title,
        repeat_count: data.repeat_count || 1,
        sort_order: data.sort_order,
        exercises: []
      };

      setSubsections(prev => [...prev, newSubsection]);
      setEditingSubsection(data.id);
      setEditingTitle(data.subsection_title);
      
      toast({
        title: 'Success',
        description: 'Subsection added successfully'
      });
    } catch (error: any) {
      console.error('Error adding subsection:', error);
      toast({
        title: 'Error',
        description: `Failed to add subsection: ${error.message || 'Unknown error'}`,
        variant: 'destructive'
      });
    } finally {
      setAdding(false);
    }
  };

  const debouncedUpdateTitle = useCallback(
    async (subsectionId: string, newTitle: string) => {
      try {
        const { error } = await supabase
          .from('workout_subsections')
          .update({ subsection_title: newTitle })
          .eq('id', subsectionId);

        if (error) throw error;
        
        setSubsections(prev => prev.map(sub => 
          sub.id === subsectionId ? { ...sub, subsection_title: newTitle } : sub
        ));
        
        toast({
          title: 'Success',
          description: 'Subsection title updated successfully'
        });
      } catch (error) {
        console.error('Error updating subsection title:', error);
        toast({
          title: 'Error',
          description: 'Failed to update subsection title',
          variant: 'destructive'
        });
      }
    },
    [toast]
  );

  return (
    <WorkoutSectionEditorUI
      subsections={subsections}
      editingSubsection={editingSubsection}
      editingTitle={editingTitle}
      loading={loading}
      libraryOpen={libraryOpen}
      selectedSubsectionId={selectedSubsectionId}
      adding={adding}
      toast={toast}
      loadSubsections={loadSubsections}
      addSubsection={addSubsection}
      debouncedUpdateTitle={debouncedUpdateTitle}
      setEditingSubsection={setEditingSubsection}
      setEditingTitle={setEditingTitle}
      setLibraryOpen={setLibraryOpen}
      setSelectedSubsectionId={setSelectedSubsectionId}
      setSubsections={setSubsections}
    />
  );
};

export default WorkoutSectionEditor;