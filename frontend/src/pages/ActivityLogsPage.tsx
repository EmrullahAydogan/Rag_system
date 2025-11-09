import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Filter, Search, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { logsApi } from '@/api/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatRelativeTime } from '@/utils/format';

export default function ActivityLogsPage() {
  const [timeRange, setTimeRange] = useState(7);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['activity-logs', timeRange, actionFilter, resourceFilter, statusFilter],
    queryFn: () => logsApi.list({
      days: timeRange,
      action_type: actionFilter || undefined,
      resource_type: resourceFilter || undefined,
      status: statusFilter || undefined,
      limit: 200,
    }),
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  const { data: stats } = useQuery({
    queryKey: ['activity-stats', timeRange],
    queryFn: () => logsApi.getStats(timeRange),
    refetchInterval: 10000,
  });

  const filteredLogs = logs.filter((log) =>
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      upload: 'bg-blue-100 text-blue-700',
      delete: 'bg-red-100 text-red-700',
      chat: 'bg-green-100 text-green-700',
      tag_create: 'bg-purple-100 text-purple-700',
      tag_delete: 'bg-orange-100 text-orange-700',
      export: 'bg-indigo-100 text-indigo-700',
    };
    return colors[action] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-screen overflow-auto bg-gray-50">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
              Live
            </span>
          </div>
          <p className="text-gray-600">Monitor all system activities and user actions</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Activities</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.total_logs}</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Most Common Action</h3>
              <p className="text-xl font-bold text-primary-600">
                {stats.by_action?.[0]?.action || 'N/A'}
              </p>
              <p className="text-sm text-gray-500">
                {stats.by_action?.[0]?.count || 0} times
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Success Rate</h3>
              <p className="text-3xl font-bold text-green-600">
                {stats.by_status && stats.total_logs > 0
                  ? Math.round((stats.by_status.find((s: any) => s.status === 'success')?.count || 0) / stats.total_logs * 100)
                  : 0}%
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="w-full pl-10 input"
              />
            </div>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="input w-40"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-40"
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>

            <button onClick={() => refetch()} className="btn-secondary">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action_type)}`}>
                          {log.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {log.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.resource_type}
                        {log.resource_id && ` #${log.resource_id}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatRelativeTime(log.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No activity logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
