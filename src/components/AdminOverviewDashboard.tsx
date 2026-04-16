import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/contexts/AppContext';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { supabase } from '@/lib/supabase';
import {
  BarChart3,
  Users,
  Calendar,
  Home,
  Play,
  Shield,
  UserCog,
  Crown,
  Sparkles,
  TrendingUp,
  Activity
} from 'lucide-react';

interface AdminOverviewDashboardProps {
  onTabChange: (tab: string) => void;
}

const AdminOverviewDashboard: React.FC<AdminOverviewDashboardProps> = ({ onTabChange }) => {
  const { programs } = useAppContext();
  const { permissions, userRole, loading } = useRolePermissions();
  const [userStats, setUserStats] = useState({ total: 0, activeThisWeek: 0, assignedToMe: 0, coachPrograms: 0 });

  useEffect(() => {
    fetchUserStats();
  }, [userRole]);

  const fetchUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (userRole === 'coach') {
        // Coach-specific stats
        const { data: assignments } = await supabase
          .from('coach_assignments')
          .select('user_id')
          .eq('coach_id', user.id);

        const assignedUserIds = assignments?.map(a => a.user_id) || [];
        const assignedToMe = assignedUserIds.length;

        let activeThisWeek = 0;
        if (assignedUserIds.length > 0) {
          const { data: weekActive } = await supabase
            .from('day_completions')
            .select('user_id')
            .in('user_id', assignedUserIds)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
          activeThisWeek = new Set(weekActive?.map(r => r.user_id) || []).size;
        }

        const { count: coachPrograms } = await supabase
          .from('coach_programs')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', user.id);

        setUserStats({ total: 0, activeThisWeek, assignedToMe, coachPrograms: coachPrograms || 0 });
      } else {
        // Admin stats
        const [{ count: totalUsers }, { data: weekActive }] = await Promise.all([
          supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
          supabase
            .from('day_completions')
            .select('user_id')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        ]);

        const activeThisWeek = new Set(weekActive?.map(r => r.user_id) || []).size;
        setUserStats({ total: totalUsers || 0, activeThisWeek, assignedToMe: 0, coachPrograms: 0 });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const totalRevenue = programs.reduce((sum, program) => sum + program.price, 0);
  const activePrograms = programs.filter(p => p.isActive).length;
  const totalDays = programs.reduce((sum, program) => sum + (program.days?.length || 0), 0);
  const categories = new Set(programs.map(p => p.category)).size;

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'general_admin':
      case 'admin':
        return 'Admin';
      case 'coach':
        return 'Coach';
      case 'user':
        return 'User';
      default:
        return 'User';
    }
  };

  // Show loading state while role is being fetched
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-yellow-800" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Murray Mania
          </h1>
          <p className="text-base text-gray-600 mb-3">
            Your Complete Fitness Management System
          </p>
          <Badge className="bg-gray-400 text-white px-3 py-1.5">
            <Crown className="w-3 h-3 mr-2" />
            Loading...
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Murray Mania Logo Section */}
      <div className="text-center py-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
        <div className="flex justify-center mb-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-yellow-800" />
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Murray Mania
        </h1>
        <p className="text-base text-gray-600 mb-3">
          Your Complete Fitness Management System
        </p>
        <Badge className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5">
          <Crown className="w-3 h-3 mr-2" />
          {getRoleDisplayName(userRole)}
        </Badge>
      </div>

      {userRole === 'coach' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">My Clients</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{userStats.assignedToMe}</div>
              <p className="text-sm text-gray-500 mt-1">Assigned to you</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Clients Active This Week</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{userStats.activeThisWeek}</div>
              <p className="text-sm text-gray-500 mt-1">Logged a workout</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">My Programs</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{userStats.coachPrograms}</div>
              <p className="text-sm text-gray-500 mt-1">Programs created by you</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Programs</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{programs.length}</div>
              <p className="text-sm text-gray-500 mt-1">{activePrograms} currently active</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{userStats.total}</div>
              <p className="text-sm text-gray-500 mt-1">Registered users</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active This Week</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{userStats.activeThisWeek}</div>
              <p className="text-sm text-gray-500 mt-1">Logged a workout</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Workout Days</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalDays}</div>
              <p className="text-sm text-gray-500 mt-1">Total training sessions</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {userRole === 'coach' ? (
            <>
              <Button
                onClick={() => onTabChange('coach-programs')}
                className="h-24 flex-col gap-3 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Play className="w-6 h-6" />
                <span className="text-sm">Coach Programs</span>
              </Button>
              <Button
                onClick={() => onTabChange('exercises')}
                className="h-24 flex-col gap-3 bg-green-500 hover:bg-green-600 text-white"
              >
                <BarChart3 className="w-6 h-6" />
                <span className="text-sm">Exercise Library</span>
              </Button>
              <Button
                onClick={() => onTabChange('user-progress')}
                className="h-24 flex-col gap-3 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <TrendingUp className="w-6 h-6" />
                <span className="text-sm">Client Progress</span>
              </Button>
            </>
          ) : (
            <>
              {permissions.canViewHome && (
                <Button
                  onClick={() => onTabChange('homepage')}
                  className="h-24 flex-col gap-3 bg-gradient-to-r from-orange-500 to-blue-600 text-white hover:from-orange-600 hover:to-blue-700"
                >
                  <Home className="w-6 h-6" />
                  <span className="text-sm">Edit Home</span>
                </Button>
              )}
              {permissions.canViewPrograms && (
                <Button
                  onClick={() => onTabChange('programs')}
                  className="h-24 flex-col gap-3 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Play className="w-6 h-6" />
                  <span className="text-sm">Programs</span>
                </Button>
              )}
              {permissions.canViewAdminInvites && (
                <Button
                  onClick={() => onTabChange('admin-invites')}
                  className="h-24 flex-col gap-3 bg-green-500 hover:bg-green-600 text-white"
                >
                  <Shield className="w-6 h-6" />
                  <span className="text-sm">Admin Invites</span>
                </Button>
              )}
              {permissions.canViewAllUsers && (
                <Button
                  onClick={() => onTabChange('all-users')}
                  className="h-24 flex-col gap-3 bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <UserCog className="w-6 h-6" />
                  <span className="text-sm">All Users</span>
                </Button>
              )}
              <Button
                onClick={() => onTabChange('user-progress')}
                className="h-24 flex-col gap-3 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <TrendingUp className="w-6 h-6" />
                <span className="text-sm">User Progress</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewDashboard;