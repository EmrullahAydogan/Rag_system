import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { chatApi } from '@/api/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatDate, formatRelativeTime } from '@/utils/format';

export default function HistoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.listConversations(),
  });

  const { data: conversationDetail } = useQuery({
    queryKey: ['conversation', selectedConversation],
    queryFn: () => chatApi.getConversation(selectedConversation!),
    enabled: !!selectedConversation,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => chatApi.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (selectedConversation) {
        setSelectedConversation(null);
      }
    },
  });

  const handleContinueChat = (id: number) => {
    navigate(`/?conversation=${id}`);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Conversations List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Chat History</h1>
          <p className="text-sm text-gray-600 mt-1">
            {conversations?.length || 0} conversations
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <LoadingSpinner />
          ) : conversations && conversations.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedConversation === conv.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{conv.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {conv.message_count} messages
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(conv.updated_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No conversations yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Conversation Detail */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && conversationDetail ? (
          <>
            <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {conversationDetail.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Created {formatDate(conversationDetail.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleContinueChat(selectedConversation)}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Continue Chat
                </button>
                <button
                  onClick={() => deleteMutation.mutate(selectedConversation)}
                  className="btn-secondary text-sm flex items-center gap-2 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="max-w-4xl mx-auto space-y-6">
                {conversationDetail.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-gray-100 ml-12'
                        : 'bg-white border border-gray-200 mr-12'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">
                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">{message.content}</p>

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-2">Sources:</p>
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
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a conversation to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
