import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Send, Bot, User, X, MessageCircle, FileText, Minimize2, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatApi } from '@/api/client';
import type { Message, ChatRequest } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatRelativeTime } from '@/utils/format';

interface ChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  title?: string;
}

export default function ChatWidget({
  position = 'bottom-right',
  primaryColor = '#3b82f6',
  title = 'AI Support Chat'
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<number | undefined>();
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get conversation if exists
  const { data: conversation } = useQuery({
    queryKey: ['widget-conversation', currentConversationId],
    queryFn: () => chatApi.getConversation(currentConversationId!),
    enabled: !!currentConversationId && isOpen,
  });

  // Get available LLM providers
  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => chatApi.getProviders(),
    enabled: isOpen,
  });

  // Get available models for selected provider
  const availableModels = selectedProvider
    ? providers.find(p => p.provider === selectedProvider)?.models || []
    : [];

  const messages = conversation?.messages || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (request: ChatRequest) => chatApi.sendMessage(request),
    onSuccess: (data) => {
      setCurrentConversationId(data.conversation_id);
      setInput('');
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const llmProvider = selectedProvider || undefined;
    const model = selectedModel || undefined;

    sendMessageMutation.mutate({
      message: input,
      conversation_id: currentConversationId,
      llm_provider: llmProvider,
      model: model,
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
  }, [messages, sendMessageMutation.isPending]);

  const positionClasses = position === 'bottom-right'
    ? 'bottom-6 right-6'
    : 'bottom-6 left-6';

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${positionClasses} w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50`}
        style={{ backgroundColor: primaryColor }}
        aria-label="Open chat"
      >
        <MessageCircle className="w-8 h-8 text-white" />
      </button>
    );
  }

  return (
    <div
      className={`fixed ${positionClasses} flex flex-col bg-white rounded-lg shadow-2xl border border-gray-200 z-50 transition-all duration-300`}
      style={{
        width: isMinimized ? '320px' : '400px',
        height: isMinimized ? '60px' : '600px',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 rounded-t-lg flex items-center justify-between"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-2 text-white">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-white" />
            ) : (
              <Minimize2 className="w-4 h-4 text-white" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Model Selector */}
          {showModelSelector && (
            <div className="p-3 bg-gray-50 border-b border-gray-200 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-900">Select AI Model</h4>
                <button
                  onClick={() => {
                    setSelectedProvider('');
                    setSelectedModel('');
                  }}
                  className="text-xs text-gray-600 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>

              {providers.length > 0 ? (
                <div className="space-y-2">
                  {/* Provider Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Provider
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {providers.map((provider) => (
                        <button
                          key={provider.provider}
                          onClick={() => {
                            setSelectedProvider(provider.provider);
                            setSelectedModel('');
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            selectedProvider === provider.provider
                              ? 'text-white'
                              : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
                          }`}
                          style={selectedProvider === provider.provider ? { backgroundColor: primaryColor } : {}}
                        >
                          {provider.provider === 'openai' && '🤖'}
                          {provider.provider === 'anthropic' && '🧠'}
                          {provider.provider === 'google' && '🔍'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Model Selection */}
                  {selectedProvider && availableModels.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Model
                      </label>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {availableModels.map((model) => (
                          <button
                            key={model}
                            onClick={() => setSelectedModel(model)}
                            className={`w-full px-2 py-1 rounded text-xs transition-colors text-left ${
                              selectedModel === model
                                ? 'text-white'
                                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
                            }`}
                            style={selectedModel === model ? { backgroundColor: primaryColor } : {}}
                          >
                            {model}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProvider && selectedModel && (
                    <p className="text-xs text-gray-600 mt-1">
                      Using <strong>{selectedProvider}: {selectedModel}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500">Loading...</p>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-xs">
                  <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    Welcome! 👋
                  </h4>
                  <p className="text-xs text-gray-500">
                    How can I help you today?
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <WidgetMessage key={message.id} message={message} primaryColor={primaryColor} />
            ))}

            {sendMessageMutation.isPending && (
              <div className="flex gap-2">
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Bot className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1">
                  <LoadingSpinner size="sm" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  selectedProvider
                    ? 'border-gray-300 bg-gray-50 text-gray-700'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
                title="Select AI Model"
              >
                <Bot className="w-3 h-3 inline mr-1" />
                {selectedProvider || 'Model'}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                disabled={sendMessageMutation.isPending}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sendMessageMutation.isPending}
                className="px-3 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function WidgetMessage({ message, primaryColor }: { message: Message; primaryColor: string }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <Bot className="w-4 h-4" style={{ color: primaryColor }} />
        </div>
      )}

      <div className={`flex-1 max-w-[85%]`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-700">
            {isUser ? 'You' : 'AI'}
          </span>
          <span className="text-xs text-gray-400">
            {formatRelativeTime(message.timestamp)}
          </span>
        </div>

        <div
          className={`rounded-lg p-3 text-sm ${
            isUser
              ? 'text-white'
              : 'bg-white border border-gray-200 text-gray-800'
          }`}
          style={isUser ? { backgroundColor: primaryColor } : {}}
        >
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Sources:
              </p>
              <div className="flex flex-wrap gap-1">
                {message.sources.map((source, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                  >
                    {source.filename}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="w-4 h-4 text-gray-600" />
        </div>
      )}
    </div>
  );
}
