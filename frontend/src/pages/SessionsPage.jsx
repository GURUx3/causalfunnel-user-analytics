import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSessions } from '../api/client';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SearchInput from '../components/ui/SearchInput';

const SORT_KEYS = {
  sessionId: 'sessionId',
  eventCount: 'eventCount',
  firstSeen: 'firstSeen',
  lastSeen: 'lastSeen',
};

function formatDate(iso) {
  const date = new Date(iso);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatCard({ label, value, trend }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-3xl font-semibold text-slate-900">{value.toLocaleString()}</span>
        {trend && (
          <span className="text-xs text-slate-500">{trend}</span>
        )}
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ totalSessions: 0, totalEvents: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('lastSeen');
  const [sortDir, setSortDir] = useState('desc');

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchSessions();
      setSessions(response.data);
      setStats(response.meta || { totalSessions: response.data.length, totalEvents: 0 });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const filteredSessions = useMemo(() => {
    const query = search.toLowerCase().trim();
    let result = sessions;

    if (query) {
      result = result.filter((s) => s.sessionId.toLowerCase().includes(query));
    }

    return [...result].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (sortKey === 'firstSeen' || sortKey === 'lastSeen') {
        const diff = new Date(aVal) - new Date(bVal);
        return sortDir === 'asc' ? diff : -diff;
      }

      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [sessions, search, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'sessionId' ? 'asc' : 'desc');
    }
  };

  if (loading) return <LoadingSpinner label="Loading sessions..." />;
  if (error) return <ErrorState message={error} onRetry={loadSessions} />;

  const avgEventsPerSession = stats.totalSessions > 0 
    ? (stats.totalEvents / stats.totalSessions).toFixed(1) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Sessions</h1>
        <p className="mt-1 text-sm text-slate-600">Track and analyze user sessions across your site</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard 
          label="Total Sessions" 
          value={stats.totalSessions}
        />
        <StatCard 
          label="Total Events" 
          value={stats.totalEvents}
        />
        <StatCard 
          label="Avg Events/Session" 
          value={parseFloat(avgEventsPerSession)}
        />
      </div>

      {/* Sessions Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">User Sessions</h2>
            <p className="mt-1 text-sm text-slate-600">
              {filteredSessions.length} of {sessions.length} sessions
            </p>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by session ID..."
          />
        </div>

        {filteredSessions.length === 0 ? (
          <EmptyState
            title="No sessions found"
            description={
              search
                ? 'Try adjusting your search query.'
                : 'Sessions will appear here once the tracking script sends data.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                  {[
                    { key: SORT_KEYS.sessionId, label: 'Session ID' },
                    { key: SORT_KEYS.eventCount, label: 'Events' },
                    { key: SORT_KEYS.firstSeen, label: 'First Seen' },
                    { key: SORT_KEYS.lastSeen, label: 'Last Seen' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="cursor-pointer select-none px-6 py-3 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {label}
                        {sortKey === key && (
                          <span className="text-slate-500">
                            {sortDir === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session, idx) => (
                  <tr
                    key={session.sessionId}
                    onClick={() => navigate(`/sessions/${session.sessionId}`)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-slate-600 truncate block max-w-xs" title={session.sessionId}>
                        {session.sessionId.substring(0, 12)}...
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {session.eventCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(session.firstSeen)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(session.lastSeen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
