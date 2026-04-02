import React from 'react';
import { ChatTabs } from './ChatTabs';

export const CombinedChatInterface: React.FC = () => {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Direct Chat Interface */}
      <div className="transition-all duration-500 ease-in-out">
        <div className="animate-in fade-in-0 duration-500">
          <ChatTabs />
        </div>
      </div>
    </div>
  );
};
