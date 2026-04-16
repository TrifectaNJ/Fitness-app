import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Home,
  Play,
  Dumbbell,
  Route,
  Image,
  Timer,
  Shield,
  Users,
  Server,
  Crown,
  UserPlus,
  GraduationCap,
  TrendingUp,
  MessageCircle
} from 'lucide-react';

interface AdminSidebarRedesignedProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  permissions: any;
  userRole: string;
  onChatOpen?: () => void;
}

const AdminSidebarRedesigned: React.FC<AdminSidebarRedesignedProps> = ({
  activeTab,
  onTabChange,
  permissions,
  userRole,
  onChatOpen
}) => {
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

  const menuItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      show: permissions.canViewOverview
    },
    {
      id: 'homepage',
      label: 'Home',
      icon: Home,
      show: permissions.canViewHome
    },
    {
      id: 'programs',
      label: 'Programs',
      icon: Play,
      show: permissions.canViewPrograms
    },
    {
      id: 'coach-programs',
      label: 'Coach Programs',
      icon: GraduationCap,
      show: permissions.canViewCoachPrograms
    },
    {
      id: 'exercises',
      label: 'Exercises',
      icon: Dumbbell,
      show: permissions.canViewExercises
    },
    {
      id: 'personal-path',
      label: 'Personal Path',
      icon: Route,
      show: permissions.canViewPersonalPath
    },
    {
      id: 'media',
      label: 'Media',
      icon: Image,
      show: permissions.canViewMedia
    },
    {
      id: 'timers',
      label: 'Timers',
      icon: Timer,
      show: permissions.canViewTimers
    },
    {
      id: 'all-users',
      label: 'All Users',
      icon: Users,
      show: permissions.canViewAllUsers
    },
    {
      id: 'user-progress',
      label: 'User Progress',
      icon: TrendingUp,
      show: permissions.canViewUserProgress
    },
    {
      id: 'user-assignments',
      label: 'User Assignments',
      icon: UserPlus,
      show: permissions.canAssignUsers
    },
    {
      id: 'admin-invites',
      label: 'Admin Invites',
      icon: Shield,
      show: permissions.canViewAdminInvites
    },
    {
      id: 'system-control',
      label: 'System Control',
      icon: Server,
      show: permissions.canViewSystemControl
    },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <img 
            src="https://d64gsuwffb70l.cloudfront.net/683f455091f9cbb716202747_1750122931110_fd1cfd7e.png" 
            alt="Murray Mania Logo" 
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-orange-500 via-blue-600 to-gray-800 bg-clip-text text-transparent">
              Murray Mania
            </h1>
            <Badge className="text-xs text-white bg-gradient-to-r from-orange-500 to-blue-600 mt-1">
              <Crown className="w-3 h-3 mr-1" />
              {getRoleDisplayName(userRole)}
            </Badge>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          if (!item.show) return null;
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11 text-left",
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Button>
          );
        })}

        {/* Chat — opens panel, not a tab */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 text-left text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={onChatOpen}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">Chat</span>
        </Button>
      </nav>
    </div>
  );
};

export default AdminSidebarRedesigned;