import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useFitness } from '@/contexts/FitnessContext';
import ProgramCard from './ProgramCard';
import ProgramForm from './ProgramForm';
import ProgramDetail from './ProgramDetail';
import { FitnessProgram } from '@/types/fitness';
import { Plus, Search, BarChart3, Users, DollarSign, RefreshCw, Database, Home } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AdminProgramManager: React.FC = () => {
  const { programs, addProgram, updateProgram, deleteProgram, refreshPrograms, loading } = useFitness();
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<FitnessProgram | undefined>();
  const [viewingProgram, setViewingProgram] = useState<FitnessProgram | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [dbStatus, setDbStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const filteredPrograms = programs.filter(program =>
    program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (program: FitnessProgram) => {
    setEditingProgram(program);
    setShowForm(true);
  };

  const handleView = (program: FitnessProgram) => {
    setViewingProgram(program);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      setDbStatus('saving');
      try {
        await deleteProgram(id);
        setDbStatus('saved');
        setTimeout(() => setDbStatus('idle'), 2000);
      } catch (error) {
        setDbStatus('error');
        setTimeout(() => setDbStatus('idle'), 3000);
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProgram(undefined);
  };

  const handleSave = async (programData: Omit<FitnessProgram, 'id' | 'createdAt' | 'updatedAt'>) => {
    setDbStatus('saving');
    try {
      await addProgram(programData);
      setDbStatus('saved');
      handleFormClose();
      setTimeout(() => setDbStatus('idle'), 2000);
    } catch (error) {
      setDbStatus('error');
      setTimeout(() => setDbStatus('idle'), 3000);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<FitnessProgram>) => {
    setDbStatus('saving');
    try {
      await updateProgram(id, updates);
      setDbStatus('saved');
      handleFormClose();
      setTimeout(() => setDbStatus('idle'), 2000);
    } catch (error) {
      setDbStatus('error');
      setTimeout(() => setDbStatus('idle'), 3000);
    }
  };

  const handleShowOnHomePageToggle = async (program: FitnessProgram, showOnHomePage: boolean) => {
    setDbStatus('saving');
    try {
      await updateProgram(program.id, { showOnHomePage });
      setDbStatus('saved');
      setTimeout(() => setDbStatus('idle'), 2000);
      toast({ title: `Program ${showOnHomePage ? 'added to' : 'removed from'} home page` });
    } catch (error) {
      setDbStatus('error');
      setTimeout(() => setDbStatus('idle'), 3000);
    }
  };

  const handleManualRefresh = async () => {
    await refreshPrograms();
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

  if (viewingProgram) {
    return (
      <ProgramDetail
        program={viewingProgram}
        onBack={() => setViewingProgram(undefined)}
        onStartProgram={() => console.log('Starting program:', viewingProgram.title)}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Program Manager
          </h1>
          <p className="text-gray-600 mt-1">Create and manage fitness programs</p>
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
              {programs.length === 0 ? 'No programs yet' : 'No programs found'}
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {programs.length === 0 
                ? 'Create your first fitness program to get started'
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
              <Card key={program.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <ProgramCard
                      program={program}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onView={handleView}
                      isAdmin={true}
                    />
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <Checkbox
                      id={`home-${program.id}`}
                      checked={program.showOnHomePage || false}
                      onCheckedChange={(checked) => 
                        handleShowOnHomePageToggle(program, checked as boolean)
                      }
                    />
                    <label 
                      htmlFor={`home-${program.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Show on Home Page
                    </label>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Form Dialog */}
      <ProgramForm
        open={showForm}
        onOpenChange={handleFormClose}
        program={editingProgram}
        onSave={handleSave}
        onUpdate={handleUpdate}
      />
    </div>
  );
};

export default AdminProgramManager;