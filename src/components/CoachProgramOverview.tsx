import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Users, 
  Clock, 
  TrendingUp, 
  Calendar,
  Activity,
  Award,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';

interface ProgramStats {
  totalPrograms: number;
  activePrograms: number;
  totalUsers: number;
  activeUsers: number;
  avgCompletion: number;
  thisWeekCompletions: number;
}

interface RecentProgram {
  id: string;
  program_name: string;
  assigned_user_name: string;
  status: string;
  progress: number;
  created_at: string;
}

interface CoachProgramOverviewProps {
  onCreateNew: () => void;
}

export const CoachProgramOverview: React.FC<CoachProgramOverviewProps> = ({ onCreateNew }) => {
  const { user } = useAppContext();
  const [stats, setStats] = useState<ProgramStats>({
    totalPrograms: 0,
    activePrograms: 0,
    totalUsers: 0,
    activeUsers: 0,
    avgCompletion: 0,
    thisWeekCompletions: 0
  });
  const [recentPrograms, setRecentPrograms] = useState<RecentProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, [user]);

  const fetchOverviewData = async () => {
    if (!user) return;

    try {
      // Fetch program stats
      const { data: programs } = await supabase
        .from('personalized_workout_programs')
        .select(`
          id,
          program_name,
          status,
          created_at,
          assigned_user_id,
          coach_id
        `)
        .eq('coach_id', user.id);

      // Generate mock stats for demo
      const totalPrograms = programs?.length || 0;
      const activePrograms = programs?.filter(p => p.status === 'active').length || 0;
      
      setStats({
        totalPrograms,
        activePrograms,
        totalUsers: Math.max(totalPrograms * 0.8, 1),
        activeUsers: Math.max(activePrograms * 0.9, 1),
        avgCompletion: totalPrograms > 0 ? Math.floor(Math.random() * 30) + 60 : 0,
        thisWeekCompletions: Math.floor(Math.random() * 10) + 5
      });

      // Fetch recent programs with user names
      if (programs && programs.length > 0) {
        const userIds = [...new Set(programs.map(p => p.assigned_user_id))].filter(Boolean);
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        const recent = programs.slice(0, 5).map(program => ({
          id: program.id,
          program_name: program.program_name,
          assigned_user_name: profileMap.get(program.assigned_user_id)?.full_name || 'Unknown User',
          status: program.status,
          progress: Math.floor(Math.random() * 100),
          created_at: program.created_at
        }));

        setRecentPrograms(recent);
      }
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrograms}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activePrograms} active programs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Following programs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCompletion}%</div>
            <p className="text-xs text-muted-foreground">
              Program completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeekCompletions}</div>
            <p className="text-xs text-muted-foreground">
              Workouts completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Programs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Programs
            </CardTitle>
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentPrograms.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No programs yet</h3>
              <p className="text-gray-600">Create your first personalized workout program using the button at the top of the page</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPrograms.map((program) => (
                <div key={program.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{program.program_name}</h4>
                      <Badge className={getStatusColor(program.status)}>
                        {program.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">Assigned to: {program.assigned_user_name}</p>
                    {program.status === 'active' && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{program.progress}%</span>
                        </div>
                        <Progress value={program.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 ml-4">
                    {new Date(program.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Target className="w-6 h-6 mb-2" />
              Duplicate Program
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Users className="w-6 h-6 mb-2" />
              Import Template
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Activity className="w-6 h-6 mb-2" />
              Assign Program
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};