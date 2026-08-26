import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapComponent } from './components/MapComponent';
import { ReportModal } from './components/ReportModal';
import { AlertBanner } from './components/AlertBanner';
import { LiveClock } from './components/LiveClock';
import { useStore } from './store/useStore';
import { Camera, RefreshCw, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './i18n'; // initialize i18next

function App() {
  const { fetchLiveWeather, activeAlerts, inferenceResults, weatherStatus } = useStore();
  const { t } = useTranslation();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const doFetch = async () => {
    setSyncing(true);
    await fetchLiveWeather();
    setSyncing(false);
  };

  useEffect(() => {
    // Immediate initial fetch of live weather
    doFetch();
    // Re-fetch every 15 minutes — as per Open-Meteo best practices
    const interval = setInterval(doFetch, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = activeAlerts.filter(a => a.severity === 'RED').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'ORANGE').length;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-950">
      <AlertBanner />
      <Sidebar />

      <main className="flex-1 relative overflow-hidden">
        <MapComponent />

        {/* Top Status Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none z-20">
          <div className="pointer-events-auto flex gap-2 flex-wrap items-center">

            {/* Live Status */}
            <div className="bg-gray-950/90 backdrop-blur border border-gray-800 rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-white">Live</span>
            </div>

            {/* Weather API status */}
            <div className={`backdrop-blur border rounded-lg px-3 py-2 shadow-lg ${
              weatherStatus === 'fetching' ? 'bg-blue-950/80 border-blue-800' :
              weatherStatus === 'error' ? 'bg-red-950/80 border-red-800' :
              'bg-gray-950/90 border-gray-800'}`}>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">Open-Meteo API</div>
              <div className={`text-xs font-bold ${weatherStatus === 'success' ? 'text-green-400' : weatherStatus === 'error' ? 'text-red-400' : 'text-blue-400'}`}>
                {weatherStatus === 'fetching' ? 'Fetching…' : weatherStatus === 'error' ? 'Error' : `${inferenceResults.length} Sectors Live`}
              </div>
            </div>

            {criticalCount > 0 && (
              <div className="bg-red-950/90 backdrop-blur border border-red-800 rounded-lg px-3 py-2 shadow-lg">
                <div className="text-[9px] text-red-400 uppercase">Critical</div>
                <div className="text-xs font-bold text-red-300">{criticalCount}</div>
              </div>
            )}
            {warningCount > 0 && (
              <div className="bg-orange-950/90 backdrop-blur border border-orange-800 rounded-lg px-3 py-2 shadow-lg">
                <div className="text-[9px] text-orange-400 uppercase">Warning</div>
                <div className="text-xs font-bold text-orange-300">{warningCount}</div>
              </div>
            )}
          </div>

          {/* Right: Live Clock + Actions */}
          <div className="pointer-events-auto flex items-center gap-2">
            {/* LIVE CLOCK — ticks every second via ClockContext */}
            <div className="bg-gray-950/90 backdrop-blur border border-gray-800 rounded-lg px-3 py-2 shadow-lg">
              <LiveClock />
            </div>

            <button onClick={doFetch} disabled={syncing}
              className="bg-gray-900/90 backdrop-blur border border-gray-700 hover:border-blue-500 text-white rounded-lg px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-all shadow-lg disabled:opacity-40">
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing…' : 'Refresh'}
            </button>

            <button onClick={() => setIsReportOpen(true)}
              className="bg-blue-700 hover:bg-blue-600 border border-blue-500 text-white rounded-lg px-4 py-2 flex items-center gap-1.5 text-xs font-semibold transition-all shadow-lg">
              <Camera size={13} />
              {t('field_report')}
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-8 right-4 z-20 bg-gray-950/90 backdrop-blur border border-gray-800 rounded-lg p-3 shadow-lg text-[10px]">
          <div className="font-semibold uppercase tracking-wider text-gray-500 mb-2">{t('risk_legend')}</div>
          {[
            { color: '#ef4444', label: 'Critical — FoS < 1.0 (ML Rule 1/2)' },
            { color: '#f97316', label: 'High Risk — FoS 1.0–1.1 (ML Rule 3/4)' },
            { color: '#eab308', label: 'Watch — FoS 1.1–1.3 (ML Rule 5)' },
            { color: '#22c55e', label: 'Safe — FoS > 1.3' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: item.color, opacity: 0.8 }} />
              <span className="text-gray-400">{item.label}</span>
            </div>
          ))}
          <div className="border-t border-gray-800 mt-2 pt-2 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
              <span className="text-gray-500">Historical Event (real data)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-gray-500">Monitoring Pin (click to place)</span>
            </div>
          </div>
        </div>

        {/* Hint */}
        <div className="absolute bottom-8 left-4 z-20 bg-gray-950/80 backdrop-blur border border-gray-800 rounded-lg px-3 py-2 text-[10px] text-gray-600 max-w-xs shadow-lg">
          <Shield size={9} className="inline mr-1 text-blue-500" />
          Colors driven by <strong className="text-gray-400">live Open-Meteo rainfall + ML inference</strong>. Click polygon for real weather data.
        </div>
      </main>

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  );
}

export default App;
