import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Smile } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<boolean>;
  onTyping?: () => void;
  placeholder?: string;
  disabled?: boolean;
  showAttachments?: boolean;
  showEmojis?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onTyping,
  placeholder = "Type your message...",
  disabled = false,
  showAttachments = false,
  showEmojis = false
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    
    setSending(true);
    const success = await onSendMessage(message.trim());
    
    if (success) {
      setMessage('');
      inputRef.current?.focus();
    }
    
    setSending(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (onTyping) {
      onTyping();
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        // Could emit "stopped typing" event here
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end space-x-2 p-0">
      {showAttachments && (
        <Button
          variant="ghost"
          size="sm"
          className="mb-1 text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] md:min-w-[36px] md:min-h-[36px]"
          disabled={disabled}
        >
          <Paperclip className="w-4 h-4 md:w-4 md:h-4" />
        </Button>
      )}
      
      <div className="flex-1">
        <Input
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || sending}
          className="resize-none border-gray-300 focus:border-orange-500 focus:ring-orange-500 h-12 md:h-10 text-base md:text-sm"
        />
      </div>
      
      {showEmojis && (
        <Button
          variant="ghost"
          size="sm"
          className="mb-1 text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] md:min-w-[36px] md:min-h-[36px]"
          disabled={disabled}
        >
          <Smile className="w-4 h-4 md:w-4 md:h-4" />
        </Button>
      )}
      
      <Button
        onClick={handleSend}
        disabled={disabled || sending || !message.trim()}
        size="sm"
        className="mb-1 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white min-w-[48px] min-h-[48px] md:min-w-[36px] md:min-h-[36px]"
      >
        {sending ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};

export { ChatInput };
export default ChatInput;
