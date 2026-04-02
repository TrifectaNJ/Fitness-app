import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export const useCoachProgramHandlers = (
  currentUser: any,
  fetchPrograms: () => Promise<void>
) => {
  const { toast } = useToast();

  const handleCreateProgram = async (
    title: string,
    description: string,
    selectedUserId: string,
    setSaving: (saving: boolean) => void,
    resetForm: () => void,
    setShowCreateModal: (show: boolean) => void
  ) => {
    if (!title.trim() || !selectedUserId) {
      toast({ title: 'Validation Error', description: 'Please fill in title and select a user', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('personalized_workout_programs')
        .insert([{
          title: title.trim(),
          description: description.trim() || '',
          user_id: selectedUserId,
          coach_id: currentUser?.id,
          exercises: [],
          is_active: true,
          structure: {
            weeks: [{
              id: 'week-1',
              title: 'Week 1',
              days: [{ id: 'day-1', title: 'Day 1', exercises: [] }]
            }]
          }
        }]);
        
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Program created successfully' });
      resetForm();
      setShowCreateModal(false);
      await fetchPrograms();
      
    } catch (error) {
      console.error('Error creating program:', error);
      toast({ title: 'Error', description: 'Failed to create program', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditProgram = async (
    selectedProgram: any,
    title: string,
    description: string,
    selectedUserId: string,
    setSaving: (saving: boolean) => void,
    resetForm: () => void,
    setShowEditModal: (show: boolean) => void
  ) => {
    if (!selectedProgram || !title.trim()) {
      toast({ title: 'Validation Error', description: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('personalized_workout_programs')
        .update({ title: title.trim(), description: description.trim() || '', user_id: selectedUserId })
        .eq('id', selectedProgram.id);
        
      if (error) throw error;
      toast({ title: 'Success', description: 'Program updated successfully' });
      resetForm();
      setShowEditModal(false);
      await fetchPrograms();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update program', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProgram = async (programId: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return;
    try {
      const { error } = await supabase.from('personalized_workout_programs').delete().eq('id', programId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Program deleted successfully' });
      await fetchPrograms();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete program', variant: 'destructive' });
    }
  };

  return { handleCreateProgram, handleEditProgram, handleDeleteProgram };
};