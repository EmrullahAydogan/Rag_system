import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { MessageSquare, FileText, TrendingUp, Star, Clock, Zap, Users, Activity } from 'lucide-react';
import { analyticsApi } from '@/api/client';
import LoadingSpinner;
import { useTheme } from "@/contexts/ThemeContext" from '@/components/LoadingSpinner';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState(7);
  const [isRealTime, setIsRealTime] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsApi.getSummary(),
    refetchInterval: isRealTime ? 10000 : false, // Refresh every 10 seconds in real-time mode
  });

  const { data: timeSeries, isLoading: timeSeriesLoading } = useQuery({
    queryKey: ['analytics-time-series', timeRange],
    queryFn: () => analyticsApi.getTimeSeries(timeRange),
    refetchInterval: isRealTime ? 10000 : false,
  });

  const { data: topTopics, isLoading: topicsLoading } = useQuery({
    queryKey: ['analytics-topics'],
    queryFn: () => analyticsApi.getTopTopics(10),
    refetchInterval: isRealTime ? 10000 : false,
  });

  const { data: responseTimes } = useQuery({
    queryKey: ['analytics-response-times', timeRange],
    queryFn: () => analyticsApi.getResponseTimes(timeRange),
  });

  const { data: modelPerformance } = useQuery({
    queryKey: ['analytics-model-performance'],
    queryFn: () => analyticsApi.getModelPerformance(30),
  });

  const { data: userEngagement } = useQuery({
    queryKey: ['analytics-user-engagement'],
    queryFn: () => analyticsApi.getUserEngagement(30),
  });

  const { data: peakHours } = useQuery({
    queryKey: ['analytics-peak-hours', timeRange],
    queryFn: () => analyticsApi.getPeakHours(timeRange),
  });

  const { data: conversationMetrics } = useQuery({
    queryKey: ['analytics-conversation-metrics'],
    queryFn: () => analyticsApi.getConversationMetrics(30),
  });

  // Update last updated timestamp when data changes
  useEffect(() => {
    if (summary) {
      setLastUpdated(new Date());
    }
  }, [summary, timeSeries, topTopics]);

  const formatLastUpdated = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return lastUpdated.toLocaleTimeString();
  };

  if (summaryLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-screen overflow-auto bg-gray-50">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              Analytics Dashboard
              {isRealTime && (
                <span className="inline-flex items-center gap-1.5 text-xs font-normal px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
                  <Activity className="w-3 h-3 animate-pulse" />
                  Live
                </span>
              )}
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor performance and usage metrics • Last updated: {formatLastUpdated()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRealTime(!isRealTime)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                isRealTime
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isRealTime ? 'Real-Time ON' : 'Real-Time OFF'}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Time Range:</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="input text-sm py-2"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>
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
            <div className="card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Messages per Conversation</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.avg_messages_per_conversation.toFixed(1)}
              </p>
            </div>
            <div className="card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.avg_response_time
                  ? `${summary.avg_response_time.toFixed(2)}s`
                  : 'N/A'}
              </p>
            </div>
            <div className="card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.total_feedback}
              </p>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Time Series Chart */}
          <div className="card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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
          <div className="card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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

        {/* User Engagement & Conversation Metrics */}
        {(userEngagement || conversationMetrics) && (
          <div className="grid grid-cols-3 gap-6 mb-8">
            {userEngagement && (
              <>
                <div className="card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Days</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userEngagement.active_days} / {userEngagement.period_days}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((userEngagement.active_days / userEngagement.period_days) * 100).toFixed(0)}% active
                  </p>
                </div>
                <div className="card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Conversations/Day</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userEngagement.avg_conversations_per_day.toFixed(1)}
                  </p>
                </div>
              </>
            )}
            {conversationMetrics && (
              <div className="card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Conversation Length</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {conversationMetrics.avg_conversation_length.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {conversationMetrics.median_conversation_length} median
                </p>
              </div>
            )}
          </div>
        )}

        {/* Response Times & Model Performance */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Response Times */}
          <div className="card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Response Times Over Time
            </h2>
            {responseTimes && responseTimes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={responseTimes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avg_response_time"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    name="Average"
                    dot={{ fill: '#0ea5e9' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="min_response_time"
                    stroke="#10b981"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    name="Min"
                  />
                  <Line
                    type="monotone"
                    dataKey="max_response_time"
                    stroke="#ef4444"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    name="Max"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">No response time data available</p>
            )}
          </div>

          {/* Model Performance */}
          <div className="card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Model Performance
            </h2>
            {modelPerformance && modelPerformance.length > 0 ? (
              <div className="space-y-4">
                {modelPerformance.map((model: any, index: number) => (
                  <div key={index} className="border-b border-gray-200 pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 capitalize">
                        {model.provider}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {model.usage_count} uses
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min((model.avg_response_time / 10) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 min-w-[60px] text-right">
                        {model.avg_response_time.toFixed(2)}s
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-12">No model performance data available</p>
            )}
          </div>
        </div>

        {/* Peak Hours */}
        {peakHours && peakHours.length > 0 && (
          <div className="card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-8">
            <h2 className="text-xl font-semibold mb-4">Peak Usage Hours</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  fontSize={12}
                  tickFormatter={(hour) => `${hour}:00`}
                />
                <YAxis fontSize={12} />
                <Tooltip
                  labelFormatter={(hour) => `${hour}:00 - ${hour + 1}:00`}
                  formatter={(value) => [value, 'Messages']}
                />
                <Bar dataKey="message_count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
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
    <div className="card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
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
