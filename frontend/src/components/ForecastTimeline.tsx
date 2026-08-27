import React from 'react';

export interface ForecastHorizon {
  horizon_label: string;
  prob: number;
  risk_level: string;
  color: string;
}

interface Props {
  sectorId: string | null;
  probNow: number;
  prob1h: number;
  prob6h: number;
  prob12h: number;
  prob24h: number;
  loading?: boolean;
}

const getRiskLevel = (prob: number) => {
  if (prob >= 0.75) return { level: 'CRITICAL', color: '#DC2626', badge: 'badge-critical' };
  if (prob >= 0.50) return { level: 'HIGH', color: '#EA580C', badge: 'badge-high' };
  if (prob >= 0.25) return { level: 'WATCH', color: '#D97706', badge: 'badge-watch' };
  return { level: 'SAFE', color: '#16A34A', badge: 'badge-safe' };
};

export const ForecastTimeline: React.FC<Props> = ({
  sectorId,
  probNow,
  prob1h,
  prob6h,
  prob12h,
  prob24h,
  loading
}) => {
  if (!sectorId) return <div className="text-slate-500 text-xs p-4">Click a sector on the map to see AI analysis</div>;
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-4 bg-slate-800 rounded w-1/2"></div><div className="h-20 bg-slate-800 rounded"></div></div>;

  const horizons = [
    { label: '1h', prob: prob1h },
    { label: '6h', prob: prob6h },
    { label: '12h', prob: prob12h },
    { label: '24h', prob: prob24h },
  ];

  const maxProb = Math.max(...horizons.map(h => h.prob));

  return (
    <div className="p-4">
      <div className="text-sm font-bold text-white mb-4">Forecast Timeline</div>
      <div className="font-mono text-xs text-slate-300 mb-2">NOW ({Math.round(probNow * 100)}%)</div>
      <div className="pl-2 border-l-2 border-slate-700 ml-2 space-y-3 relative">
        {horizons.map((h, i) => {
          const risk = getRiskLevel(h.prob);
          const isWorst = h.prob === maxProb && h.prob >= 0.5;
          return (
            <div key={h.label} className="flex items-center gap-3 relative before:content-[''] before:absolute before:w-3 before:h-[2px] before:bg-slate-700 before:-left-2 before:top-1/2">
              <div className="w-8 text-[11px] font-mono text-slate-400">{h.label}</div>
              <div className="w-8 text-[11px] font-bold text-white text-right">{Math.round(h.prob * 100)}%</div>
              <div className={`flex-1 h-2 bg-slate-800 rounded-full overflow-hidden ${isWorst ? 'ring-1 ring-offset-1 ring-offset-slate-900 ring-red-500' : ''}`}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${h.prob * 100}%`, backgroundColor: risk.color }} />
              </div>
              <div className={`text-[9px] font-bold px-2 py-0.5 rounded ${risk.badge}`}>
                {risk.level}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
