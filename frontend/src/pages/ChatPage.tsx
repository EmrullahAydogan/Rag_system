import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Bot, User, FileText, Wifi, WifiOff, ThumbsUp, ThumbsDown, Zap, Mic, MicOff, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatApi, documentsApi } from '@/api/client';
import type { Message, ChatRequest, Document } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatRelativeTime } from '@/utils/format';
import { useWebSocket } from '@/hooks/useWebSocket';
import { exportConversationToPDF } from '@/utils/pdfExport';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<number | undefined>();
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [useWebSocketMode, setUseWebSocketMode] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [showDocSelector, setShowDocSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
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

  // Get available documents for filtering
  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list(),
  });

  const completedDocuments = documents.filter((doc) => doc.status === 'completed');

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

    const documentIds = selectedDocuments.length > 0 ? selectedDocuments : undefined;

    if (useWebSocketMode && isConnected) {
      // Use WebSocket
      const success = sendWebSocketMessage({
        message: input,
        conversation_id: currentConversationId,
        document_ids: documentIds,
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
        document_ids: documentIds,
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

  const toggleDocument = (docId: number) => {
    setSelectedDocuments((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  const selectAllDocuments = () => {
    setSelectedDocuments(completedDocuments.map((doc) => doc.id));
  };

  const clearDocumentSelection = () => {
    setSelectedDocuments([]);
  };

  const handleExportPDF = () => {
    if (conversation) {
      exportConversationToPDF(conversation);
    }
  };

  // Quick question templates
  const quickTemplates = [
    "What's your return policy?",
    "Tell me about shipping options",
    "How does the warranty work?",
    "What payment methods do you accept?",
    "Do you offer international shipping?",
    "How can I track my order?"
  ];

  const handleTemplateClick = (template: string) => {
    setInput(template);
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setInput((prev) => prev + finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          if (isRecording) {
            // Restart if still recording
            try {
              recognition.start();
            } catch (error) {
              console.error('Error restarting recognition:', error);
              setIsRecording(false);
            }
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      // Stop recording
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsListening(false);
    } else {
      // Start recording
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
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
            onClick={() => setShowDocSelector(!showDocSelector)}
            className={`btn-secondary text-xs flex items-center gap-1 ${
              selectedDocuments.length > 0 ? 'border-primary-500 bg-primary-50' : ''
            }`}
            title="Filter by documents"
          >
            <FileText className="w-3.5 h-3.5" />
            Docs {selectedDocuments.length > 0 && `(${selectedDocuments.length})`}
          </button>
          <button
            onClick={() => setUseWebSocketMode(!useWebSocketMode)}
            className="btn-secondary text-xs"
            title={`Switch to ${useWebSocketMode ? 'REST API' : 'WebSocket'} mode`}
          >
            {useWebSocketMode ? 'Live Mode' : 'Standard Mode'}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={!conversation || messages.length === 0}
            className="btn-secondary text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export conversation as PDF"
          >
            <Download className="w-4 h-4" />
            Export PDF
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
            <div className="text-center max-w-3xl">
              <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to TechStore AI Support
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                I can help you with product information, returns, warranties, shipping, and more.
                <br />
                Start by asking a question!
              </p>

              {/* Quick Templates */}
              <div className="mt-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-primary-600" />
                  <p className="text-sm font-medium text-gray-700">Quick Questions</p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto">
                  {quickTemplates.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTemplateClick(template)}
                      className="text-sm text-left px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors text-gray-700"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
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
          {/* Document Selector Panel */}
          {showDocSelector && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Filter by Documents</h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllDocuments}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearDocumentSelection}
                    className="text-xs text-gray-600 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {completedDocuments.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {completedDocuments.map((doc) => (
                    <label
                      key={doc.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        selectedDocuments.includes(doc.id)
                          ? 'bg-primary-50 border border-primary-200'
                          : 'bg-white border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => toggleDocument(doc.id)}
                        className="rounded text-primary-600"
                      />
                      <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-900 truncate">{doc.filename}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No documents available. Upload documents first.</p>
              )}

              {selectedDocuments.length > 0 && (
                <p className="text-xs text-gray-600 mt-3">
                  {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected. Chat will only use context from these documents.
                </p>
              )}
            </div>
          )}

          {/* Quick Templates - Always visible */}
          {messages.length > 0 && (
            <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-2">
              <Zap className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
              <div className="flex gap-2">
                {quickTemplates.slice(0, 4).map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTemplateClick(template)}
                    disabled={sendMessageMutation.isPending || isStreaming || isTyping}
                    className="text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full hover:border-primary-400 hover:bg-primary-50 transition-colors text-gray-700 whitespace-nowrap disabled:opacity-50"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isListening ? "Listening..." : "Type your message here..."}
                className="w-full input resize-none pr-12"
                rows={3}
                disabled={sendMessageMutation.isPending || isStreaming || isTyping}
              />
              {/* Voice input button inside textarea */}
              <button
                onClick={toggleVoiceInput}
                disabled={sendMessageMutation.isPending || isStreaming || isTyping}
                className={`absolute right-3 bottom-3 p-2 rounded-full transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
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
