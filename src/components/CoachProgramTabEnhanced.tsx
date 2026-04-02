import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, Save, Loader2, AlertCircle, Edit, Eye, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

interface Program {
  id: string;
  title: string;
  description: string;
  user_id: string;
  coach_id: string;
  is_active: boolean;
  created_at: string;
  user_name?: string;
  structure?: { weeks: any[] };
}

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export const CoachProgramTabEnhanced: React.FC = () => {
  const { currentUser } = useAppContext();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchPrograms(), fetchUsers()]);
    } catch (error) {
      console.error('Error in loadData:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    const { data: programsData, error } = await supabase
      .from('personalized_workout_programs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    if (programsData?.length > 0) {
      const userIds = [...new Set(programsData.map(p => p.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name')
        .in('id', userIds);

      const profileMap = profiles?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      const enrichedPrograms = programsData.map(program => ({
        ...program,
        user_name: profileMap[program.user_id]?.first_name && profileMap[program.user_id]?.last_name 
  const { handleCreateProgram, handleEditProgram, handleDeleteProgram } = useCoachProgramHandlers(currentUser, fetchPrograms);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedUserId('');
    setSelectedProgram(null);
  };

  const openEditModal = (program: Program) => {
    setSelectedProgram(program);
    setTitle(program.title);
    setDescription(program.description || '');
    setSelectedUserId(program.user_id);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading programs...</p>
        </div>
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
            <Button onClick={loadData} variant="outline">Try Again</Button>
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
          <p className="text-gray-600">Create and manage workout programs</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Program
        </Button>
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No programs created yet</h3>
            <p className="text-gray-600 mb-6">Create your first workout program</p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create First Program
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
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg text-gray-900">{program.title}</h4>
                      <Badge className={program.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {program.is_active ? 'Active' : 'Draft'}
                      </Badge>
                    </div>
                    {program.description && (
                      <p className="text-sm text-gray-600 mb-3">{program.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>Assigned to: {program.user_name || 'Unknown User'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {new Date(program.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Structure: {program.structure?.weeks?.length || 0} weeks
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setSelectedProgram(program); setShowDetailModal(true); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditModal(program)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteProgram(program.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
          : profileMap[program.user_id]?.email || 'Unknown User'
      }));

      setPrograms(enrichedPrograms);
    } else {
      setPrograms([]);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name')
      .order('email');

    if (error) throw error;
    setUsers(data || []);
  };