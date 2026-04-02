import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserCoachChatSimple } from './UserCoachChatSimple';
import { CoachInboxPanel } from './CoachInboxPanel';
import { CoachMessageCenter } from './CoachMessageCenter';
import { supabase } from '@/lib/supabase';

export const CoachChat = () => {
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserRole('user');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserRole(profile.role || 'user');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <p>Loading...</p>
      </Card>
    );
  }

  // Show coach message center for coaches, admins, and super admins
  // Show assigned coach message center for coaches, admins, and super admins
  if (['coach', 'admin', 'super_admin'].includes(userRole)) {
    return <CoachInboxPanel />;
  }

  // Show assigned user chat for regular users (only if assigned to a coach)
  return <UserCoachChatSimple />;
};