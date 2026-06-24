import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchHeatmap, fetchPageUrls } from '../api/client';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 720;

// Heat intensity calculation
function calculateHeatIntensity(clicks, radius = 100) {
  const heatMap = [];
  for (let x = 0; x < VIEWPORT_WIDTH; x += 20) {
    for (let y = 0; y < VIEWPORT_HEIGHT; y += 20) {
      let intensity = 0;
      clicks.forEach((click) => {
        const distance = Math.sqrt((click.x - x) ** 2 + (click.y - y) ** 2);
        if (distance < radius) {
          intensity += Math.max(0, 1 - distance / radius);
        }
      });
      if (intensity > 0) {
        heatMap.push({ x, y, intensity: Math.min(intensity, 1) });
      }
    }
  }
  return heatMap;
}

// Color gradient for heatmap
function getHeatColor(intensity) {
  if (intensity < 0.25) return 'rgba(59, 130, 246, 0.3)';
  if (intensity < 0.5) return 'rgba(34, 197, 94, 0.4)';
  if (intensity < 0.75) return 'rgba(251, 191, 36, 0.5)';
  return 'rgba(239, 68, 68, 0.6)';
}

export default function HeatmapPage() {
  const containerRef = useRef(null);
  const [pageUrls, setPageUrls] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [clicks, setClicks] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingClicks, setLoadingClicks] = useState(false);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  const [heatIntensity, setHeatIntensity] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showClickPoints, setShowClickPoints] = useState(true);

  useEffect(() => {
    async function loadPages() {
      setLoadingPages(true);
      setError(null);
      try {
        const response = await fetchPageUrls();
        const urls = response.data || [];
        setPageUrls(urls);
        if (urls.length > 0) {
          setSelectedPage(urls[0]);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load pages');
      } finally {
        setLoadingPages(false);
      }
    }

    loadPages();
  }, []);

  useEffect(() => {
    if (!selectedPage) return;

    async function loadHeatmap() {
      setLoadingClicks(true);
      setError(null);
      try {
        const response = await fetchHeatmap(selectedPage);
        const clickData = response.data || [];
        setClicks(clickData);
        setHeatIntensity(calculateHeatIntensity(clickData));
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load heatmap');
        setClicks([]);
        setHeatIntensity([]);
      } finally {
        setLoadingClicks(false);
      }
    }

    loadHeatmap();
  }, [selectedPage]);

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const { clientWidth } = containerRef.current;
      setScale(clientWidth / VIEWPORT_WIDTH);
    }

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const scaledHeight = useMemo(() => VIEWPORT_HEIGHT * scale, [scale]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (clicks.length === 0) {
      return { total: 0, topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0, hotspot: null };
    }

    const quadrantWidth = VIEWPORT_WIDTH / 2;
    const quadrantHeight = VIEWPORT_HEIGHT / 2;

    let topLeft = 0, topRight = 0, bottomLeft = 0, bottomRight = 0;
    let maxIntensity = 0;
    let hotspot = null;

    clicks.forEach((click) => {
      const x = click.x > quadrantWidth ? 1 : 0;
      const y = click.y > quadrantHeight ? 1 : 0;

      if (x === 0 && y === 0) topLeft++;
      else if (x === 1 && y === 0) topRight++;
      else if (x === 0 && y === 1) bottomLeft++;
      else bottomRight++;
    });

    // Find hotspot (highest intensity area)
    heatIntensity.forEach((h) => {
      if (h.intensity > maxIntensity) {
        maxIntensity = h.intensity;
        hotspot = h;
      }
    });

    return {
      total: clicks.length,
      topLeft,
      topRight,
      bottomLeft,
      bottomRight,
      hotspot: hotspot ? { x: Math.round(hotspot.x), y: Math.round(hotspot.y), intensity: Math.round(hotspot.intensity * 100) } : null,
    };
  }, [clicks, heatIntensity]);

  if (loadingPages) return <LoadingSpinner label="Loading pages..." />;
  if (error && pageUrls.length === 0) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Click Heatmap Analysis</h2>
            <p className="mt-1 text-sm text-slate-500">
              Visualize user interaction patterns to optimize your page layout
            </p>
          </div>

          {pageUrls.length > 0 && (
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {pageUrls.map((url) => (
                <option key={url} value={url}>
                  {url || '/'}
                </option>
              ))}
            </select>
          )}
        </div>

        {pageUrls.length === 0 ? (
          <EmptyState
            title="No pages tracked yet"
            description="Page URLs will appear here once click events are recorded."
          />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid gap-3 sm:grid-cols-5 mb-6">
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-accent">{stats.total}</p>
                <p className="text-xs font-medium text-slate-600">Total Clicks</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.topLeft}</p>
                <p className="text-xs font-medium text-slate-600">Top Left</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.topRight}</p>
                <p className="text-xs font-medium text-slate-600">Top Right</p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-3 text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.bottomLeft}</p>
                <p className="text-xs font-medium text-slate-600">Bottom Left</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{stats.bottomRight}</p>
                <p className="text-xs font-medium text-slate-600">Bottom Right</p>
              </div>
            </div>

            {/* Hotspot Info */}
            {stats.hotspot && (
              <div className="mb-4 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 p-4 border border-orange-200">
                <p className="text-sm font-semibold text-slate-900">
                  🔥 Hotspot Detected
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Highest activity at coordinates ({stats.hotspot.x}, {stats.hotspot.y}) with {stats.hotspot.intensity}% intensity
                </p>
              </div>
            )}

            {/* Visualization Controls */}
            <div className="mb-4 flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-slate-700">Heat Gradient</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showClickPoints}
                  onChange={(e) => setShowClickPoints(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-slate-700">Click Points</span>
              </label>
            </div>

            {/* Heatmap Visualization */}
            <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
              <span>
                {loadingClicks ? 'Loading...' : `${clicks.length} click${clicks.length !== 1 ? 's' : ''} recorded`}
              </span>
              <span className="hidden sm:inline text-xs">
                Viewport: {VIEWPORT_WIDTH} × {VIEWPORT_HEIGHT}px
              </span>
            </div>

            <div
              ref={containerRef}
              className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
              style={{ height: scaledHeight }}
            >
              {loadingClicks ? (
                <LoadingSpinner label="Loading heatmap..." />
              ) : clicks.length === 0 ? (
                <EmptyState
                  title="No clicks on this page"
                  description="Select a different page or generate click events using the demo site."
                />
              ) : (
                <div
                  className="relative origin-top-left bg-white"
                  style={{
                    width: VIEWPORT_WIDTH,
                    height: VIEWPORT_HEIGHT,
                    transform: `scale(${scale})`,
                  }}
                >
                  {/* Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100">
                    <div className="flex h-full items-center justify-center text-slate-300 font-medium">
                      {selectedPage}
                    </div>
                  </div>

                  {/* Grid Lines */}
                  <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                    <line x1="640" y1="0" x2="640" y2="720" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4" />
                    <line x1="0" y1="360" x2="1280" y2="360" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4" />
                  </svg>

                  {/* Heat Gradient Background */}
                  {showHeatmap && (
                    <div className="absolute inset-0">
                      {heatIntensity.map((h, idx) => (
                        <div
                          key={idx}
                          className="absolute rounded-full blur-lg"
                          style={{
                            left: h.x - 20,
                            top: h.y - 20,
                            width: '40px',
                            height: '40px',
                            background: getHeatColor(h.intensity),
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Click Points */}
                  {showClickPoints &&
                    clicks.map((click, index) => (
                      <div
                        key={index}
                        className="pointer-events-none absolute group"
                        style={{
                          left: click.x - 8,
                          top: click.y - 8,
                        }}
                        title={`Click ${index + 1} at (${click.x}, ${click.y})`}
                      >
                        <div className="h-4 w-4 rounded-full bg-red-500/70 ring-2 ring-red-500/30 group-hover:ring-4" />
                        <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/20 group-hover:bg-red-500/40 transition" />
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-900 mb-3">Heat Intensity Legend</p>
              <div className="grid grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ background: 'rgba(59, 130, 246, 0.3)' }} />
                  <span className="text-xs text-slate-600">Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ background: 'rgba(34, 197, 94, 0.4)' }} />
                  <span className="text-xs text-slate-600">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ background: 'rgba(251, 191, 36, 0.5)' }} />
                  <span className="text-xs text-slate-600">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.6)' }} />
                  <span className="text-xs text-slate-600">Critical</span>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
