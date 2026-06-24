import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchHeatmap, fetchPageUrls } from '../api/client';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 720;

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

function getHeatColor(intensity) {
  if (intensity < 0.25) return 'rgba(59, 130, 246, 0.25)';
  if (intensity < 0.5) return 'rgba(34, 197, 94, 0.35)';
  if (intensity < 0.75) return 'rgba(251, 191, 36, 0.45)';
  return 'rgba(239, 68, 68, 0.55)';
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Heatmap Analysis</h1>
        <p className="mt-1 text-sm text-slate-600">Understand where users click on your pages</p>
      </div>

      {/* Page Selector */}
      {pageUrls.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Page</label>
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20"
            >
              {pageUrls.map((url) => (
                <option key={url} value={url}>
                  {url || 'Home'}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-slate-700">Heat Gradient</span>
            </label>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={showClickPoints}
                onChange={(e) => setShowClickPoints(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-slate-700">Click Points</span>
            </label>
          </div>
        </div>
      )}

      {pageUrls.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12">
          <EmptyState
            title="No pages tracked yet"
            description="Visit the demo site and click on elements to generate heatmap data."
          />
        </div>
      ) : (
        <>
          {/* Statistics */}
          {clicks.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-5">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total Clicks</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Top Left</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{stats.topLeft}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Top Right</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{stats.topRight}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Bottom Left</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{stats.bottomLeft}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Bottom Right</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{stats.bottomRight}</p>
              </div>
            </div>
          )}

          {/* Hotspot Card */}
          {stats.hotspot && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-slate-900">Hotspot Detected</p>
              <p className="mt-2 text-sm text-slate-700">
                Peak activity at <span className="font-mono font-medium">({stats.hotspot.x}, {stats.hotspot.y})</span> with <span className="font-medium">{stats.hotspot.intensity}%</span> intensity
              </p>
            </div>
          )}

          {/* Heatmap Canvas */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-900">Click Distribution</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {loadingClicks ? 'Loading...' : `${clicks.length} click${clicks.length !== 1 ? 's' : ''} recorded`}
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {VIEWPORT_WIDTH}×{VIEWPORT_HEIGHT}px
              </span>
            </div>

            <div
              ref={containerRef}
              className="relative w-full rounded-lg border border-slate-200 overflow-hidden bg-slate-50"
              style={{ minHeight: scaledHeight, aspectRatio: `${VIEWPORT_WIDTH}/${VIEWPORT_HEIGHT}` }}
            >
              {loadingClicks ? (
                <LoadingSpinner label="Loading..." />
              ) : clicks.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <EmptyState
                    title="No data yet"
                    description="Click on elements on the demo site to generate heatmap data."
                  />
                </div>
              ) : (
                <div
                  className="relative origin-top-left bg-white"
                  style={{
                    width: VIEWPORT_WIDTH,
                    height: VIEWPORT_HEIGHT,
                    transform: `scale(${scale})`,
                  }}
                >
                  {/* Canvas Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50" />

                  {/* Quadrant Grid */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                    <line x1="640" y1="0" x2="640" y2="720" stroke="#e2e8f0" strokeWidth="1" />
                    <line x1="0" y1="360" x2="1280" y2="360" stroke="#e2e8f0" strokeWidth="1" />
                  </svg>

                  {/* Heat Gradient */}
                  {showHeatmap && (
                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
                      {heatIntensity.map((h, idx) => (
                        <div
                          key={idx}
                          className="absolute rounded-full"
                          style={{
                            left: h.x - 20,
                            top: h.y - 20,
                            width: '40px',
                            height: '40px',
                            background: getHeatColor(h.intensity),
                            filter: 'blur(15px)',
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
                        className="absolute pointer-events-none group"
                        style={{
                          left: click.x - 6,
                          top: click.y - 6,
                          zIndex: 3,
                        }}
                        title={`(${click.x}, ${click.y})`}
                      >
                        <div className="h-3 w-3 rounded-full bg-red-500 ring-2 ring-red-500/30" />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Heat Intensity Scale</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full" style={{ background: 'rgba(59, 130, 246, 0.25)' }} />
                <div>
                  <p className="text-xs font-semibold text-slate-900">Low</p>
                  <p className="text-xs text-slate-600">0-25%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full" style={{ background: 'rgba(34, 197, 94, 0.35)' }} />
                <div>
                  <p className="text-xs font-semibold text-slate-900">Medium</p>
                  <p className="text-xs text-slate-600">25-50%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full" style={{ background: 'rgba(251, 191, 36, 0.45)' }} />
                <div>
                  <p className="text-xs font-semibold text-slate-900">High</p>
                  <p className="text-xs text-slate-600">50-75%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.55)' }} />
                <div>
                  <p className="text-xs font-semibold text-slate-900">Critical</p>
                  <p className="text-xs text-slate-600">75-100%</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
