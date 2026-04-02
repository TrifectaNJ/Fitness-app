import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface MessageStatusIndicatorProps {
  status: 'sent' | 'delivered' | 'read';
  className?: string;
}

export const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({ 
  status, 
  className = '' 
}) => {
  if (status === 'sent') {
    return (
      <Check 
        className={`w-3.5 h-3.5 text-gray-400 ${className}`} 
        strokeWidth={2.5}
      />
    );
  }

  if (status === 'delivered') {
    return (
      <CheckCheck 
        className={`w-3.5 h-3.5 text-gray-400 ${className}`} 
        strokeWidth={2.5}
      />
    );
  }

  // read status
  return (
    <CheckCheck 
      className={`w-3.5 h-3.5 text-blue-400 ${className}`} 
      strokeWidth={2.5}
    />
  );
};
