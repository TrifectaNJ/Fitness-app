import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Bot } from "lucide-react";

interface Message {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
  isBot?: boolean;
}

export const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      message: "Hello! I'm your AI fitness assistant. I can help with workouts, nutrition, and motivation. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
      isBot: true
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = async (messageText: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      message: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(
        'https://vdnvpolivbxtdtyaldan.supabase.co/functions/v1/fd543a10-7222-44df-a75c-e5fd1326a497',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: messageText })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }

      const data = await response.json();
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        message: data.response || "I'm sorry, I couldn't process that. Please try again.",
        isUser: false,
        timestamp: new Date(),
        isBot: true
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        message: "Sorry, I'm having trouble connecting. Please try again later.",
        isUser: false,
        timestamp: new Date(),
        isBot: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[500px] md:h-[600px] flex flex-col shadow-sm border-gray-200">
      <CardHeader className="pb-3 md:pb-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg px-4 md:px-6 py-3 md:py-4">
        <CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg">
          <div className="w-10 h-10 md:w-10 md:h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-900 font-semibold text-sm md:text-base">AI Fitness Assistant</h3>
            <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1 truncate">24/7 intelligent fitness support</p>
          </div>
          <Badge variant="outline" className="bg-white border-orange-200 text-xs hidden sm:flex">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
            AI Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-3 md:px-6 py-3 md:py-4" ref={scrollAreaRef}>
          <div className="space-y-3 md:space-y-4">
            {messages.length === 1 ? (
              <div className="text-center py-6 md:py-8 text-gray-500 px-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Bot className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm md:text-base">AI Assistant Ready!</h4>
                <p className="text-xs md:text-sm">Ask me about workouts, nutrition, or any fitness questions.</p>
              </div>
            ) : null}
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg.message}
                isUser={msg.isUser}
                timestamp={msg.timestamp}
                isBot={msg.isBot}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gradient-to-r from-orange-100 to-orange-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="border-t border-gray-100 p-3 md:p-6 bg-gray-50/50">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            placeholder="Ask me about fitness, nutrition, or workouts..."
          />
        </div>
      </CardContent>
    </Card>
  );
};
