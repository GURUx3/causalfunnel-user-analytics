import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchSessionEvents } from '../api/client';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(startIso, endIso) {
  const diff = new Date(endIso) - new Date(startIso);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export default function SessionDetailPage() {
  const { sessionId } = useParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchSessionEvents(sessionId);
      setEvents(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [sessionId]);

  if (loading) return <LoadingSpinner label="Loading session journey..." />;
  if (error) return <ErrorState message={error} onRetry={loadEvents} />;

  const sessionDuration = events.length > 1 
    ? formatDuration(events[0].timestamp, events[events.length - 1].timestamp)
    : 'N/A';

  const clickCount = events.filter(e => e.eventType === 'click').length;
  const pageViews = events.filter(e => e.eventType === 'page_view').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Sessions
        </Link>
        
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">User Journey</h1>
        <p className="mt-1 font-mono text-sm text-slate-600">{sessionId}</p>
      </div>

      {/* Session Stats */}
      {events.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Duration</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{sessionDuration}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Events</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{events.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Interactions</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{clickCount}</p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {events.length === 0 ? (
          <EmptyState title="No events" description="This session has no recorded events." />
        ) : (
          <div className="space-y-0">
            <h2 className="font-semibold text-slate-900 mb-6">Event Timeline</h2>
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={index} className="flex gap-4 pb-6 border-b border-slate-100 last:border-b-0 last:pb-0">
                  {/* Timeline marker */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center flex-shrink-0">
                      {event.eventType === 'click' ? (
                        <svg className="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v2h2a1 1 0 110 2h-2v2h2a1 1 0 110 2h-2v2h2a1 1 0 110 2h-2v4a1 1 0 11-2 0v-4h-2v4a1 1 0 11-2 0v-4h-2v4a1 1 0 11-2 0v-4H4v4a1 1 0 11-2 0v-4H0a1 1 0 110-2h2V9H0a1 1 0 110-2h2V5H0a1 1 0 110-2h2V3z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
                        </svg>
                      )}
                    </div>
                    {index < events.length - 1 && (
                      <div className="w-0.5 h-8 bg-slate-200"></div>
                    )}
                  </div>

                  {/* Event details */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-baseline gap-3 mb-1">
                      <time className="font-mono text-sm font-semibold text-slate-900">
                        {formatTime(event.timestamp)}
                      </time>
                      <span className="text-xs font-medium text-slate-500">
                        {event.eventType === 'click' ? 'Click' : 'Page View'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">
                      {event.eventType === 'click' ? (
                        <>
                          Clicked at coordinates <span className="font-mono font-medium">({event.x}, {event.y})</span>
                        </>
                      ) : (
                        <>
                          Visited <span className="font-mono font-medium text-slate-900">{event.pageUrl}</span>
                        </>
                      )}
                    </p>
                    {event.eventType === 'click' && event.pageUrl && (
                      <p className="mt-1 text-xs text-slate-500">
                        on <span className="font-mono">{event.pageUrl}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
