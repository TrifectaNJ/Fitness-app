import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Program {
  id: string;
  title: string;
  description: string;
  user_id: string;
  coach_id: string;
  exercises: any;
  created_at: string;
  is_active: boolean;
}

export const CoachProgramTabFixed: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProgram, setNewProgram] = useState({
    title: '',
    description: '',
    user_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      console.log('Loading programs...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        toast({
          title: "Error",
          description: "Please log in to view programs",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('personalized_workout_programs')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading programs:', error);
        toast({
          title: "Error loading programs",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Programs loaded:', data);
      setPrograms(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Failed to load programs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createProgram = async () => {
    if (!newProgram.title.trim()) {
      toast({
        title: "Error",
        description: "Program title is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const programData = {
        title: newProgram.title.trim(),
        description: newProgram.description.trim() || null,
        coach_id: user.id,
        user_id: newProgram.user_id || user.id,
        exercises: [],
        is_active: true
      };

      const { data, error } = await supabase
        .from('personalized_workout_programs')
        .insert([programData])
        .select()
        .single();

      if (error) {
        console.error('Error creating program:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setPrograms(prev => [data, ...prev]);
      setNewProgram({ title: '', description: '', user_id: '' });
      setShowCreateForm(false);
      
      toast({
        title: "Success",
        description: "Program created successfully"
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Failed to create program",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Coach Programs
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage personalized workout programs
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Program
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Program</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={newProgram.title}
                onChange={(e) => setNewProgram(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border rounded-md"
                placeholder="Enter program title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={newProgram.description}
                onChange={(e) => setNewProgram(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border rounded-md h-24"
                placeholder="Enter program description"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={createProgram}
                disabled={creating}
                className="bg-green-600 hover:bg-green-700"
              >
                {creating ? 'Creating...' : 'Create Program'}
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {programs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Programs Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first personalized workout program
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Program
              </Button>
            </CardContent>
          </Card>
        ) : (
          programs.map((program) => (
            <Card key={program.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{program.title}</CardTitle>
                    {program.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {program.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Delete functionality would go here
                      console.log('Delete program:', program.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>
                    Created: {new Date(program.created_at).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    program.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {program.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};