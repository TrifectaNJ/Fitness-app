import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/contexts/AppContext';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useDesign } from '@/contexts/DesignContext';
import { CoachInboxPanel } from './CoachInboxPanel';
import { CoachInboxDebugPanel } from './CoachInboxDebugPanel';
import { AdminHomePageManager } from './AdminHomePageManager';
import { AdminProgramManager } from './AdminProgramManager';
import { ExerciseLibraryManager } from './ExerciseLibraryManager';
import { AdminPersonalPathManager } from './AdminPersonalPathManager';
import { AdminMediaManager } from './AdminMediaManager';
import { AdminTimerManager } from './AdminTimerManager';
import { AdminPanelTab } from './AdminPanelTab';
import { UserPanelTab } from './UserPanelTab';
import { SystemControlTab } from './SystemControlTab';
import { DesignEditor } from './DesignEditor';
import { PersonalizedWorkoutProgramsTab } from './PersonalizedWorkoutProgramsTab';
import UserAssignmentManager from './UserAssignmentManager';
import MurrayManiaLogo from './MurrayManiaLogo';
import {
  Activity,
  Users, 
  DollarSign, 
  Crown, 
  Palette,
  Calendar,
  Target,
  BarChart3,
  MessageSquare,
  Shield,
  Server,
  Home,
  Play,
  UserCog,
  Sparkles,
  Dumbbell
} from 'lucide-react';

export const AdminDashboardRedesigned: React.FC = () => {
  const { programs } = useAppContext();
  const { permissions, userRole } = useRolePermissions();
  const { settings, updateSettings } = useDesign();
  const [activeTab, setActiveTab] = useState('overview');
  const [showDesignEditor, setShowDesignEditor] = useState(false);

  const totalRevenue = programs.reduce((sum, program) => sum + program.price, 0);
  const activePrograms = programs.filter(p => p.isActive).length;
  const totalDays = programs.reduce((sum, program) => sum + (program.days?.length || 0), 0);
  const categories = new Set(programs.map(p => p.category)).size;

  const statsCards = [
    {
      title: 'Total Programs',
      value: programs.length,
      subtitle: `${activePrograms} active`,
      icon: BarChart3,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Workout Days',
      value: totalDays,
      subtitle: 'Training sessions',
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Revenue Potential',
      value: `$${totalRevenue.toFixed(0)}`,
      subtitle: 'From all programs',
      icon: DollarSign,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'Categories',
      value: categories,
      subtitle: 'Unique categories',
      icon: Target,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  const quickActions = [
    {
      title: 'Edit Home',
      description: 'Customize homepage',
      icon: Home,
      color: 'from-indigo-500 to-indigo-600',
      tab: 'homepage',
      show: permissions.canViewHome
    },
    {
      title: 'Programs',
      description: 'Manage workouts',
      icon: Play,
      color: 'from-blue-500 to-blue-600',
      tab: 'programs',
      show: permissions.canViewPrograms
    },
    {
      title: 'Admin Invites',
      description: 'Invite new admins',
      icon: Shield,
      color: 'from-green-500 to-green-600',
      tab: 'admin-invites',
      show: permissions.canViewAdminInvites
    },
    {
      title: 'All Users',
      description: 'User management',
      icon: UserCog,
      color: 'from-purple-500 to-purple-600',
      tab: 'all-users',
      show: permissions.canViewAllUsers
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
               <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
                 <MurrayManiaLogo className="text-white" size={40} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Murray Mania Admin
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Complete fitness management system for coaches and administrators
          </p>
          <Badge className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
            <Crown className="w-4 h-4 mr-2" />
            Administrator Dashboard
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statsCards.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <p className="text-sm text-gray-500">{stat.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Card */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-100 px-6 pt-6">
              <TabsList className="grid w-full grid-cols-7 bg-gray-50/80 p-1 rounded-xl">
                {permissions.canViewOverview && <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>}
                {permissions.canViewHome && <TabsTrigger value="homepage" className="rounded-lg">Home</TabsTrigger>}
                {permissions.canViewPrograms && <TabsTrigger value="programs" className="rounded-lg">Programs</TabsTrigger>}
                {permissions.canViewPersonalizedPrograms && (
                  <TabsTrigger value="personalized" className="rounded-lg">
                    <Dumbbell className="w-4 h-4 mr-1" />
                    Personalized
                  </TabsTrigger>
                )}
                {permissions.canViewChat && (
                  <TabsTrigger value="chat" className="rounded-lg">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Chat
                  </TabsTrigger>
                )}
                {permissions.canViewAllUsers && <TabsTrigger value="all-users" className="rounded-lg">All Users</TabsTrigger>}
              </TabsList>
            </div>

            <div className="p-8">
              {permissions.canViewOverview && (
                <TabsContent value="overview" className="space-y-8 mt-0">
                  <div>
                    <h3 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
                      <Activity className="w-6 h-6 mr-3 text-indigo-600" />
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {quickActions.map((action, index) => {
                        if (!action.show) return null;
                        return (
                          <Button
                            key={index}
                            onClick={() => setActiveTab(action.tab)}
                            className={`h-32 flex-col gap-4 text-white bg-gradient-to-br ${action.color} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0`}
                          >
                            <action.icon className="w-8 h-8" />
                            <div className="text-center">
                              <div className="font-semibold text-base">{action.title}</div>
                              <div className="text-sm opacity-90">{action.description}</div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>
              )}

              {permissions.canViewChat && (
                <TabsContent value="chat" className="mt-0 space-y-6">
                  <CoachInboxDebugPanel />
                  <CoachInboxPanel />
                </TabsContent>
              )}


              {permissions.canViewHome && (
                <TabsContent value="homepage" className="mt-0">
                  <div>Homepage Manager</div>
                </TabsContent>
              )}

              {permissions.canViewPrograms && (
                <TabsContent value="programs" className="mt-0">
                  <div>Program Manager</div>
                </TabsContent>
              )}

              {permissions.canViewPersonalizedPrograms && (
                <TabsContent value="personalized" className="mt-0">
                  <PersonalizedWorkoutProgramsTab />
                </TabsContent>
              )}

              {permissions.canViewAllUsers && (
                <TabsContent value="all-users" className="mt-0">
                  <div>User Management</div>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </Card>
      </div>
      </div>

      <DesignEditor
        open={showDesignEditor}
        onOpenChange={setShowDesignEditor}
        onSave={updateSettings}
        currentSettings={settings}
      />
    </div>
  );
};

export default AdminDashboardRedesigned;