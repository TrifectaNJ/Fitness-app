import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Workout, Exercise } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExerciseForm } from './ExerciseForm';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';
import WorkoutSectionEditor from './WorkoutSectionEditor';
import { Plus, Edit, Trash2, Library } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useFitness } from '@/contexts/FitnessContext';

interface WorkoutFormCompleteProps {
  workout?: Workout;
  onSave: (workout: Workout) => void;
  onCancel: () => void;
  programId?: string;
  isCoachProgram?: boolean;
}

export function WorkoutFormComplete({ workout, onSave, onCancel, programId, isCoachProgram }: WorkoutFormCompleteProps) {
  const [formData, setFormData] = useState<Omit<Workout, 'id'>>({
    title: workout?.title || '',
    duration: workout?.duration || 30,
    calories: workout?.calories || 0,
    focusZones: workout?.focusZones || [],
    equipment: workout?.equipment || [],
    warmUpExercises: workout?.warmUpExercises || [],
    mainExercises: workout?.mainExercises || [],
    coolDownExercises: workout?.coolDownExercises || [],
    imageUrl: workout?.imageUrl || '',
    videoUrl: workout?.videoUrl || '',
    program_id: programId || workout?.program_id || null
  });

  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<{exercise: Exercise, type: string, index: number} | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [currentExerciseType, setCurrentExerciseType] = useState('');
  const [useSections, setUseSections] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedWorkout, setSavedWorkout] = useState<Workout | null>(workout || null);
  const { toast } = useToast();
  const { refreshPrograms } = useFitness();

  useEffect(() => {
    if (savedWorkout?.id) {
      checkForExistingSections();
    }
  }, [savedWorkout?.id]);

  const checkForExistingSections = async () => {
    try {
      const { data } = await supabase
        .from('workout_subsections')
        .select('id')
        .eq('workout_id', savedWorkout!.id)
        .limit(1);

      if (data && data.length > 0) {
        setUseSections(true);
      }
    } catch (error) {
      console.error('Error checking sections:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const workoutData = {
        title: formData.title,
        duration: formData.duration,
        calories: formData.calories,
        focus_zones: formData.focusZones,
        equipment: formData.equipment,
        image_url: formData.imageUrl,
        video_url: formData.videoUrl,
        description: formData.description || '',
        // Coach program workouts use null so the FK constraint (which references
        // the programs table, not coach_programs) is not violated.
        program_id: isCoachProgram ? null : programId
      };

      let workoutToSave = savedWorkout;

      if (!workoutToSave) {
        const { data, error } = await supabase
          .from('workouts')
          .insert([workoutData])
          .select()
          .single();

        if (error) {
          console.error('Workout insert failed:', error);
          toast({
            title: 'Save Failed',
            description: error.message || 'Could not save workout.',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }

        workoutToSave = {
          id: data.id,
          title: data.title,
          duration: data.duration,
          calories: data.calories,
          focusZones: data.focus_zones || [],
          equipment: data.equipment || [],
          imageUrl: data.image_url || '',
          videoUrl: data.video_url || '',
          description: data.description || '',
          program_id: data.program_id,
          warmUpExercises: [],
          mainExercises: [],
          coolDownExercises: []
        };
        setSavedWorkout(workoutToSave);
      } else {
        const { error } = await supabase
          .from('workouts')
          .update(workoutData)
          .eq('id', workoutToSave.id);

        if (error) {
          console.error('Workout update failed:', error);
          toast({
            title: 'Save Failed',
            description: error.message || 'Could not update workout.',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }

        workoutToSave = { ...workoutToSave, ...formData };
        setSavedWorkout(workoutToSave);
      }

      if (useSections && workoutToSave?.id) {
        await saveWorkoutSections(workoutToSave.id);
      }

      if (!isCoachProgram) await refreshPrograms();

      toast({
        title: 'Success',
        description: 'Workout saved successfully.'
      });

      setTimeout(() => {
        onSave(workoutToSave!);
      }, 100);

    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: 'Error',
        description: 'Failed to save workout',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const saveWorkoutSections = async (workoutId: string) => {
    if (!useSections) return;
    try {
      const { data: subsections, error: fetchError } = await supabase
        .from('workout_subsections')
        .select('id, workout_id')
        .or(`workout_id.is.null,workout_id.eq.`);

      if (fetchError) {
        console.error('Error fetching subsections:', fetchError);
        return;
      }

      const toUpdate = subsections?.filter(sub => !sub.workout_id) || [];

      if (toUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from('workout_subsections')
          .update({ workout_id: workoutId })
          .in('id', toUpdate.map(sub => sub.id));

        if (updateError) throw updateError;
      }
    } catch (err) {
      console.error('Failed to update workout sections:', err);
    }
  };

  const handleAddExercise = (exercise: Exercise) => {
    const key = currentExerciseType;
    const updated = [...(formData as any)[`${key}Exercises`], exercise];
    setFormData(prev => ({ ...prev, [`${key}Exercises`]: updated }));
    setShowExerciseForm(false);
    setShowLibraryModal(false);
  };

  const allExercises = [
    ...formData.warmUpExercises,
    ...formData.mainExercises,
    ...formData.coolDownExercises
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{savedWorkout ? 'Edit Workout' : 'Add Workout'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Workout Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="calories">Calories Burned (optional)</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="sections">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useSections}
                    onChange={(e) => setUseSections(e.target.checked)}
                  />
                  <Label>Use Sectioned Layout</Label>
                </div>
                {useSections && savedWorkout?.id ? (
                  <WorkoutSectionEditor
                    workoutId={savedWorkout.id}
                    availableExercises={allExercises}
                  />
                ) : useSections && !savedWorkout?.id ? (
                  <div className="text-center py-8 text-gray-500">
                    Save the workout first to enable section editing.
                  </div>
                ) : null}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Workout'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>

        {showExerciseForm && (
          <ExerciseForm
            exercise={editingExercise?.exercise}
            onSave={editingExercise ? () => {} : handleAddExercise}
            onCancel={() => {
              setShowExerciseForm(false);
              setEditingExercise(null);
            }}
          />
        )}

        {showLibraryModal && (
          <ExerciseLibraryModal
            onSelectExercise={handleAddExercise}
            onClose={() => setShowLibraryModal(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}

export const WorkoutForm = WorkoutFormComplete;