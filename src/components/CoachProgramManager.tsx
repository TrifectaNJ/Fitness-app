import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppContext } from '@/contexts/AppContext';
import CoachProgramCard from './CoachProgramCard';
import CoachProgramForm from './CoachProgramForm';
import ProgramDetail from './ProgramDetail';
import { Plus, Search, BarChart3, Users, DollarSign, RefreshCw, Database, Home } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface CoachProgram {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  price: number;
  paymentType: 'one-time' | 'monthly';
  imageUrl?: string;
  videoUrl?: string;
  instructions: string[];
  days: any[];
  isActive: boolean;
  showOnHomePage?: boolean;
  assignedUserId?: string;
  assignedUserEmail?: string;
  createdAt: string;
  updatedAt: string;
}

const CoachProgramManager: React.FC = () => {
  const { currentUser } = useAppContext();
  const [programs, setPrograms] = useState<CoachProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<CoachProgram | undefined>();
  const [viewingProgram, setViewingProgram] = useState<CoachProgram | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [dbStatus, setDbStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('coach_programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes('relation "coach_programs" does not exist')) {
          console.log('Coach programs table does not exist yet, showing empty state');
          setPrograms([]);
          return;
        }
        throw error;
      }
      
      // Fetch days for each program from coach_program_days table
      const programIds = data?.map(p => p.id) || [];
      let daysMap: { [key: string]: any[] } = {};
      
      if (programIds.length > 0) {
        const { data: daysData, error: daysError } = await supabase
          .from('coach_program_days')
          .select('*')
          .in('coach_program_id', programIds)
          .order('day_number', { ascending: true });
        
        if (!daysError && daysData) {
          daysData.forEach(day => {
            if (!daysMap[day.coach_program_id]) {
              daysMap[day.coach_program_id] = [];
            }
            daysMap[day.coach_program_id].push(day);
          });
        }
      }
      
      const formattedPrograms = data?.map(program => ({
        id: program.id,
        title: program.title,
        description: program.description,
        category: program.category || 'general',
        difficulty: program.difficulty || 'beginner',
        duration: program.duration || '4 weeks',
        price: program.price || 0,
        paymentType: program.payment_type || 'one-time',
        imageUrl: program.image_url,
        videoUrl: program.video_url,
        instructions: program.instructions || [],
        days: daysMap[program.id] || [],
        isActive: program.is_active !== false,
        showOnHomePage: program.display_on_home_page || false,
        assignedUserId: program.assigned_user_id,
        assignedUserEmail: program.assigned_user_id ? 'Loading...' : undefined,
        createdAt: program.created_at,
        updatedAt: program.updated_at
      })) || [];
      
      setPrograms(formattedPrograms);
      
      if (formattedPrograms.some(p => p.assignedUserId)) {
        fetchUserEmails(formattedPrograms);
      }
      
    } catch (error) {
      console.error('Error fetching coach programs:', error);
      if (error.message && !error.message.includes('does not exist')) {
        toast({ title: 'Error loading programs', variant: 'destructive' });
      }
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };


  const fetchUserEmails = async (programs: CoachProgram[]) => {
    try {
      const userIds = programs.filter(p => p.assignedUserId).map(p => p.assignedUserId);
      if (userIds.length === 0) return;

      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('id, email')
        .in('id', userIds);

      if (userProfiles) {
        const updatedPrograms = programs.map(program => ({
          ...program,
          assignedUserEmail: userProfiles.find(u => u.id === program.assignedUserId)?.email || 'Unknown User'
        }));
        setPrograms(updatedPrograms);
      }
    } catch (error) {
      console.error('Error fetching user emails:', error);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const filteredPrograms = programs.filter(program =>
    program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (program: CoachProgram) => {
    setEditingProgram(program);
    setShowForm(true);
  };

  const handleView = (program: CoachProgram) => {
    setViewingProgram(program);
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

  const handleSave = async (programData: any) => {
    setDbStatus('saving');
    try {
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }
      
      console.log('Creating program with user ID:', currentUser.id);
      console.log('Program data:', programData);
      
      // Only include columns that exist in the coach_programs table
      const dbData = {
        title: programData.title,
        description: programData.description,
        category: programData.category || 'general',
        difficulty: programData.difficulty || 'beginner',
        duration: programData.duration || '4 weeks',
        price: programData.isFree ? 0 : (programData.price || 0),
        payment_type: programData.paymentType || 'one-time',
        image_url: programData.imageUrl || null,
        video_url: programData.videoUrl || null,
        instructions: programData.instructions || [],
        is_active: programData.isActive !== false,
        display_on_home_page: programData.showOnHomePage || false,
        assigned_user_id: programData.assignedUserId || null,
        created_by: currentUser.id
      };

      console.log('Inserting program data:', dbData);

      const { data, error } = await supabase
        .from('coach_programs')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw new Error(error.message || 'Failed to create program');
      }
      
      console.log('Program created successfully:', data);
      
      // If there are days, insert them into coach_program_days table
      if (programData.days && programData.days.length > 0 && data?.id) {
        const daysToInsert = programData.days.map((day: any, index: number) => ({
          coach_program_id: data.id,
          day_number: index + 1,
          title: day.title || `Day ${index + 1}`,
          description: day.description || '',
          workouts: day.workouts || []
        }));
        
        const { error: daysError } = await supabase
          .from('coach_program_days')
          .insert(daysToInsert);
        
        if (daysError) {
          console.error('Error inserting days:', daysError);
          // Don't throw - the program was created successfully
        }
      }
      
      await fetchPrograms();
      setDbStatus('saved');
      handleFormClose();
      setTimeout(() => setDbStatus('idle'), 2000);
      toast({ title: 'Program created and assigned successfully' });
    } catch (error) {
      console.error('Error in handleSave:', error);
      setDbStatus('error');
      setTimeout(() => setDbStatus('idle'), 3000);
      toast({ 
        title: 'Error creating program', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
      throw error;
    }
  };


  const handleUpdate = async (id: string, updates: any) => {
    setDbStatus('saving');
    try {
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };
      
      // Map frontend field names to database column names
      const fieldMapping: { [key: string]: string } = {
        paymentType: 'payment_type',
        showOnHomePage: 'display_on_home_page',
        imageUrl: 'image_url',
        videoUrl: 'video_url',
        assignedUserId: 'assigned_user_id',
        isActive: 'is_active'
      };
      
      // Only include valid columns that exist in the database
      const validColumns = [
        'title', 'description', 'category', 'difficulty', 'duration',
        'price', 'payment_type', 'image_url', 'video_url', 'instructions',
        'is_active', 'display_on_home_page', 'assigned_user_id', 'created_by'
      ];
      
      Object.keys(updates).forEach(key => {
        const dbKey = fieldMapping[key] || key;
        // Only add if it's a valid column
        if (validColumns.includes(dbKey)) {
          dbUpdates[dbKey] = updates[key];
        }
      });

      console.log('Updating program with data:', dbUpdates);

      const { error } = await supabase
        .from('coach_programs')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      // Sync days to coach_program_days if days were included in the update
      if (updates.days !== undefined) {
        await supabase.from('coach_program_days').delete().eq('coach_program_id', id);
        if (updates.days.length > 0) {
          const daysToInsert = updates.days.map((day: any, index: number) => ({
            coach_program_id: id,
            day_number: day.day_number || day.dayNumber || index + 1,
            title: day.title || `Day ${index + 1}`,
            description: day.description || '',
            workouts: day.workouts || []
          }));
          const { error: daysError } = await supabase.from('coach_program_days').insert(daysToInsert);
          if (daysError) console.error('Error updating days:', daysError);
        }
      }

      await fetchPrograms();
      setDbStatus('saved');
      handleFormClose();
      setTimeout(() => setDbStatus('idle'), 2000);
      toast({ title: 'Program updated successfully' });
    } catch (error) {
      console.error('Error updating program:', error);
      setDbStatus('error');
      setTimeout(() => setDbStatus('idle'), 3000);
      toast({ 
        title: 'Error updating program', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    }
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
        program={viewingProgram as any}
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
            Coach Programs
          </h1>
          <p className="text-gray-600 mt-1">Create and manage personalized programs</p>
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
            onClick={fetchPrograms}
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
              <Card key={program.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CoachProgramCard
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
                        handleUpdate(program.id, { showOnHomePage: checked })
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
      <CoachProgramForm
        open={showForm}
        onOpenChange={handleFormClose}
        program={editingProgram}
        onSave={handleSave}
        onUpdate={handleUpdate}
      />
    </div>
  );
};

export default CoachProgramManager;
