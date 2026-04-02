import React from 'react';

interface TypingIndicatorProps {
  userName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 flex items-center gap-1.5">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        {userName && (
          <span className="text-xs text-gray-400 ml-2">{userName} is typing...</span>
        )}
      </div>
    </div>
  );
};
