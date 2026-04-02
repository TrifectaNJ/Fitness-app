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

export const CoachProgramTabSimplified: React.FC = () => {
  const { currentUser } = useAppContext();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      const [programsRes, usersRes] = await Promise.all([
        supabase.from('personalized_workout_programs').select('*').order('created_at', { ascending: false }),
        supabase.from('user_profiles').select('id, email, first_name, last_name').order('email')
      ]);
      
      if (programsRes.error) throw programsRes.error;
      if (usersRes.error) throw usersRes.error;
      
      setPrograms(programsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = async () => {
    if (!title.trim() || !selectedUserId) {
      toast({ title: 'Error', description: 'Please fill in title and select a user', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('personalized_workout_programs').insert([{
        title: title.trim(),
        description: description.trim() || '',
        user_id: selectedUserId,
        coach_id: currentUser?.id,
        exercises: [],
        is_active: true,
        structure: { weeks: [{ id: 'week-1', title: 'Week 1', days: [{ id: 'day-1', title: 'Day 1', exercises: [] }] }] }
      }]);
      
      if (error) throw error;
      toast({ title: 'Success', description: 'Program created successfully' });
      setTitle('');
      setDescription('');
      setSelectedUserId('');
      setShowCreateModal(false);
      await loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create program', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProgram = async (programId: string) => {
    if (!confirm('Delete this program?')) return;
    try {
      const { error } = await supabase.from('personalized_workout_programs').delete().eq('id', programId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Program deleted' });
      await loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete program', variant: 'destructive' });
    }
  };

  if (loading) return <div className="p-6 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" /><p>Loading...</p></div>;
  if (error) return <div className="p-6"><Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-center"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" /><h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3><p className="text-red-700 mb-4">{error}</p><Button onClick={loadData} variant="outline">Try Again</Button></CardContent></Card></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Coach Programs</h2><p className="text-gray-600">Create and manage workout programs</p></div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Add Program</Button>
      </div>

      {programs.length === 0 ? (
        <Card><CardContent className="text-center py-12"><Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 mb-2">No programs yet</h3><p className="text-gray-600 mb-6">Create your first program</p><Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Create Program</Button></CardContent></Card>
      ) : (
        <div className="grid gap-4">{programs.map((program) => (<Card key={program.id} className="hover:shadow-md transition-shadow"><CardContent className="p-6"><div className="flex items-start justify-between"><div className="flex-1"><div className="flex items-center gap-3 mb-2"><h4 className="font-semibold text-lg text-gray-900">{program.title}</h4><Badge className={program.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{program.is_active ? 'Active' : 'Draft'}</Badge></div>{program.description && (<p className="text-sm text-gray-600 mb-3">{program.description}</p>)}<div className="flex items-center gap-4 text-sm text-gray-600 mb-3"><div className="flex items-center gap-1"><Users className="w-4 h-4" /><span>User: {program.user_id}</span></div><div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>Created: {new Date(program.created_at).toLocaleDateString()}</span></div></div></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => handleDeleteProgram(program.id)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button></div></div></CardContent></Card>))}</div>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Program</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-2">Title *</label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Program title" disabled={saving} /></div>
            <div><label className="block text-sm font-medium mb-2">Description</label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} disabled={saving} /></div>
            <div><label className="block text-sm font-medium mb-2">Assign to User *</label><Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={saving}><SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger><SelectContent>{users.map((user) => (<SelectItem key={user.id} value={user.id}>{user.first_name && user.last_name ? `${user.first_name} ${user.last_name} (${user.email})` : user.email}</SelectItem>))}</SelectContent></Select></div>
            <div className="flex justify-end gap-3 pt-4"><Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={saving}>Cancel</Button><Button onClick={handleCreateProgram} disabled={saving}>{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <><Save className="w-4 h-4 mr-2" />Create</>}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};