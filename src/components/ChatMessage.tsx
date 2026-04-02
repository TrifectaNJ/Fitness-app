import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  isBot?: boolean;
}

const ChatMessage: React.FC<SimpleChatMessageProps> = ({ 
  message, 
  isUser,
  timestamp,
  isBot = false
}) => {
  const messageTime = timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={cn(
      "flex mb-3 md:mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <div className="mr-2 md:mr-3 mt-1 flex-shrink-0">
          <Avatar className="w-8 h-8 md:w-8 md:h-8">
            <AvatarFallback className={cn(
              "text-xs md:text-sm",
              isBot 
                ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white" 
                : "bg-gray-200 text-gray-600"
            )}>
              {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className={cn(
        "max-w-[85%] md:max-w-xs lg:max-w-md",
        isUser ? "ml-auto" : "mr-auto"
      )}>
        <div
          className={cn(
            "px-3 md:px-4 py-2.5 md:py-2 rounded-2xl shadow-sm",
            isUser
              ? "bg-orange-500 text-white rounded-br-sm"
              : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
          )}
        >
          <p className="text-sm md:text-sm leading-relaxed break-words whitespace-pre-wrap">
            {message}
          </p>
          
          <div className={cn(
            "flex items-center justify-end mt-1.5 md:mt-2",
            isUser ? "text-orange-100" : "text-gray-500"
          )}>
            <span className="text-xs">{messageTime}</span>
          </div>
        </div>
      </div>

      {isUser && (
        <div className="ml-2 md:ml-3 mt-1 flex-shrink-0">
          <Avatar className="w-8 h-8 md:w-8 md:h-8">
            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xs md:text-sm">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
};

export { ChatMessage };
export default ChatMessage;
