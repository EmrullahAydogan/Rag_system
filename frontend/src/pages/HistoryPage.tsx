import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Trash2, ExternalLink, Download, Search, X, Calendar, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { chatApi } from '@/api/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatDate, formatRelativeTime } from '@/utils/format';
import { exportAsJSON, exportAsMarkdown, exportAsText } from '@/utils/exportChat';

export default function HistoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'messages'>('recent');

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.listConversations(),
  });

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];

    let filtered = [...conversations];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply date filter
    const now = new Date();
    if (dateFilter !== 'all') {
      filtered = filtered.filter(conv => {
        const convDate = new Date(conv.updated_at);
        const diffTime = Math.abs(now.getTime() - convDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case 'today':
            return diffDays === 0;
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'oldest':
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'messages':
          return b.message_count - a.message_count;
        default:
          return 0;
      }
    });

    return filtered;
  }, [conversations, searchQuery, dateFilter, sortBy]);

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
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chat History</h1>
          <p className="text-sm text-gray-600 mt-1">
            {filteredConversations.length} of {conversations?.length || 0} conversations
          </p>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <div className="flex-1">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
            </div>
            <div className="flex-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="recent">Most recent</option>
                <option value="oldest">Oldest first</option>
                <option value="messages">Most messages</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <LoadingSpinner />
          ) : filteredConversations.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredConversations.map((conv) => (
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
              <p className="text-gray-500 dark:text-gray-400">No conversations yet</p>
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {conversationDetail.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Created {formatDate(conversationDetail.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <div className="relative group">
                  <button className="btn-secondary text-sm flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                      onClick={() => exportAsJSON(conversationDetail)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => exportAsMarkdown(conversationDetail)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Export as Markdown
                    </button>
                    <button
                      onClick={() => exportAsText(conversationDetail)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                    >
                      Export as Text
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleContinueChat(selectedConversation)}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Continue Chat
                </button>
                <button
                  onClick={() => deleteMutation.mutate(selectedConversation)}
                  className="btn-secondary text-sm flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatRelativeTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">{message.content}</p>

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
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
              <p className="text-gray-500 dark:text-gray-400">Select a conversation to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
