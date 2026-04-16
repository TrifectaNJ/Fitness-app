import React from 'react';
import { Bell, Moon, Sun, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserProfileDropdown from './UserProfileDropdown';
import MessageNotificationBadge from './MessageNotificationBadge';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useTheme } from './theme-provider';

interface AdminTopBarProps {
  userDisplayName: string;
  onProfileClick: () => void;
  onSignOut: () => void;
  onSettingsClick?: () => void;
  onChatClick?: () => void;
  userId?: string;
}

const AdminTopBar: React.FC<AdminTopBarProps> = ({
  userDisplayName,
  onProfileClick,
  onSignOut,
  onSettingsClick,
  onChatClick,
  userId
}) => {
  const { markMessagesAsRead } = useUnreadMessages(userId);
  const { theme, setTheme } = useTheme();

  const handleChatClick = async () => {
    if (onChatClick) {
      onChatClick();
      await markMessagesAsRead();
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6 shadow-sm">
      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-gray-600 h-10 w-10 p-0 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>
        
        {/* Settings */}
        {onSettingsClick && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-600 h-10 w-10 p-0 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            onClick={onSettingsClick}
          >
            <Settings className="w-5 h-5" />
          </Button>
        )}
        
        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="relative text-gray-600 h-10 w-10 p-0 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <Bell className="w-5 h-5" />
        </Button>
        
        {/* Chat Notifications */}
        {onChatClick && (
          <MessageNotificationBadge
            userId={userId}
            onClick={handleChatClick}
            variant="admin"
          />
        )}
        
        {/* Profile Dropdown */}
        <div className="ml-2 pl-2 border-l border-gray-200">
          <UserProfileDropdown
            userDisplayName={userDisplayName}
            onProfileClick={onProfileClick}
            onSignOut={onSignOut}
            onSettingsClick={onSettingsClick}
            isAdmin={true}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminTopBar;