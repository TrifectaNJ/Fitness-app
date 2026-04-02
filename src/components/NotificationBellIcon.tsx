import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationDropdownPanel } from './NotificationDropdownPanel';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

interface NotificationBellIconProps {
  userId: string;
  className?: string;
}

export const NotificationBellIcon: React.FC<NotificationBellIconProps> = ({ 
  userId, 
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useNotificationSystem(userId);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative hover:bg-blue-50 ${className}`}
        >
          <Bell className="w-5 h-5 text-gray-600 hover:text-blue-600" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 shadow-xl" 
        align="end"
        sideOffset={8}
      >
        <NotificationDropdownPanel userId={userId} onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};
