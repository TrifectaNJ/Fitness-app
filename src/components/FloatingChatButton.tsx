import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageCircle, X } from 'lucide-react';
import { RealtimeUserCoachChat } from './RealtimeUserCoachChat';

interface FloatingChatButtonProps {
  currentUser?: { id: string; name: string } | null;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleChat = () => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(!isMinimized);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && !isMinimized && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={closeChat}
        />
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className={`fixed z-50 transition-all duration-300 ${
          isMinimized 
            ? 'bottom-4 right-4 w-80 h-14' 
            : 'bottom-4 right-4 w-96 h-[500px]'
        }`}>
          <Card className="w-full h-full shadow-2xl border-2 border-blue-200">
            <RealtimeUserCoachChat 
              onClose={closeChat}
              onMinimize={minimizeChat}
              isMinimized={isMinimized}
            />
          </Card>
        </div>
      )}

      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-2xl border-2 border-white animate-pulse"
          size="lg"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      )}
    </>
  );
};
