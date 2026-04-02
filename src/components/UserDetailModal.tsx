import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Crown, User, Shield, UserCheck, Mail, Calendar, Eye, EyeOff } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  last_sign_in_at?: string;
  is_active?: boolean;
}

interface CoachAssignment {
  coach_id: string;
  coach_email: string;
  coach_name: string;
}

interface UserDetailModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, isOpen, onClose }) => {
  const [coachAssignment, setCoachAssignment] = useState<CoachAssignment | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && isOpen) {
      // Reset coach assignment state and fetch fresh data
      setCoachAssignment(null);
      fetchCoachAssignment();
    }
  }, [user, isOpen]);

  const fetchCoachAssignment = async () => {
    if (!user) return;
    
    try {
      // First get the coach assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('coach_assignments')
        .select('coach_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (assignmentError) {
        console.error('Error fetching coach assignment:', assignmentError);
        return;
      }

      if (!assignmentData) {
        setCoachAssignment(null);
        return;
      }

      // Then get the coach's profile information
      const { data: coachData, error: coachError } = await supabase
        .from('user_profiles')
        .select('email, first_name, last_name')
        .eq('id', assignmentData.coach_id)
        .single();

      if (coachError) {
        console.error('Error fetching coach profile:', coachError);
        return;
      }

      if (coachData) {
        setCoachAssignment({
          coach_id: assignmentData.coach_id,
          coach_email: coachData.email,
          coach_name: `${coachData.first_name || ''} ${coachData.last_name || ''}`.trim() || coachData.email
        });
      } else {
        setCoachAssignment(null);
      }
    } catch (error) {
      console.error('Error in fetchCoachAssignment:', error);
      setCoachAssignment(null);
    }
  };

  const sendPasswordReset = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast({
        title: "Password Reset Sent",
        description: `Password reset email sent to ${user.email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'coach': return <UserCheck className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'coach': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input 
                value={`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Not provided'} 
                readOnly 
              />
            </div>
            <div>
              <Label>Email Address</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <Input value={user.email} readOnly />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Role</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getRoleBadgeColor(user.role)}>
                  {getRoleIcon(user.role)}
                  <span className="ml-1 capitalize">{user.role.replace('_', ' ')}</span>
                </Badge>
              </div>
            </div>
            <div>
              <Label>Account Status</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.is_active !== false ? "default" : "secondary"}>
                  {user.is_active !== false ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date Joined</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <Input 
                  value={new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} 
                  readOnly 
                />
              </div>
            </div>
            <div>
              <Label>Last Login</Label>
              <Input 
                value={user.last_sign_in_at 
                  ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Never'
                } 
                readOnly 
              />
            </div>
          </div>

          <div>
            <Label>Assigned Coach</Label>
            <Input 
              value={coachAssignment 
                ? `${coachAssignment.coach_name} (${coachAssignment.coach_email})`
                : 'No coach assigned'
              } 
              readOnly 
            />
          </div>

          <div>
            <Label>Password Management</Label>
            <div className="flex items-center gap-2 mt-2">
              <Button 
                onClick={sendPasswordReset}
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Sending...' : 'Send Password Reset'}
              </Button>
              <p className="text-sm text-gray-500">
                For security, passwords cannot be displayed. Use reset to help users recover access.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;