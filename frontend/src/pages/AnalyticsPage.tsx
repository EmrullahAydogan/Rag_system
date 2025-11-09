import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MessageSquare, FileText, TrendingUp, Star } from 'lucide-react';
import { analyticsApi } from '@/api/client';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AnalyticsPage() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsApi.getSummary(),
  });

  const { data: timeSeries, isLoading: timeSeriesLoading } = useQuery({
    queryKey: ['analytics-time-series'],
    queryFn: () => analyticsApi.getTimeSeries(7),
  });

  const { data: topTopics, isLoading: topicsLoading } = useQuery({
    queryKey: ['analytics-topics'],
    queryFn: () => analyticsApi.getTopTopics(10),
  });

  if (summaryLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-screen overflow-auto bg-gray-50">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor performance and usage metrics</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Conversations"
              value={summary.total_conversations}
              icon={<MessageSquare className="w-8 h-8" />}
              color="bg-blue-500"
            />
            <StatCard
              title="Total Messages"
              value={summary.total_messages}
              icon={<TrendingUp className="w-8 h-8" />}
              color="bg-green-500"
            />
            <StatCard
              title="Documents"
              value={summary.total_documents}
              icon={<FileText className="w-8 h-8" />}
              color="bg-purple-500"
            />
            <StatCard
              title="Avg Rating"
              value={summary.avg_rating ? summary.avg_rating.toFixed(1) : 'N/A'}
              icon={<Star className="w-8 h-8" />}
              color="bg-yellow-500"
              suffix={summary.avg_rating ? ' / 5' : ''}
            />
          </div>
        )}

        {/* Secondary Stats */}
        {summary && (
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="card">
              <p className="text-sm text-gray-600">Avg Messages per Conversation</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.avg_messages_per_conversation.toFixed(1)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.avg_response_time
                  ? `${summary.avg_response_time.toFixed(2)}s`
                  : 'N/A'}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.total_feedback}
              </p>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Time Series Chart */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Conversations Over Time (7 Days)</h2>
            {timeSeriesLoading ? (
              <LoadingSpinner />
            ) : timeSeries && timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={{ fill: '#0ea5e9' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">No data available</p>
            )}
          </div>

          {/* Top Topics Chart */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Top Discussion Topics</h2>
            {topicsLoading ? (
              <LoadingSpinner />
            ) : topTopics && topTopics.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topTopics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="topic" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">No topic data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  suffix = '',
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {value}
            {suffix && <span className="text-lg text-gray-500">{suffix}</span>}
          </p>
        </div>
        <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
}
