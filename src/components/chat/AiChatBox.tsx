
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, RefreshCcw, User, Bot } from 'lucide-react';
import { useAiChat } from '@/hooks/useAiChat';

interface AiChatBoxProps {
  systemPrompt?: string;
  title?: string;
}

const AiChatBox = ({ 
  systemPrompt = 'You are a helpful AI assistant for creative writing.',
  title = 'AI Writing Assistant'
}: AiChatBoxProps) => {
  const [inputValue, setInputValue] = useState('');
  const { messages, sendMessage, clearChat, isLoading } = useAiChat({ systemPrompt });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearChat}
            title="Clear chat"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-[450px] p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
              <Bot size={32} className="mb-2" />
              <p>Ask me anything about writing or your story!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="h-8 w-8">
                      {msg.role === 'user' 
                        ? <User className="h-4 w-4" /> 
                        : <Bot className="h-4 w-4" />
                      }
                    </Avatar>
                    <div 
                      className={`rounded-lg px-3 py-2 ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 max-w-[80%]">
                    <Avatar className="h-8 w-8">
                      <Bot className="h-4 w-4" />
                    </Avatar>
                    <div className="rounded-lg px-3 py-2 bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="pt-2">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default AiChatBox;
