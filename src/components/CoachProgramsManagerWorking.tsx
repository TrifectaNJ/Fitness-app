import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Users, Calendar, GraduationCap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import CoachProgramFormNew from './CoachProgramFormNew';

interface CoachProgram {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  paymentType: 'one-time' | 'monthly';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  instructions: string[];
  isActive: boolean;
  showOnHomePage: boolean;
  imageUrl?: string;
  videoUrl?: string;
  assignedUserId?: string;
  createdBy: string;
  created_at: string;
  updated_at?: string;
}

const CoachProgramsManagerWorking: React.FC = () => {
  const [programs, setPrograms] = useState<CoachProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<CoachProgram | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const transformDbToForm = (dbProgram: any): CoachProgram => {
    return {
      id: dbProgram.id,
      title: dbProgram.title || '',
      description: dbProgram.description || '',
      category: dbProgram.category || '',
      price: dbProgram.price || 0,
      paymentType: dbProgram.payment_type === 'free' ? 'one-time' : (dbProgram.payment_type || 'one-time'),
      difficulty: dbProgram.difficulty || 'beginner',
      duration: dbProgram.duration || '',
      instructions: dbProgram.instructions || [],
      isActive: dbProgram.is_active ?? true,
      showOnHomePage: dbProgram.display_on_home_page ?? false,
      imageUrl: dbProgram.image_url || '',
      videoUrl: dbProgram.video_url || '',
      assignedUserId: dbProgram.assigned_user_id || '',
      createdBy: dbProgram.created_by || '',
      created_at: dbProgram.created_at,
      updated_at: dbProgram.updated_at
    };
  };

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coach_programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedPrograms = (data || []).map(transformDbToForm);
      setPrograms(transformedPrograms);
    } catch (error) {
      console.error('Error fetching coach programs:', error);
      toast({
        title: 'Error fetching programs',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (program: CoachProgram) => {
    setEditingProgram(program);
  };

  const handleSave = async () => {
    await fetchPrograms();
    toast({
      title: 'Success',
      description: 'Program updated successfully!',
      variant: 'default'
    });
  };

  const filteredPrograms = programs.filter(program =>
    program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid gap-4">
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Coach Programs
          </h1>
          <p className="text-gray-600 mt-1">Manage and create coaching programs</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Program
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredPrograms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm ? 'No programs found' : 'No coach programs yet'}
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Create your first coaching program to get started'
              }
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Program
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPrograms.map((program) => (
            <Card key={program.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                  <div>
                    <CardTitle className="text-lg">{program.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{program.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={program.isActive ? "default" : "secondary"}>
                    {program.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit(program)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{program.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{program.difficulty}</span>
                  </div>
                  <div>
                    Created {new Date(program.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CoachProgramFormNew
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSave={handleSave}
      />

      {/* Edit Modal */}
      <CoachProgramFormNew
        open={!!editingProgram}
        onOpenChange={(open) => !open && setEditingProgram(null)}
        program={editingProgram || undefined}
        onSave={handleSave}
      />
    </div>
  );
};

export default CoachProgramsManagerWorking;