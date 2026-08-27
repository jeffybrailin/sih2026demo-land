import React from 'react';
import { CloudRain, Droplets, AlertTriangle, Navigation } from 'lucide-react';

export interface TooltipData {
  x: number;
  y: number;
  name: string;
  precipitation: number;
  soilMoisture: number;
  severity: string;
  highway: string;
  prob_now?: number;
  prob_6h?: number;
  priority_rank?: number;
}

interface Props {
  data: TooltipData | null;
}

const severityLabel: Record<string, { label: string; cls: string; color: string }> = {
  RED:    { label: 'Critical', cls: 'badge-critical', color: '#DC2626' },
  ORANGE: { label: 'High Risk', cls: 'badge-high',     color: '#EA580C' },
  YELLOW: { label: 'Watch',    cls: 'badge-watch',     color: '#D97706' },
  GREEN:  { label: 'Safe',     cls: 'badge-safe',      color: '#16A34A' },
};

export const MapTooltip: React.FC<Props> = ({ data }) => {
  if (!data) return null;

  const sev = severityLabel[data.severity] ?? severityLabel['GREEN'];
  const tipStyle: React.CSSProperties = {
    left: data.x + 14,
    top:  data.y - 10,
    transform: data.x > window.innerWidth - 300 ? 'translateX(calc(-100% - 28px))' : 'none',
  };

  return (
    <div
      className="map-tooltip glass-card rounded-xl p-3 tooltip-animate"
      style={tipStyle}
      role="tooltip"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div>
          <div className="text-sm font-bold text-white leading-tight">{data.name}</div>
          {data.priority_rank && <div className="text-[9px] text-purple-400 mt-0.5">Priority #{data.priority_rank}</div>}
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${sev.cls}`}>
          {sev.label}
        </span>
      </div>

      {/* Accent line */}
      <div className="h-px mb-2.5" style={{ background: `linear-gradient(90deg, ${sev.color}60, transparent)` }} />

      {/* Metrics */}
      <div className="space-y-1.5">
        {(data.prob_now !== undefined && data.prob_6h !== undefined) && (
          <div className="flex items-center justify-between gap-3 bg-slate-800/40 px-2 py-1 rounded">
            <div className="text-[10px] text-slate-400">AI Forecast</div>
            <div className="text-[11px] font-bold text-white flex items-center gap-1">
              {Math.round(data.prob_now * 100)}%
              {data.prob_6h > data.prob_now ? <span className="text-red-400">↑</span> : <span className="text-green-400">↓</span>}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <CloudRain size={10} className="text-blue-400" />
            Live Rainfall
          </div>
          <span className="font-mono text-[11px] font-semibold text-blue-300">
            {data.precipitation.toFixed(1)} mm/hr
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <Droplets size={10} className="text-emerald-400" />
            Soil Moisture
          </div>
          <span className="font-mono text-[11px] font-semibold text-emerald-300">
            {(data.soilMoisture * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <Navigation size={10} className="text-amber-400" />
            Nearest Highway
          </div>
          <span className="text-[11px] font-semibold text-amber-300 truncate max-w-[110px]">
            {data.highway}
          </span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-slate-800 text-[9px] text-slate-600 text-center">
        Click for forecast · SHAP · priority
      </div>
    </div>
  );
};
