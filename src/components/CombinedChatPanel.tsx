import React from 'react';
import { ProfessionalChatInterface } from './ProfessionalChatInterface';

interface CombinedChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    id: string;
    name: string;
  } | null;
  currentUserId?: string;
  userRole?: string;
}

const CombinedChatPanel: React.FC<CombinedChatPanelProps> = ({ 
  isOpen, 
  onClose,
  currentUser,
  currentUserId,
  userRole
}) => {
  const userId = currentUserId || currentUser?.id;
  
  return (
    <ProfessionalChatInterface
      isOpen={isOpen}
      onClose={onClose}
      currentUserId={userId}
      userRole={userRole}
    />
  );
};

export default CombinedChatPanel;