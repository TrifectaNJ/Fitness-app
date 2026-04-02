import React, { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { useRolePermissions } from '@/hooks/useRolePermissions';

interface User {
  id: string;
  full_name: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface UserDropdownFixedProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const UserDropdownFixed: React.FC<UserDropdownFixedProps> = ({
  value,
  onValueChange,
  placeholder = "Select a user...",
  className
}) => {
  const { currentUser } = useAppContext();
  const { userRole } = useRolePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadUsers = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(false);
      
      console.log('Loading users for role:', userRole);
      
      if (userRole === 'super_admin' || userRole === 'admin') {
        // Super Admin and Admin see all regular users
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, email, first_name, last_name, role')
          .eq('role', 'user')
          .order('email');

        if (error) throw error;
        
        const transformedData = (data || []).map(user => ({
          ...user,
          full_name: user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}` 
            : user.email
        }));
        
        console.log('Loaded users for admin:', transformedData.length);
        setUsers(transformedData);
      } else if (userRole === 'coach') {
        // Coaches only see their assigned users
        const { data: assignments, error: assignError } = await supabase
          .from('coach_assignments')
          .select('user_id')
          .eq('coach_id', currentUser.id);
        
        if (assignError) throw assignError;

        if (assignments?.length) {
          const userIds = assignments.map(a => a.user_id);
          const { data, error } = await supabase
            .from('user_profiles')
            .select('id, email, first_name, last_name')
            .in('id', userIds)
            .order('email');

          if (error) throw error;
          
          const transformedData = (data || []).map(user => ({
            ...user,
            full_name: user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : user.email
          }));
          
          console.log('Loaded users for coach:', transformedData.length);
          setUsers(transformedData);
        } else {
          console.log('No assigned users for coach');
          setUsers([]);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError(true);
      setUsers([]);
      
      // Log to Sentry if available
      if (window.Sentry) {
        window.Sentry.captureException(error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentUser, userRole]);

  const selectedUser = users.find(user => user.id === value);

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <Select value="" onValueChange={() => {}}>
          <SelectTrigger className="border-red-500">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
              Failed to load users
            </div>
          </SelectTrigger>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={loadUsers}
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={loading ? "Loading users..." : placeholder}>
          {selectedUser ? `${selectedUser.full_name} (${selectedUser.email})` : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {loading ? (
          <SelectItem value="" disabled>Loading users...</SelectItem>
        ) : users.length === 0 ? (
          <SelectItem value="" disabled>
            {userRole === 'coach' ? 'No assigned users' : 'No users found'}
          </SelectItem>
        ) : (
          users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.full_name} ({user.email})
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};