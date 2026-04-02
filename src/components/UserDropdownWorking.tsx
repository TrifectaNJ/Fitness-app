import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface UserDropdownWorkingProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const UserDropdownWorking: React.FC<UserDropdownWorkingProps> = ({
  value,
  onValueChange,
  placeholder = "Select a user..."
}) => {
  const { currentUser } = useAppContext();
  const { userRole } = useRolePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(false);
        console.log('Loading users for role:', userRole);

        if (userRole === 'super_admin' || userRole === 'admin') {
          // Super Admin and Admin see all regular users
          const { data, error: queryError } = await supabase
            .from('user_profiles')
            .select('id, email, first_name, last_name')
            .eq('role', 'user')
            .order('email');
          
          if (queryError) throw queryError;
          setUsers(data || []);
          
        } else if (userRole === 'coach') {
          // Coaches only see their assigned users
          const { data: assignments, error: assignError } = await supabase
            .from('coach_assignments')
            .select('user_id')
            .eq('coach_id', currentUser.id);
          
          if (assignError) throw assignError;

          if (assignments?.length) {
            const userIds = assignments.map(a => a.user_id);
            const { data, error: queryError } = await supabase
              .from('user_profiles')
              .select('id, email, first_name, last_name')
              .in('id', userIds)
              .order('email');
            
            if (queryError) throw queryError;
            setUsers(data || []);
          } else {
            setUsers([]);
          }
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.error('Error loading users:', error);
        setError(true);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [currentUser, userRole]);

  const getUserDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name} (${user.email})`;
    }
    return user.email;
  };

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue>
            <div className="flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading users...
            </div>
          </SelectValue>
        </SelectTrigger>
      </Select>
    );
  }

  if (error) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Error loading users" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {users.length === 0 ? (
          <SelectItem value="" disabled>
            {userRole === 'coach' ? 'No assigned users found' : 'No users available'}
          </SelectItem>
        ) : (
          users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {getUserDisplayName(user)}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};