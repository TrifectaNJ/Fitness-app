import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { fetchUserProgressData } from './UserProgressDataProcessor';
import { 
  Users, Search, Download, Filter, Calendar, 
  Droplets, Weight, Footprints, Flame, 
  TrendingUp, BarChart3, Clock, Target,
  Shield, AlertCircle, CheckCircle2, ArrowLeft,
  Activity, Trophy, Zap
} from 'lucide-react';

interface UserProgressData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
  trackers: {
    water: { current: number; goal: number; entries: number; streak: number };
    weight: { current: number; goal: number; entries: number; change: number };
    steps: { current: number; goal: number; entries: number; streak: number };
    calories: { current: number; goal: number; entries: number; streak: number };
  };
  programs: {
    total: number;
    completed: number;
    completion_rate: number;
    active: number;
  };
  coach_programs: {
    assigned: number;
    completed: number;
    coach_name?: string;
  };
  last_activity: string;
  weekly_progress: {
    water_avg: number;
    weight_change: number;
    steps_avg: number;
    calories_avg: number;
  };
  assigned_coach_id?: string;
}

const ModernUserProgressDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserProgressData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProgressData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProgressData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('30');
  const [trackerFilter, setTrackerFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [permissionError, setPermissionError] = useState('');
  const { userRole, permissions, loading: roleLoading } = useRolePermissions();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && !roleLoading && userRole) {
      fetchUsersProgress();
    }
  }, [currentUser, userRole, roleLoading, dateFilter]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, trackerFilter]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser({ ...user, ...profile });
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUsersProgress = async () => {
    if (!permissions.canViewUserProgress) {
      setPermissionError("You don't have permission to view user progress.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase.from('user_profiles').select('*');

      // Role-based filtering
      if (userRole === 'coach') {
        query = query.eq('assigned_coach_id', currentUser.id);
      } else if (userRole === 'user') {
        setPermissionError("You don't have permission to view user progress.");
        setLoading(false);
        return;
      }

      const { data: userProfiles, error } = await query;

      const usersWithProgress = await Promise.all(
        (userProfiles || []).map(async (user) => {
          const progressData = await fetchUserProgressData(user.id, dateFilter);
          return { ...user, ...progressData };
        })
      );

      setUsers(usersWithProgress);
      setFilteredUsers(usersWithProgress);
    } catch (error) {
      console.error('Error fetching users progress:', error);
      setPermissionError('Error loading user progress data.');
    } finally {
      setLoading(false);
    }
  };