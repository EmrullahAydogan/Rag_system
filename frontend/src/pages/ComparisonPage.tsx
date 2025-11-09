import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ModelResult {
  answer: string | null;
  sources: any[];
  model: string;
  response_time: number;
  success: boolean;
  error: string | null;
}

interface ComparisonResponse {
  query: string;
  results: {
    openai: ModelResult;
    anthropic: ModelResult;
    google: ModelResult;
  };
}

export default function ComparisonPage() {
  const [query, setQuery] = useState('');
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);

  const compareMutation = useMutation({
    mutationFn: async (message: string) => {
      const { data } = await axios.post<ComparisonResponse>(`${API_BASE_URL}/api/chat/compare`, {
        message,
      });
      return data;
    },
    onSuccess: (data) => {
      setComparison(data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    compareMutation.mutate(query);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          Model Comparison
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Compare responses from OpenAI GPT, Anthropic Claude, and Google Gemini
        </p>
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question to compare models..."
              className="flex-1 input"
              disabled={compareMutation.isPending}
            />
            <button
              type="submit"
              disabled={!query.trim() || compareMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Compare
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6">
        {compareMutation.isPending && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <LoadingSpinner />
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                Comparing responses from all models...
              </p>
            </div>
          </div>
        )}

        {comparison && !compareMutation.isPending && (
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Query:
              </h3>
              <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                {comparison.query}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <ModelResponseCard
                title="OpenAI GPT"
                result={comparison.results.openai}
                color="blue"
              />
              <ModelResponseCard
                title="Anthropic Claude"
                result={comparison.results.anthropic}
                color="purple"
              />
              <ModelResponseCard
                title="Google Gemini"
                result={comparison.results.google}
                color="green"
              />
            </div>
          </div>
        )}

        {!comparison && !compareMutation.isPending && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Zap className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Model Comparison
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Enter a question above to see how different AI models respond. Compare OpenAI GPT,
                Anthropic Claude, and Google Gemini side-by-side.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModelResponseCard({
  title,
  result,
  color,
}: {
  title: string;
  result: ModelResult;
  color: 'blue' | 'purple' | 'green';
}) {
  const colorClasses = {
    blue: 'border-blue-500 dark:border-blue-400',
    purple: 'border-purple-500 dark:border-purple-400',
    green: 'border-green-500 dark:border-green-400',
  };

  const bgClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
  };

  const textClasses = {
    blue: 'text-blue-700 dark:text-blue-300',
    purple: 'text-purple-700 dark:text-purple-300',
    green: 'text-green-700 dark:text-green-300',
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border-2 ${colorClasses[color]} overflow-hidden`}
    >
      <div className={`${bgClasses[color]} px-4 py-3 border-b ${colorClasses[color]}`}>
        <h4 className={`font-semibold ${textClasses[color]}`}>{title}</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{result.model}</p>
      </div>

      <div className="p-4">
        {result.success ? (
          <>
            <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
              <ReactMarkdown>{result.answer || ''}</ReactMarkdown>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
              <span>Response time:</span>
              <span className="font-medium">{result.response_time}s</span>
            </div>

            {result.sources && result.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Sources: {result.sources.length}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 text-sm">
              Error: {result.error || 'Failed to get response'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
