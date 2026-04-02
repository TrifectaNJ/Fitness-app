import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, GraduationCap, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { CoachProgramForm } from './CoachProgramForm';

interface CoachProgram {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  payment_type: 'one-time' | 'monthly';
  image_url?: string;
  video_url?: string;
  instructions: string[];
  days: any[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const CoachProgramsManagerSimple: React.FC = () => {
  const [programs, setPrograms] = useState<CoachProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<CoachProgram | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPrograms = programs.filter(program =>
    program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadPrograms = async () => {
    try {
      setLoading(true);
      
      const { data: programsData, error: programsError } = await supabase
        .from('coach_programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (programsError) {
        console.error('Error loading coach programs:', programsError);
        throw programsError;
      }

      setPrograms(programsData || []);
    } catch (error) {
      console.error('Error loading coach programs:', error);
      toast({
        title: 'Error loading programs',
        description: 'Failed to load coach programs. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const handleEdit = (program: CoachProgram) => {
    setEditingProgram(program);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coach program?')) return;

    try {
      const { error: programError } = await supabase
        .from('coach_programs')
        .delete()
        .eq('id', id);

      if (programError) throw programError;

      setPrograms(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Coach program deleted successfully' });
    } catch (error) {
      console.error('Error deleting coach program:', error);
      toast({
        title: 'Error deleting program',
        description: 'Failed to delete coach program',
        variant: 'destructive'
      });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProgram(undefined);
  };

  const handleSave = async () => {
    await loadPrograms();
    handleFormClose();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Coach Programs
          </h1>
          <p className="text-gray-600 mt-1">Create and assign personalized programs to users</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={loadPrograms}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Coach Program
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{programs.length}</div>
          <p className="text-xs text-muted-foreground">
            {programs.filter(p => p.is_active).length} active programs
          </p>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search coach programs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading coach programs...</p>
        </div>
      )}

      {/* Programs List */}
      {!loading && filteredPrograms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {programs.length === 0 ? 'No coach programs yet' : 'No programs found'}
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {programs.length === 0 
                ? 'Create your first coach program to get started'
                : 'Try adjusting your search terms'
              }
            </p>
            {programs.length === 0 && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Coach Program
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        !loading && (
          <div className="space-y-4">
            {filteredPrograms.map((program) => (
              <Card key={program.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{program.title}</h3>
                      <Badge variant={program.is_active ? 'default' : 'secondary'}>
                        {program.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{program.difficulty}</Badge>
                      <Badge variant="secondary">{program.category}</Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{program.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Duration: {program.duration}</span>
                      <span>Price: ${program.price || 0}</span>
                      <span>Days: {program.days?.length || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(program)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(program.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Form Dialog */}
      <CoachProgramForm
        open={showForm}
        onOpenChange={handleFormClose}
        program={editingProgram}
        onSave={handleSave}
      />
    </div>
  );
};

export default CoachProgramsManagerSimple;