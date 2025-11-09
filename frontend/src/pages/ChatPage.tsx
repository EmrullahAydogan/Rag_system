import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Bot, User, FileText, Wifi, WifiOff, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatApi } from '@/api/client';
import type { Message, ChatRequest } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatRelativeTime } from '@/utils/format';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<number | undefined>();
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [useWebSocketMode, setUseWebSocketMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // WebSocket connection
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/chat/ws';
  const { isConnected, isTyping, sendMessage: sendWebSocketMessage } = useWebSocket(WS_URL, {
    onMessage: (message) => {
      switch (message.type) {
        case 'conversation':
          if (message.conversation_id) {
            setCurrentConversationId(message.conversation_id);
          }
          break;
        case 'assistant_start':
          setIsStreaming(true);
          setStreamingMessage('');
          break;
        case 'chunk':
          if (message.content) {
            setStreamingMessage((prev) => prev + message.content);
          }
          break;
        case 'complete':
          setIsStreaming(false);
          setStreamingMessage('');
          // Refresh conversation data
          if (currentConversationId) {
            queryClient.invalidateQueries({ queryKey: ['conversation', currentConversationId] });
          }
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          break;
        case 'error':
          console.error('WebSocket error:', message.error);
          setIsStreaming(false);
          setStreamingMessage('');
          break;
      }
    },
    onError: (error) => {
      console.error('WebSocket connection error:', error);
    },
  });

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

    if (useWebSocketMode && isConnected) {
      // Use WebSocket
      const success = sendWebSocketMessage({
        message: input,
        conversation_id: currentConversationId,
      });

      if (success) {
        setInput('');
      } else {
        console.error('Failed to send WebSocket message');
      }
    } else {
      // Fallback to REST API
      sendMessageMutation.mutate({
        message: input,
        conversation_id: currentConversationId,
      });
    }
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
  }, [messages, streamingMessage, isTyping]);

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
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {conversation?.title || 'New Chat'}
            {useWebSocketMode && (
              <span className="inline-flex items-center gap-1 text-xs font-normal">
                {isConnected ? (
                  <>
                    <Wifi className="w-3 h-3 text-green-500" />
                    <span className="text-green-600">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-500">Offline</span>
                  </>
                )}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500">Ask anything about our products and services</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseWebSocketMode(!useWebSocketMode)}
            className="btn-secondary text-xs"
            title={`Switch to ${useWebSocketMode ? 'REST API' : 'WebSocket'} mode`}
          >
            {useWebSocketMode ? 'Live Mode' : 'Standard Mode'}
          </button>
          <button
            onClick={handleNewChat}
            className="btn-secondary text-sm"
          >
            New Chat
          </button>
        </div>
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

          {/* Typing indicator */}
          {isTyping && !isStreaming && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <div className="bg-white border border-gray-200 rounded-lg p-4 inline-block">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Streaming message */}
          {isStreaming && streamingMessage && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">AI Assistant</span>
                  <span className="text-xs text-green-600">Typing...</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{streamingMessage}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading for REST API */}
          {sendMessageMutation.isPending && !useWebSocketMode && (
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
              disabled={sendMessageMutation.isPending || isStreaming || isTyping}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sendMessageMutation.isPending || isStreaming || isTyping}
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
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  const feedbackMutation = useMutation({
    mutationFn: (rating: number) => chatApi.addFeedback(message.id, rating),
    onSuccess: () => {
      // Feedback submitted successfully
    },
  });

  const handleFeedback = (type: 'positive' | 'negative') => {
    const rating = type === 'positive' ? 1 : -1;
    setFeedback(type);
    feedbackMutation.mutate(rating);
  };

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

          {/* Feedback buttons for AI messages */}
          {!isUser && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
              <span className="text-xs text-gray-500">Was this helpful?</span>
              <button
                onClick={() => handleFeedback('positive')}
                disabled={feedback !== null}
                className={`p-1.5 rounded transition-colors ${
                  feedback === 'positive'
                    ? 'bg-green-100 text-green-600'
                    : 'hover:bg-gray-100 text-gray-400 hover:text-green-600'
                }`}
                title="Helpful"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFeedback('negative')}
                disabled={feedback !== null}
                className={`p-1.5 rounded transition-colors ${
                  feedback === 'negative'
                    ? 'bg-red-100 text-red-600'
                    : 'hover:bg-gray-100 text-gray-400 hover:text-red-600'
                }`}
                title="Not helpful"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
              {feedback && (
                <span className="text-xs text-gray-500 ml-2">Thank you for your feedback!</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
