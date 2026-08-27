import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapComponent } from './components/MapComponent';
import { ReportModal } from './components/ReportModal';
import { AlertBanner } from './components/AlertBanner';
import { GovHeader } from './components/GovHeader';
import { MobileBottomSheet } from './components/MobileBottomSheet';
import { RightPanel } from './components/RightPanel';
import { useStore } from './store/useStore';
import { RefreshCw, Camera, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HistoricalReplay } from './components/HistoricalReplay';
import './i18n';

function App() {
  const { fetchLiveWeather, activeAlerts, inferenceResults, weatherStatus, showHistoricalReplay, toggleHistoricalReplay } = useStore();
  const { t } = useTranslation();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const doFetch = useCallback(async () => {
    setSyncing(true);
    await fetchLiveWeather();
    setSyncing(false);
  }, [fetchLiveWeather]);

  useEffect(() => {
    doFetch();
    const interval = setInterval(doFetch, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [doFetch]);

  const criticalCount = activeAlerts.filter(a => a.severity === 'RED').length;
  const warningCount  = activeAlerts.filter(a => a.severity === 'ORANGE').length;

  return (
    /*
     * Layout strategy:
     *   Mobile  (<md)  : GovHeader + full-height map + MobileBottomSheet overlay
     *   Tablet  (md)   : GovHeader + Sidebar 300px | Map flex-1
     *   Desktop (lg)   : GovHeader + Sidebar 300px | Map flex-1 | RightPanel 310px
     */
    <div
      className="flex flex-col overflow-hidden"
      style={{ width: '100vw', height: '100dvh', background: 'var(--color-navy-900)' }}
    >
      {/* ── Fixed institutional header ── */}
      <GovHeader />

      {/* ── Alert banner (slides in below header when triggered) ── */}
      <AlertBanner />

      {/* ── Body: content below 56px header ── */}
      <div className="flex-none px-4 py-2 border-b border-slate-800/60 flex items-center justify-between" style={{ background: 'rgba(9,14,26,0.9)' }}>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar">
          <div className="flex flex-col"><span className="text-[9px] text-red-500 uppercase">Critical Zones</span><span className="font-bold text-red-400 text-xs">{criticalCount}</span></div>
          <div className="w-px bg-slate-800/60" />
          <div className="flex flex-col"><span className="text-[9px] text-orange-500 uppercase">High Risk</span><span className="font-bold text-orange-400 text-xs">{warningCount}</span></div>
          <div className="w-px bg-slate-800/60" />
          <div className="flex flex-col"><span className="text-[9px] text-blue-500 uppercase">Active Warnings</span><span className="font-bold text-blue-400 text-xs">{activeAlerts.length}</span></div>
          <div className="w-px bg-slate-800/60" />
          <div className="flex flex-col"><span className="text-[9px] text-amber-500 uppercase">Roads At Risk</span><span className="font-bold text-amber-400 text-xs">{(criticalCount + warningCount)}</span></div>
          <div className="w-px bg-slate-800/60" />
          <div className="flex flex-col"><span className="text-[9px] text-emerald-500 uppercase">Field Reports</span><span className="font-bold text-emerald-400 text-xs">3</span></div>
        </div>
      </div>
      <div
        className="flex flex-1 overflow-hidden"
      >
        {/* LEFT: Telemetry sidebar — hidden on mobile, shown md+ */}
        <Sidebar />

        {/* CENTRE: Map viewport */}
        <main className="flex-1 relative overflow-hidden">
          <MapComponent />

          {/* ── Floating status cluster (top-centre over map) ── */}
          <div className="absolute top-3 left-0 right-0 z-20 flex justify-center pointer-events-none">
            <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">

              {/* API status */}
              <div className={`glass-card rounded-lg px-2.5 py-1.5 hidden sm:flex flex-col items-center ${
                weatherStatus === 'error' ? 'border-red-900/50' : ''
              }`}>
                <div className="text-[8px] text-slate-600 uppercase tracking-wider leading-none mb-0.5">
                  XGBoost
                </div>
                <div className={`text-[10px] font-bold ${
                  weatherStatus === 'success' ? 'text-green-400' :
                  weatherStatus === 'error'   ? 'text-red-400'   : 'text-blue-400'
                }`}>
                  {weatherStatus === 'fetching' ? 'Syncing…' :
                   weatherStatus === 'error'    ? 'Error'    :
                   `44 Sectors`}
                </div>
              </div>

              {/* Critical counter */}
              {criticalCount > 0 && (
                <div className="glass-card rounded-lg px-2.5 py-1.5 flex flex-col items-center" style={{ borderColor: '#DC2626', borderWidth: 1 }}>
                  <div className="text-[8px] text-red-500 uppercase tracking-wider leading-none mb-0.5">Critical</div>
                  <div className="text-[11px] font-bold text-red-400">{criticalCount}</div>
                </div>
              )}
              {warningCount > 0 && (
                <div className="glass-card rounded-lg px-2.5 py-1.5 flex flex-col items-center" style={{ borderColor: '#EA580C', borderWidth: 1 }}>
                  <div className="text-[8px] text-orange-500 uppercase tracking-wider leading-none mb-0.5">Warning</div>
                  <div className="text-[11px] font-bold text-orange-400">{warningCount}</div>
                </div>
              )}
            </div>
          </div>

          {/* ── Top-right controls (over map) ── */}
          <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5">
            <button
              onClick={toggleHistoricalReplay}
              className="glass-card rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-purple-600/40 transition-all"
            >
              <Clock size={12} className="text-purple-400" />
              <span className="hidden sm:inline">Replay</span>
            </button>
            <button
              onClick={doFetch}
              disabled={syncing}
              className="glass-card rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-blue-600/40 transition-all disabled:opacity-40"
              aria-label="Refresh all live weather and inference data"
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin text-blue-400' : ''} />
              <span className="hidden sm:inline">{syncing ? 'Syncing…' : 'Refresh'}</span>
            </button>

            {/* Report button — desktop/tablet; mobile uses bottom sheet */}
            <button
              onClick={() => setIsReportOpen(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #172e70)' }}
              aria-label="Open citizen field hazard report"
            >
              <Camera size={13} />
              {t('field_report')}
            </button>
          </div>



          {/* ── Bottom-left: Risk legend ── */}
          <div className="absolute bottom-4 left-3 z-20 glass-card rounded-xl p-3 text-[10px]">
            <div className="section-label mb-2">{t('risk_legend')}</div>
            {[
              { color: '#DC2626', label: 'Critical — ML Score > 0.75' },
              { color: '#EA580C', label: 'High — ML Score 0.50–0.75'  },
              { color: '#D97706', label: 'Watch — ML Score 0.25–0.50'  },
              { color: '#16A34A', label: 'Safe — ML Score < 0.25'     },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 mb-1">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ background: item.color, opacity: 0.85 }}
                />
                <span className="text-slate-400">{item.label}</span>
              </div>
            ))}
            <div className="border-t border-slate-800 mt-2 pt-2 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-slate-500">Historical Event</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-slate-500">Monitoring Pin</span>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT: Incident log + dispatch panel — lg+ only */}
        <RightPanel />
      </div>

      {/* ── Mobile bottom sheet — md and below only ── */}
      <MobileBottomSheet onOpenReport={() => setIsReportOpen(true)} />

      {/* ── Report modal ── */}
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
      
      {/* ── Historical Replay Modal ── */}
      {showHistoricalReplay && <HistoricalReplay onClose={toggleHistoricalReplay} />}
    </div>
  );
}

export default App;
