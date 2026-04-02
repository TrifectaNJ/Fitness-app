import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

interface CoachProgramFormBasicProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  program?: any;
}

export const CoachProgramFormBasic: React.FC<CoachProgramFormBasicProps> = ({
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  program
}) => {
  const { currentUser } = useAppContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, [currentUser?.id]);

  // Pass role and users data back to parent
  useEffect(() => {
    setFormData(prev => ({ ...prev, userRole, users }));
  }, [userRole, users, setFormData]);
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);

      if (!currentUser?.id) {
        setUsers([]);
        return;
      }

      // Get current user's role
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (profileError || !profileData) {
        setUsers([]);
        return;
      }

      const role = profileData.role || '';
      setUserRole(role);

      let eligibleUsers: User[] = [];

      if (role === 'admin' || role === 'super_admin') {
        // Admins can assign to any regular user
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, email, first_name, last_name, role')
          .eq('role', 'user')
          .order('email');

        if (!error && data) eligibleUsers = data;
      } else if (role === 'coach') {
        // Coaches can only assign to their assigned users
        const { data: assignments, error: assignError } = await supabase
          .from('coach_assignments')
          .select('user_id')
          .eq('coach_id', currentUser.id);

        if (!assignError && assignments && assignments.length > 0) {
          const userIds = assignments.map(a => a.user_id);
          const { data, error } = await supabase
            .from('user_profiles')
            .select('id, email, first_name, last_name, role')
            .in('id', userIds)
            .order('email');

          if (!error && data) eligibleUsers = data;
        }
      }

      setUsers(eligibleUsers);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData(prev => ({ ...prev, instructions: newInstructions }));
  };

  const removeInstruction = (index: number) => {
    const newInstructions = formData.instructions.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, instructions: newInstructions }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter program title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter program description"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Weight Loss, Muscle Building"
                required
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration *</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 4 weeks, 8 weeks"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Program Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings & Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assignedUser">Assign to User *</Label>
              {!loadingUsers && users.length === 0 && (userRole === 'coach') ? (
                <div className="space-y-2">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      No assigned users yet. Go to User Assignments to assign a user to this coach.
                    </p>
                  </div>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="No users available" />
                    </SelectTrigger>
                  </Select>
                </div>
              ) : (
                <Select
                  value={formData.assignedUserId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assignedUserId: value }))}
                  disabled={loadingUsers}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingUsers ? "Loading users..." : users.length === 0 ? "No users available" : "Select a user"} />
                  </SelectTrigger>
                   <SelectContent>
                     {users.map((user) => {
                       const displayName = user.first_name && user.last_name 
                         ? `${user.first_name} ${user.last_name}`
                         : user.first_name || user.last_name || '';
                       
                       return (
                         <SelectItem key={user.id} value={user.id}>
                           <div className="flex items-center gap-2">
                             <User className="w-4 h-4" />
                             <span>{user.email}</span>
                             {displayName && <span className="text-gray-500">({displayName})</span>}
                           </div>
                         </SelectItem>
                       );
                     })}
                   </SelectContent>
                 </Select>
                )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isFree"
                checked={formData.isFree}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFree: checked }))}
              />
              <Label htmlFor="isFree">Free Program</Label>
            </div>

            {!formData.isFree && (
              <>
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="paymentType">Payment Type</Label>
                  <Select
                    value={formData.paymentType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-time Payment</SelectItem>
                      <SelectItem value="monthly">Monthly Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Active Program</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="showOnHomePage"
                checked={formData.showOnHomePage}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showOnHomePage: checked }))}
              />
              <Label htmlFor="showOnHomePage">Show on Home Page</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Program Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {formData.instructions.map((instruction, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    placeholder={`Instruction ${index + 1}`}
                  />
                </div>
                {formData.instructions.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeInstruction(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addInstruction}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Instruction
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};