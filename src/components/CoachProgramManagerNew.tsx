import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, BarChart3, Users, DollarSign, RefreshCw, Database, Home } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import CoachProgramCard from './CoachProgramCard';
import CoachProgramFormNew from './CoachProgramFormNew';

interface CoachProgram {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  paymentType: 'one-time' | 'monthly';
  imageUrl?: string;
  videoUrl?: string;
  instructions: string[];
  isActive: boolean;
  showOnHomePage: boolean;
  assignedUserId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const CoachProgramManagerNew: React.FC = () => {
  const { currentUser } = useAppContext();
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

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coach_programs')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching coach programs:', error);
      toast({ title: 'Error loading programs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleEdit = (program: CoachProgram) => {
    setEditingProgram(program);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      setDbStatus('saving');
      try {
        const { error } = await supabase
          .from('coach_programs')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        await fetchPrograms();
        setDbStatus('saved');
        setTimeout(() => setDbStatus('idle'), 2000);
        toast({ title: 'Program deleted successfully' });
      } catch (error) {
        setDbStatus('error');
        setTimeout(() => setDbStatus('idle'), 3000);
        toast({ title: 'Error deleting program', variant: 'destructive' });
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProgram(undefined);
  };

  const handleSave = async () => {
    await fetchPrograms();
    handleFormClose();
  };

  const handleManualRefresh = async () => {
    await fetchPrograms();
    toast({ title: 'Programs refreshed' });
  };

  const totalRevenue = programs.reduce((sum, program) => sum + program.price, 0);
  const activePrograms = programs.filter(p => p.isActive).length;
  const homePagePrograms = programs.filter(p => p.showOnHomePage).length;

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
          <p className="text-gray-600 mt-1">Create and manage personalized fitness programs</p>
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
            Add Program
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Home Page</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{homePagePrograms}</div>
            <p className="text-xs text-muted-foreground">
              Featured programs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search programs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading programs...</p>
        </div>
      )}

      {/* Programs Grid */}
      {!loading && filteredPrograms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {programs.length === 0 ? 'No coach programs yet' : 'No programs found'}
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {programs.length === 0 
                ? 'Create your first personalized program to get started'
                : 'Try adjusting your search terms'
              }
            </p>
            {programs.length === 0 && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Program
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        !loading && (
          <div className="space-y-4">
            {filteredPrograms.map((program) => (
              <CoachProgramCard
                key={program.id}
                program={program}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )
      )}

      {/* Form Dialog */}
      <CoachProgramFormNew
        open={showForm}
        onOpenChange={handleFormClose}
        program={editingProgram}
        onSave={handleSave}
      />
    </div>
  );
};

export default CoachProgramManagerNew;