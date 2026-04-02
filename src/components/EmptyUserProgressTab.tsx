import React from 'react';

interface EmptyUserProgressTabProps {
  currentUserId: string;
  userRole: string;
}

export function EmptyUserProgressTab({ currentUserId, userRole }: EmptyUserProgressTabProps) {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">User Progress</h2>
        <p className="text-gray-500">This tab is empty and ready for new implementation.</p>
      </div>
    </div>
  );
}

export default EmptyUserProgressTab;