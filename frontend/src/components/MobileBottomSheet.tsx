import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Camera, CloudRain, Droplets, AlertTriangle, MapPin } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';

interface Props {
  onOpenReport: () => void;
}

export const MobileBottomSheet: React.FC<Props> = ({ onOpenReport }) => {
  const [expanded, setExpanded] = useState(false);
  const { activeAlerts, weatherData, inferenceResults } = useStore();
  const { t } = useTranslation();

  const avgRain = weatherData.length
    ? (weatherData.reduce((s, w) => s + w.hourly_precipitation_24h, 0) / weatherData.length).toFixed(1)
    : '–';
  const avgSM = weatherData.length
    ? (weatherData.reduce((s, w) => s + w.current_soil_moisture, 0) / weatherData.length).toFixed(3)
    : '–';
  const redCount   = activeAlerts.filter(a => a.severity === 'RED').length;
  const orangeCount = activeAlerts.filter(a => a.severity === 'ORANGE').length;

  const severityBadge: Record<string, string> = {
    RED:    'badge-critical',
    ORANGE: 'badge-high',
    YELLOW: 'badge-watch',
    GREEN:  'badge-safe',
  };

  return (
    <div
      className={`bottom-sheet glass-card rounded-t-2xl md:hidden ${expanded ? 'expanded' : 'collapsed'}`}
      style={{ maxHeight: '70vh' }}
    >
      {/* Drag handle + toggle */}
      <button
        className="w-full pt-3 pb-2 px-4 flex flex-col items-center"
        onClick={() => setExpanded(e => !e)}
        aria-label={expanded ? 'Collapse panel' : 'Expand live stats panel'}
        style={{ minHeight: '44px' }}
      >
        <div className="drag-handle" />
        <div className="flex items-center justify-between w-full">
          <span className="text-xs font-semibold text-white">Live Threat Dashboard</span>
          <div className="flex items-center gap-2">
            {redCount > 0 && (
              <span className="badge-critical text-[10px] px-2 py-0.5 rounded-full font-bold">
                {redCount} Critical
              </span>
            )}
            {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
          </div>
        </div>
      </button>

      {/* Content (visible when expanded) */}
      <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: 'calc(70vh - 80px)' }}>
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="glass-card-light rounded-xl p-3 text-center">
            <CloudRain size={14} className="text-blue-400 mx-auto mb-1" />
            <div className="font-mono text-base font-bold text-blue-300">{avgRain}</div>
            <div className="text-[9px] text-slate-500">mm Rain</div>
          </div>
          <div className="glass-card-light rounded-xl p-3 text-center">
            <Droplets size={14} className="text-emerald-400 mx-auto mb-1" />
            <div className="font-mono text-sm font-bold text-emerald-300">{avgSM}</div>
            <div className="text-[9px] text-slate-500">Soil Moist.</div>
          </div>
          <div className="glass-card-light rounded-xl p-3 text-center">
            <AlertTriangle size={14} className="text-red-400 mx-auto mb-1" />
            <div className="font-mono text-base font-bold text-red-300">{redCount + orangeCount}</div>
            <div className="text-[9px] text-slate-500">Alerts</div>
          </div>
        </div>

        {/* Active Alerts list */}
        {activeAlerts.length > 0 ? (
          <div className="space-y-2 mb-4">
            <div className="section-label mb-2">Active Alerts — {inferenceResults.length} sectors monitored</div>
            {activeAlerts.map((a, i) => (
              <div key={`${a.sector_id}-${i}`} className="glass-card rounded-xl p-3 border-l-2"
                style={{ borderLeftColor: a.severity === 'RED' ? '#DC2626' : '#EA580C' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white truncate">{a.name}</div>
                    <div className="flex gap-2 mt-1 text-[10px] text-slate-500 flex-wrap">
                      <span className="flex items-center gap-0.5"><MapPin size={8} />{a.sector_id}</span>
                      <span>FoS: {a.fos}</span>
                      <span>Rain: {a.rainfall_24h}mm</span>
                    </div>
                    <div className="text-[10px] mt-1.5 text-slate-400 bg-slate-800/50 px-2 py-1 rounded leading-tight">
                      {a.recommended_action}
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-1 rounded-full font-bold flex-shrink-0 ${severityBadge[a.severity] ?? ''}`}>
                    {a.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-slate-500 text-sm">
            <div className="text-2xl mb-2">🟢</div>
            All zones nominal — No active alerts
          </div>
        )}

        {/* Report Hazard CTA */}
        <button
          onClick={onOpenReport}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #1E3A8A, #172e70)', minHeight: '44px' }}
          aria-label="Open citizen field hazard report form"
        >
          <Camera size={16} />
          Report Hazard / Upload Photo
        </button>
      </div>
    </div>
  );
};
