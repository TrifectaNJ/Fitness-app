import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Users, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { CreateProgramModal } from './CreateProgramModal';

interface Program {
  id: string;
  title: string;
  description: string;
  user_id: string;
  coach_id: string;
  is_active: boolean;
  created_at: string;
}

export const CoachProgramTabWorking: React.FC = () => {
  const { currentUser } = useAppContext();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      console.log('Loading programs...');
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('personalized_workout_programs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw fetchError;
      }
      
      console.log('Programs loaded:', data);
      setPrograms(data || []);
    } catch (error: any) {
      console.error('Error loading programs:', error);
      setError(error.message || 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgram = async (programId: string) => {
    if (!confirm('Are you sure you want to delete this program?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('personalized_workout_programs')
        .delete()
        .eq('id', programId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Program deleted successfully'
      });
      
      await loadPrograms();
    } catch (error: any) {
      console.error('Error deleting program:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete program',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p>Loading programs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Programs</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={loadPrograms} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Coach Programs</h2>
          <p className="text-gray-600">Create and manage personalized workout programs</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Program
        </Button>
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No coach programs yet</h3>
            <p className="text-gray-600 mb-6">Create your first personalized program to get started</p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Coach Program
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {programs.map((program) => (
            <Card key={program.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900 mb-2">{program.title}</h4>
                    {program.description && (
                      <p className="text-sm text-gray-600 mb-3">{program.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>User: {program.user_id}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {new Date(program.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProgram(program.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateProgramModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadPrograms}
        currentUserId={currentUser?.id || ''}
      />
    </div>
  );
};