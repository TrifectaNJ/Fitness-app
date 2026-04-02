import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, RefreshCw, Droplets, Scale, Activity, Utensils, Dumbbell,
  TrendingUp, TrendingDown, Minus, Shield
} from 'lucide-react';
import { useUserProgressData, UserProgressData } from '@/hooks/useUserProgressData';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { ProgressDetailPanel } from './ProgressDetailPanel';
import { supabase } from '@/lib/supabase';

interface UserInfo {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export const UserProgressTabWithPermissions: React.FC = () => {
  const { userRole, permissions, currentUser } = useRolePermissions();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('30');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string>('');

  const { progressData, loading: progressLoading, error, refetch } = useUserProgressData(
    selectedUserId, 
    parseInt(dateFilter)
  );

  useEffect(() => {
    if (currentUser?.id) {
      fetchUsers();
    }
  }, [currentUser, userRole]);

  // Check if user can view specific user's progress
  const canViewUserProgress = (userId: string) => {
    if (!permissions.canViewUserProgress) return false;
    
    if (userRole === 'super_admin' || userRole === 'admin') {
      return true;
    }
    
    if (userRole === 'coach') {
      // Check if this user is assigned to the coach
      return users.some(user => user.id === userId);
    }
    
    return false;
  };

  const handleUserSelection = (userId: string) => {
    if (!canViewUserProgress(userId)) {
      setPermissionError("You don't have permission to view this user's progress.");
      return;
    }
    
    setPermissionError('');
    setSelectedUserId(userId);
  };

  const fetchUsers = async () => {
    if (!currentUser?.id) return;
    
    try {
      let query = supabase.from('user_profiles').select('id, full_name, email, role');
      
      if (userRole === 'coach') {
        const { data: assignments } = await supabase
          .from('user_coach_assignments')
          .select('user_id')
          .eq('coach_id', currentUser.id);
        
        const userIds = assignments?.map(a => a.user_id) || [];
        if (userIds.length > 0) {
          query = query.in('id', userIds);
        } else {
          setUsers([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query.order('full_name');
      if (error) throw error;
      
      setUsers(data || []);
      if (data && data.length > 0 && !selectedUserId) {
        setSelectedUserId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Permission check for the entire component
  if (!permissions.canViewUserProgress) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <Alert className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You don't have permission to view user progress data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderProgressCard = (type: string, data: any, icon: React.ReactNode, color: string, bgColor: string) => {
    if (!data) return null;

    const getTrendIcon = () => {
      if (data.trend === 'up') return <TrendingUp className="w-3 h-3 text-green-600" />;
      if (data.trend === 'down') return <TrendingDown className="w-3 h-3 text-red-600" />;
      return <Minus className="w-3 h-3 text-gray-400" />;
    };

    return (
      <Card
        key={type}
        className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${bgColor} border-2`}
        onClick={() => setSelectedCard(type)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg bg-white ${color}`}>
              {icon}
            </div>
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900 capitalize">
            {type}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">
              {type === 'weight' ? data.current : data.today}{data.unit && ` ${data.unit}`}
            </span>
            <span className="text-sm text-gray-500">
              / {type === 'weight' ? data.goal : data.goal}{data.unit && ` ${data.unit}`}
            </span>
          </div>
          
          <div className="space-y-2">
            <Progress value={data.progress || 0} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{Math.round(data.progress || 0)}% complete</span>
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span>{data.trend}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-end justify-between h-8 gap-1">
            {data.weeklyData?.map((value: number, index: number) => (
              <div
                key={index}
                className={`bg-current opacity-60 rounded-sm ${color}`}
                style={{
                  height: `${Math.max((value / Math.max(...data.weeklyData)) * 100, 4)}%`,
                  minHeight: '4px'
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading || progressLoading) {
    return <div className="p-6 text-center">Loading progress data...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {permissionError && (
        <Alert className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {permissionError}
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Progress</h1>
            <p className="text-gray-600 mt-1">
              {progressData ? `Viewing: ${progressData.userName} (${progressData.userEmail})` : 'Select a user to view progress'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
              {['7', '30', '90'].map((days) => (
                <Button
                  key={days}
                  variant={dateFilter === days ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDateFilter(days)}
                >
                  {days} days
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || !selectedUserId}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {filteredUsers.length > 0 && (
            <select
              value={selectedUserId}
              onChange={(e) => handleUserSelection(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Select a user</option>
              {filteredUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {progressData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderProgressCard('water', progressData.water, <Droplets className="w-6 h-6" />, 'text-blue-600', 'bg-blue-50 border-blue-200')}
            {renderProgressCard('weight', progressData.weight, <Scale className="w-6 h-6" />, 'text-purple-600', 'bg-purple-50 border-purple-200')}
            {renderProgressCard('steps', progressData.steps, <Activity className="w-6 h-6" />, 'text-green-600', 'bg-green-50 border-green-200')}
            {renderProgressCard('calories', progressData.calories, <Utensils className="w-6 h-6" />, 'text-orange-600', 'bg-orange-50 border-orange-200')}
          </div>

          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-white text-indigo-600">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">Workouts & Programs</CardTitle>
                  <p className="text-gray-600 text-sm">Track workout completion and program progress</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">This Week</span>
                  <div className="text-2xl font-bold">{progressData.workouts.thisWeek}</div>
                  <p className="text-xs text-gray-500">workouts completed</p>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">This Month</span>
                  <div className="text-2xl font-bold">{progressData.workouts.thisMonth}</div>
                  <p className="text-xs text-gray-500">total workouts</p>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Current Streak</span>
                  <div className="text-2xl font-bold">{progressData.workouts.streak}</div>
                  <p className="text-xs text-gray-500">consecutive days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedCard && progressData && (
        <ProgressDetailPanel
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          title={selectedCard}
          data={progressData[selectedCard as keyof UserProgressData]}
          readOnly={true}
        />
      )}
    </div>
  );
};

export default UserProgressTabWithPermissions;