import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Users, Edit, Calendar, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CoachProgramCreationForm } from './CoachProgramCreationForm';
import { Badge } from '@/components/ui/badge';

interface Program {
  id: string;
  title: string;
  description: string;
  duration_weeks: number;
  level: string;
  tags: string[];
  user_id: string;
  coach_id: string;
  exercises: any;
  created_at: string;
  is_active: boolean;
  user_profiles?: {
    full_name: string;
    email: string;
  };
}

export const CoachProgramTabComplete: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      console.log('Loading coach programs...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        setPrograms([]);
        return;
      }

      const { data, error } = await supabase
        .from('personalized_workout_programs')
        .select(`
          *,
          user_profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading programs:', error);
        toast({
          title: "Error loading programs",
          description: error.message,
          variant: "destructive"
        });
        setPrograms([]);
        return;
      }

      console.log('Programs loaded successfully:', data);
      setPrograms(data || []);
    } catch (error) {
      console.error('Unexpected error loading programs:', error);
      toast({
        title: "Error",
        description: "Failed to load programs",
        variant: "destructive"
      });
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteProgram = async (programId: string) => {
    if (!confirm('Are you sure you want to delete this program?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('personalized_workout_programs')
        .delete()
        .eq('id', programId);

      if (error) {
        console.error('Error deleting program:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setPrograms(prev => prev.filter(p => p.id !== programId));
      toast({
        title: "Success",
        description: "Program deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting program:', error);
      toast({
        title: "Error",
        description: "Failed to delete program",
        variant: "destructive"
      });
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadPrograms();
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

  if (showCreateForm) {
    return (
      <div className="p-6">
        <CoachProgramCreationForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
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
            Create and manage personalized workout programs for your clients
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Coach Program
        </Button>
      </div>

      <div className="space-y-4">
        {programs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Coach Programs Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first personalized workout program for your clients
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Coach Program
              </Button>
            </CardContent>
          </Card>
        ) : (
          programs.map((program) => (
            <Card key={program.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{program.title}</CardTitle>
                    {program.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {program.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {program.level && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {program.level}
                        </Badge>
                      )}
                      {program.duration_weeks && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {program.duration_weeks} weeks
                        </Badge>
                      )}
                      {program.tags && program.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        <strong>Assigned to:</strong>{' '}
                        {program.user_profiles?.full_name || program.user_profiles?.email || 'Unknown User'}
                      </p>
                      <p>
                        <strong>Created:</strong>{' '}
                        {new Date(program.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Edit functionality would go here
                        console.log('Edit program:', program.id);
                        toast({
                          title: "Info",
                          description: "Edit functionality coming soon"
                        });
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteProgram(program.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    program.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
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