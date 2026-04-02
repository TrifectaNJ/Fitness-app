import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle } from 'lucide-react';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { cn } from '@/lib/utils';

interface MessageNotificationBadgeProps {
  userId?: string;
  onClick: () => void;
  variant?: 'user' | 'admin' | 'coach';
  className?: string;
}

const MessageNotificationBadge: React.FC<MessageNotificationBadgeProps> = ({
  userId,
  onClick,
  variant = 'user',
  className
}) => {
  const { unreadCount, loading } = useUnreadMessages(userId);

  const getVariantStyles = () => {
    switch (variant) {
      case 'admin':
        return {
          button: 'h-8 w-8 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 relative group',
          icon: 'w-4 h-4 group-hover:scale-110 transition-transform duration-200',
          badge: 'absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-200'
        };
      case 'coach':
        return {
          button: 'h-8 w-8 p-0 text-gray-600 hover:text-green-600 hover:bg-green-50 transition-all duration-200 relative group',
          icon: 'w-4 h-4 group-hover:scale-110 transition-transform duration-200',
          badge: 'absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-200'
        };
      default: // user
        return {
          button: 'relative group p-3 rounded-full bg-gradient-to-r from-orange-100 to-blue-100 hover:from-orange-200 hover:to-blue-200 border-2 border-orange-200 hover:border-orange-300 transition-all duration-300 hover:scale-105 hover:shadow-lg',
          icon: 'w-6 h-6 text-orange-600 group-hover:text-blue-600 transition-colors duration-300 group-hover:scale-110',
          badge: 'absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-500 to-blue-600 text-white text-sm font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse group-hover:animate-bounce'
        };
    }
  };

  const styles = getVariantStyles();
  const IconComponent = variant === 'user' ? Mail : MessageCircle;

  if (loading) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className={cn(styles.button, className)}
        disabled
      >
        <IconComponent className={styles.icon} />
      </Button>
    );
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onClick}
      className={cn(styles.button, className)}
      title={`${unreadCount} unread messages`}
    >
      <IconComponent className={styles.icon} />
      {unreadCount > 0 && (
        <div className={styles.badge}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </Button>
  );
};

export default MessageNotificationBadge;