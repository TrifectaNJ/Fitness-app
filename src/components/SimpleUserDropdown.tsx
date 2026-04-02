import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { useRolePermissions } from '@/hooks/useRolePermissions';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface SimpleUserDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const SimpleUserDropdown: React.FC<SimpleUserDropdownProps> = ({
  value,
  onValueChange,
  placeholder = "Select a user..."
}) => {
  const { currentUser } = useAppContext();
  const { userRole } = useRolePermissions();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!currentUser) return;

      try {
        if (userRole === 'super_admin' || userRole === 'admin') {
          const { data } = await supabase
            .from('user_profiles')
            .select('id, email, first_name, last_name')
            .eq('role', 'user')
            .order('email');
          
          setUsers(data || []);
        } else if (userRole === 'coach') {
          const { data: assignments } = await supabase
            .from('coach_assignments')
            .select('user_id')
            .eq('coach_id', currentUser.id);
          
          if (assignments?.length) {
            const userIds = assignments.map(a => a.user_id);
            const { data } = await supabase
              .from('user_profiles')
              .select('id, email, first_name, last_name')
              .in('id', userIds)
              .order('email');
            
            setUsers(data || []);
          }
        }
      } catch (error) {
        console.error('Error loading users:', error);
        setUsers([]);
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

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {users.length === 0 ? (
          <SelectItem value="" disabled>
            {userRole === 'coach' ? 'No assigned users' : 'No users available'}
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