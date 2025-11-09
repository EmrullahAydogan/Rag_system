import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Bot, User, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatApi } from '@/api/client';
import type { Message, ChatRequest } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatRelativeTime } from '@/utils/format';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<number | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Get conversation if exists
  const { data: conversation } = useQuery({
    queryKey: ['conversation', currentConversationId],
    queryFn: () => chatApi.getConversation(currentConversationId!),
    enabled: !!currentConversationId,
  });

  const messages = conversation?.messages || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (request: ChatRequest) => chatApi.sendMessage(request),
    onSuccess: (data) => {
      setCurrentConversationId(data.conversation_id);
      queryClient.invalidateQueries({ queryKey: ['conversation', data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setInput('');
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;

    sendMessageMutation.mutate({
      message: input,
      conversation_id: currentConversationId,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = () => {
    setCurrentConversationId(undefined);
    setInput('');
    queryClient.removeQueries({ queryKey: ['conversation'] });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {conversation?.title || 'New Chat'}
          </h2>
          <p className="text-sm text-gray-500">Ask anything about our products and services</p>
        </div>
        <button
          onClick={handleNewChat}
          className="btn-secondary text-sm"
        >
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && !sendMessageMutation.isPending && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to TechStore AI Support
              </h3>
              <p className="text-gray-500 max-w-md">
                I can help you with product information, returns, warranties, shipping, and more.
                <br />
                Start by asking a question!
              </p>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {sendMessageMutation.isPending && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <LoadingSpinner size="sm" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message here..."
              className="flex-1 input resize-none"
              rows={3}
              disabled={sendMessageMutation.isPending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sendMessageMutation.isPending}
              className="btn-primary h-fit self-end"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className="flex gap-4">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isUser ? 'bg-gray-200' : 'bg-primary-100'
      }`}>
        {isUser ? (
          <User className="w-6 h-6 text-gray-600" />
        ) : (
          <Bot className="w-6 h-6 text-primary-600" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          <span className="text-xs text-gray-500">
            {formatRelativeTime(message.timestamp)}
          </span>
        </div>

        <div className={`rounded-lg p-4 ${
          isUser ? 'bg-gray-100' : 'bg-white border border-gray-200'
        }`}>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Sources:
              </p>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded"
                  >
                    {source.filename}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
