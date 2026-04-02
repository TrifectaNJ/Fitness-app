import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { 
  Users, Search, Download, Filter, Calendar, 
  Droplets, Weight, Footprints, Flame, 
  TrendingUp, BarChart3, Clock, Target,
  Shield, AlertCircle, CheckCircle2
} from 'lucide-react';

interface UserProgressData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
  trackers: {
    water: { current: number; goal: number; entries: number };
    weight: { current: number; goal: number; entries: number };
    steps: { current: number; goal: number; entries: number };
    calories: { current: number; goal: number; entries: number };
  };
  programs: {
    total: number;
    completed: number;
    completion_rate: number;
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
}

const ComprehensiveUserProgressDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserProgressData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProgressData[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('30');
  const [trackerFilter, setTrackerFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
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