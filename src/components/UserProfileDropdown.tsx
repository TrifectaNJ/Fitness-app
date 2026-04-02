import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, Crown, RefreshCw } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
interface UserProfileDropdownProps {
  userDisplayName: string;
  onProfileClick: () => void;
  onSignOut: () => void;
  onSettingsClick?: () => void;
  isAdmin?: boolean;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  userDisplayName,
  onProfileClick,
  onSignOut,
  onSettingsClick,
  isAdmin = false,
}) => {
  const { forceRefresh, checkAdminStatus } = useAppContext();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const getInitial = () => {
    return userDisplayName.charAt(0).toUpperCase();
  };

  const handleAdminClick = () => {
    // Use React Router navigation for smooth transition
    navigate('/admin');
  };

  const handleForceRefresh = async () => {
    setRefreshing(true);
    try {
      forceRefresh();
      await checkAdminStatus();
      // Force a hard refresh to clear all caches
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`w-10 h-10 rounded-full text-white font-bold transition-all duration-200 ${
            isAdmin 
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
              : 'bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700'
          }`}
        >
          {getInitial()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onProfileClick}>
          <User className="w-4 h-4 mr-2" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleForceRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Force Refresh'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSettingsClick}>
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem onClick={handleAdminClick}>
            <Crown className="w-4 h-4 mr-2" />
            Admin Dashboard
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileDropdown;