import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, BarChart3, Users, DollarSign, RefreshCw, Database, GraduationCap } from 'lucide-react';
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
  assigned_users?: any[];
}

const CoachProgramsManager: React.FC = () => {
  const [programs, setPrograms] = useState<CoachProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<CoachProgram | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [dbStatus, setDbStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const filteredPrograms = programs.filter(program =>
    program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coach_programs')
        .select(`
          *,
          coach_program_assignments!inner(
            user_id,
            user_profiles!inner(first_name, last_name, email)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const programsWithUsers = data?.map(program => ({
        ...program,
        assigned_users: program.coach_program_assignments?.map((assignment: any) => ({
          id: assignment.user_id,
          name: `${assignment.user_profiles.first_name || ''} ${assignment.user_profiles.last_name || ''}`.trim() || assignment.user_profiles.email,
          email: assignment.user_profiles.email
        })) || []
      })) || [];

      setPrograms(programsWithUsers);
    } catch (error) {
      console.error('Error loading coach programs:', error);
      toast({
        title: 'Error loading programs',
        description: 'Failed to load coach programs',
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

    setDbStatus('saving');
    try {
      const { error } = await supabase
        .from('coach_programs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPrograms(prev => prev.filter(p => p.id !== id));
      setDbStatus('saved');
      toast({ title: 'Coach program deleted successfully' });
      setTimeout(() => setDbStatus('idle'), 2000);
    } catch (error) {
      setDbStatus('error');
      console.error('Error deleting coach program:', error);
      toast({
        title: 'Error deleting program',
        description: 'Failed to delete coach program',
        variant: 'destructive'
      });
      setTimeout(() => setDbStatus('idle'), 3000);
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

  const handleManualRefresh = async () => {
    await loadPrograms();
    toast({ title: 'Coach programs refreshed' });
  };

  const totalRevenue = programs.reduce((sum, program) => sum + program.price, 0);
  const activePrograms = programs.filter(p => p.is_active).length;

  const getDbStatusColor = () => {
    switch (dbStatus) {
      case 'saving': return 'text-yellow-600';
      case 'saved': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDbStatusText = () => {
    switch (dbStatus) {
      case 'saving': return 'Saving to database...';
      case 'saved': return 'Saved to database ✓';
      case 'error': return 'Database error ✗';
      default: return 'Database ready';
    }
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
          <div className="flex items-center gap-2 mt-2">
            <Database className={`w-4 h-4 ${getDbStatusColor()}`} />
            <span className={`text-sm ${getDbStatusColor()}`}>
              {getDbStatusText()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleManualRefresh}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{programs.length}</div>
            <p className="text-xs text-muted-foreground">
              {activePrograms} active programs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From all programs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(programs.map(p => p.category)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique categories
            </p>
          </CardContent>
        </Card>
      </div>

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
                      <span>Price: ${program.price}</span>
                      <span>Days: {program.days?.length || 0}</span>
                    </div>
                    {program.assigned_users && program.assigned_users.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-1">Assigned to:</p>
                        <div className="flex flex-wrap gap-1">
                          {program.assigned_users.map((user: any) => (
                            <Badge key={user.id} variant="outline" className="text-xs">
                              {user.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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

export default CoachProgramsManager;