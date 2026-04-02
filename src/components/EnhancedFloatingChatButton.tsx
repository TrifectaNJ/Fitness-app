import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles } from 'lucide-react';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

interface EnhancedFloatingChatButtonProps {
  currentUser: { id: string; name: string } | null;
  onClick?: () => void;
}

export const EnhancedFloatingChatButton: React.FC<EnhancedFloatingChatButtonProps> = ({ 
  currentUser, 
  onClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { unreadCount } = useUnreadMessages(currentUser?.id);

  return (
    <div className="fixed right-6 z-50 hidden md:block" style={{ bottom: '24px' }}>

      {/* Chat Button with Enhanced Design */}
      <Button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 border-0"
      >
        {/* Animated Background Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-75 animate-pulse"></div>
        
        {/* Icon */}
        <div className="relative z-10">
          <MessageCircle className="w-6 h-6 text-white" />
          {isHovered && (
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300 animate-spin" />
          )}
        </div>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}

        {/* Ripple Effect */}
        {isHovered && (
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
        )}
      </Button>

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-20 right-0 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap animate-fade-in">
          Chat with Coach
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default EnhancedFloatingChatButton;
