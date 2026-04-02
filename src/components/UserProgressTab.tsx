import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, RefreshCw, Droplets, Weight, Footprints, Flame, Dumbbell, TrendingUp, Calendar, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Progress } from './ui/progress';

interface UserProgressTabProps {
  userRole?: string;
  currentUserId?: string;
}

export const UserProgressTab: React.FC<UserProgressTabProps> = ({ userRole, currentUserId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('30');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, [userRole, currentUserId]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserProgress(selectedUser);
    }
  }, [selectedUser, dateFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('user_profiles').select('*');
      
      if (userRole === 'coach') {
        const { data: assignments } = await supabase
          .from('user_assignments')
          .select('assigned_user_id')
          .eq('coach_id', currentUserId);
        
        const userIds = assignments?.map(a => a.assigned_user_id) || [];
        if (userIds.length > 0) {
          query = query.in('id', userIds);
        }
      }
      
      const { data } = await query;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async (userId: string) => {
    setLoading(true);
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateFilter));

      const [water, weight, steps, calories, workouts] = await Promise.all([
        supabase.from('water_intake').select('*').eq('user_id', userId).gte('date', daysAgo.toISOString()),
        supabase.from('weight_entries').select('*').eq('user_id', userId).gte('date', daysAgo.toISOString()),
        supabase.from('steps_entries').select('*').eq('user_id', userId).gte('date', daysAgo.toISOString()),
        supabase.from('calorie_entries').select('*').eq('user_id', userId).gte('date', daysAgo.toISOString()),
        supabase.from('workout_completions').select('*').eq('user_id', userId).gte('completed_at', daysAgo.toISOString())
      ]);

      setProgressData({
        water: water.data || [],
        weight: weight.data || [],
        steps: steps.data || [],
        calories: calories.data || [],
        workouts: workouts.data || []
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedUser) {
      fetchUserProgress(selectedUser);
    } else {
      fetchUsers();
    }
  };

  const openModal = (type: string, data: any[]) => {
    setModalData({ type, data });
    setModalOpen(true);
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUserData = users.find(u => u.id === selectedUser);

  const getLatestValue = (entries: any[], field: string) => {
    if (!entries || entries.length === 0) return 0;
    return entries[entries.length - 1][field] || 0;
  };

  const getProgress = (current: number, target: number) => {
    if (!target) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">User Progress</h1>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRefresh} variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* User Selection */}
      {!selectedUser && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card 
              key={user.id} 
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => setSelectedUser(user.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{user.full_name || user.email}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Progress Display */}
      {selectedUser && progressData && (
        <div className="space-y-4">
          <Button onClick={() => setSelectedUser(null)} variant="outline">
            ← Back to Users
          </Button>
          
          <h2 className="text-xl font-semibold">
            {selectedUserData?.full_name || selectedUserData?.email}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Water Card */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => openModal('water', progressData.water)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-gray-500">Water</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {getLatestValue(progressData.water, 'amount')}ml
                </p>
                <Progress value={getProgress(getLatestValue(progressData.water, 'amount'), 2000)} className="mt-2" />
              </CardContent>
            </Card>

            {/* Weight Card */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => openModal('weight', progressData.weight)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Weight className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-gray-500">Weight</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {getLatestValue(progressData.weight, 'weight')}kg
                </p>
              </CardContent>
            </Card>

            {/* Steps Card */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => openModal('steps', progressData.steps)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Footprints className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-500">Steps</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {getLatestValue(progressData.steps, 'steps').toLocaleString()}
                </p>
                <Progress value={getProgress(getLatestValue(progressData.steps, 'steps'), 10000)} className="mt-2" />
              </CardContent>
            </Card>

            {/* Calories Card */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => openModal('calories', progressData.calories)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-gray-500">Calories</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {getLatestValue(progressData.calories, 'calories')}
                </p>
                <Progress value={getProgress(getLatestValue(progressData.calories, 'calories'), 2000)} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Workouts Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-indigo-600" />
                Workout Programs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{progressData.workouts.length}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">This Period</p>
                  <p className="text-2xl font-bold text-blue-600">{dateFilter} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalData?.type} History</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {modalData?.data?.map((entry: any, idx: number) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  {new Date(entry.date || entry.created_at).toLocaleDateString()}
                </p>
                <p className="font-semibold">
                  {entry.amount || entry.weight || entry.steps || entry.calories}
                  {modalData.type === 'water' && 'ml'}
                  {modalData.type === 'weight' && 'kg'}
                  {modalData.type === 'calories' && ' kcal'}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProgressTab;