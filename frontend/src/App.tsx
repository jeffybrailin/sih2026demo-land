import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapComponent } from './components/MapComponent';
import { ReportModal } from './components/ReportModal';
import { AlertBanner } from './components/AlertBanner';
import { useStore } from './store/useStore';
import { Camera, RefreshCw, Shield, Clock } from 'lucide-react';

function App() {
  const { fetchData, alerts, riskZones } = useStore();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');
  const [syncing, setSyncing] = useState(false);

  const doFetch = async () => {
    setSyncing(true);
    await fetchData();
    setLastSync(new Date().toLocaleTimeString('en-IN'));
    setSyncing(false);
  };

  useEffect(() => {
    doFetch();
    const interval = setInterval(doFetch, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = alerts.filter((a: any) => a.severity === 'RED').length;
  const warningCount = alerts.filter((a: any) => a.severity === 'ORANGE').length;
  const sectorCount = riskZones?.features?.length ?? 0;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-950 font-sans">

      {/* Pulsating alert banner — sits above everything */}
      <AlertBanner />

      {/* Left Sidebar */}
      <Sidebar />

      {/* Main map area */}
      <main className="flex-1 relative overflow-hidden">
        <MapComponent />

        {/* ── Top Stats Bar ── */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none z-20">

          {/* Status cluster */}
          <div className="pointer-events-auto flex gap-2 flex-wrap">
            {/* Live status */}
            <div className="bg-gray-950/90 backdrop-blur border border-gray-800 rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-medium text-white">Live</span>
            </div>

            {/* Sectors monitored */}
            <div className="bg-gray-950/90 backdrop-blur border border-gray-800 rounded-lg px-3 py-2 shadow-lg">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Sectors</div>
              <div className="text-sm font-bold text-white">{sectorCount}</div>
            </div>

            {/* Critical */}
            {criticalCount > 0 && (
              <div className="bg-red-950/90 backdrop-blur border border-red-800 rounded-lg px-3 py-2 shadow-lg">
                <div className="text-[10px] text-red-400 uppercase tracking-wider">Critical</div>
                <div className="text-sm font-bold text-red-300">{criticalCount}</div>
              </div>
            )}

            {/* Warning */}
            {warningCount > 0 && (
              <div className="bg-orange-950/90 backdrop-blur border border-orange-800 rounded-lg px-3 py-2 shadow-lg">
                <div className="text-[10px] text-orange-400 uppercase tracking-wider">Warning</div>
                <div className="text-sm font-bold text-orange-300">{warningCount}</div>
              </div>
            )}

            {/* Last sync */}
            <div className="bg-gray-950/90 backdrop-blur border border-gray-800 rounded-lg px-3 py-2 flex items-center gap-1.5 shadow-lg">
              <Clock size={11} className="text-gray-500" />
              <span className="text-[10px] text-gray-400">{lastSync || '–'}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pointer-events-auto flex gap-2">
            <button
              onClick={doFetch}
              disabled={syncing}
              className="bg-gray-900/90 backdrop-blur border border-gray-700 hover:border-blue-600 text-white rounded-lg px-3 py-2 flex items-center gap-2 text-xs font-medium transition-all shadow-lg disabled:opacity-50"
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing…' : 'Refresh'}
            </button>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="bg-blue-700 hover:bg-blue-600 border border-blue-500 text-white rounded-lg px-4 py-2 flex items-center gap-2 text-xs font-semibold transition-all shadow-lg"
            >
              <Camera size={14} />
              Field Report
            </button>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="absolute bottom-8 right-4 z-20 bg-gray-950/90 backdrop-blur border border-gray-800 rounded-lg p-3 shadow-lg">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Risk Legend</div>
          {[
            { color: '#ef4444', label: 'Critical (FoS < 1.0)', ring: 'bg-red-500' },
            { color: '#f97316', label: 'High Risk (FoS 1.0–1.1)', ring: 'bg-orange-500' },
            { color: '#eab308', label: 'Watch (FoS 1.1–1.3)', ring: 'bg-yellow-500' },
            { color: '#22c55e', label: 'Safe (FoS > 1.3)', ring: 'bg-green-500' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: item.color, opacity: 0.8 }} />
              <span className="text-[10px] text-gray-400">{item.label}</span>
            </div>
          ))}
          <div className="border-t border-gray-800 mt-2 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
              <span className="text-[10px] text-gray-400">Historical Event</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-[10px] text-gray-400">Monitoring Point (click map)</span>
            </div>
          </div>
        </div>

        {/* ── Hint ── */}
        <div className="absolute bottom-8 left-4 z-20 bg-gray-950/80 backdrop-blur border border-gray-800 rounded-lg px-3 py-2 text-[10px] text-gray-500 max-w-xs shadow-lg">
          <Shield size={10} className="inline mr-1 text-blue-500" />
          Click any <strong className="text-gray-300">risk polygon</strong> for details &amp; FoS data · Click empty map to place a <strong className="text-gray-300">monitoring pin</strong>
        </div>
      </main>

      {/* Report Modal */}
      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </div>
  );
}

export default App;
