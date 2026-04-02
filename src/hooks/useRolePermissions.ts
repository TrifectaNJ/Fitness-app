import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type UserRole = 'super_admin' | 'admin' | 'coach' | 'user';

export interface RolePermissions {
  canViewOverview: boolean;
  canViewHome: boolean;
  canViewPrograms: boolean;
  canViewCoachPrograms: boolean;
  canViewExercises: boolean;
  canViewPersonalPath: boolean;
  canViewMedia: boolean;
  canViewTimers: boolean;
  canViewAdminInvites: boolean;
  canViewAllUsers: boolean;
  canViewSettings: boolean;
  canViewSystemControl: boolean;
  canViewChat: boolean;
  canDeleteUsers: boolean;
  canChangeRoles: boolean;
  canAccessAdminDashboard: boolean;

  canAssignUsers: boolean;
  canViewUserAssignments: boolean;
  canViewPersonalizedPrograms: boolean;
  canViewUserProgress: boolean;
}

const getRolePermissions = (role: UserRole): RolePermissions => {
  switch (role) {
    case 'super_admin':
      return {
        canViewOverview: true,
        canViewHome: true,
        canViewPrograms: true,
        canViewCoachPrograms: true,
        canViewExercises: true,
        canViewPersonalPath: true,
        canViewMedia: true,
        canViewTimers: true,
        canViewAdminInvites: true,
        canViewAllUsers: true,
        canViewSettings: true,
        canViewSystemControl: true,
        canViewChat: true,
        canDeleteUsers: true,
        canChangeRoles: true,
        canAccessAdminDashboard: true,

        canAssignUsers: true,
        canViewUserAssignments: true,
        canViewPersonalizedPrograms: true,
        canViewUserProgress: true,
      };
    case 'admin':
      return {
        canViewOverview: true,
        canViewHome: true,
        canViewPrograms: true,
        canViewCoachPrograms: true,
        canViewExercises: true,
        canViewPersonalPath: true,
        canViewMedia: true,
        canViewTimers: true,
        canViewAdminInvites: true,
        canViewAllUsers: true,
        canViewSettings: true,
        canViewSystemControl: false,
        canViewChat: true,
        canDeleteUsers: true,
        canChangeRoles: false,
        canAccessAdminDashboard: true,

        canAssignUsers: true,
        canViewUserAssignments: true,
        canViewPersonalizedPrograms: true,
        canViewUserProgress: true,
      };
    case 'coach':
      return {
        canViewOverview: true,
        canViewHome: true,
        canViewPrograms: true,
        canViewCoachPrograms: true,
        canViewExercises: true,
        canViewPersonalPath: true,
        canViewMedia: true,
        canViewTimers: true,
        canViewAdminInvites: false,
        canViewAllUsers: true,
        canViewSettings: true,
        canViewSystemControl: false,
        canViewChat: true,
        canDeleteUsers: false,
        canChangeRoles: false,
        canAccessAdminDashboard: true,

        canAssignUsers: false,
        canViewUserAssignments: false,
        canViewPersonalizedPrograms: true,
        canViewUserProgress: true,
      };
    case 'user':
    default:
      return {
        canViewOverview: false,
        canViewHome: false,
        canViewPrograms: false,
        canViewCoachPrograms: false,
        canViewExercises: false,
        canViewPersonalPath: false,
        canViewMedia: false,
        canViewTimers: false,
        canViewAdminInvites: false,
        canViewAllUsers: false,
        canViewSettings: true,
        canViewSystemControl: false,
        canViewChat: false,
        canDeleteUsers: false,
        canChangeRoles: false,
        canAccessAdminDashboard: false,

        canAssignUsers: false,
        canViewUserAssignments: false,
        canViewPersonalizedPrograms: false,
        canViewUserProgress: false,
      };
  }
};

export const useRolePermissions = () => {
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [permissions, setPermissions] = useState<RolePermissions>(getRolePermissions('user'));
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setUserRole('user');
          setPermissions(getRolePermissions('user'));
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        setCurrentUser(user);

        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error || !profile) {
          setUserRole('user');
          setPermissions(getRolePermissions('user'));
        } else {
          const role = profile.role as UserRole;
          setUserRole(role);
          setPermissions(getRolePermissions(role));
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('user');
        setPermissions(getRolePermissions('user'));
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { userRole, permissions, loading, currentUser };
};