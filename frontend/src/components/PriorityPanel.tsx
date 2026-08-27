import React from 'react';
import { PriorityData } from '../services/apiService';

interface Props {
  data: PriorityData | null;
  loading?: boolean;
}

export const PriorityPanel: React.FC<Props> = ({ data, loading }) => {
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-8 bg-slate-800 rounded"></div><div className="h-20 bg-slate-800 rounded"></div></div>;
  if (!data) return <div className="p-4 text-xs text-slate-500">No priority data.</div>;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📊</span>
        <div className="text-sm font-bold text-white">Priority Rank: #{data.priority_rank} <span className="text-xs font-normal text-slate-400">of 44 sectors</span></div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-[11px] mb-1">
          <span className="text-slate-300">Priority Score: {data.priority_score.toFixed(2)}</span>
          <span className="font-mono text-white">{Math.round(data.priority_score * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-purple-500" style={{ width: `${data.priority_score * 100}%` }} />
        </div>
      </div>

      <div className="text-[11px] font-semibold text-slate-400 mb-2">Breakdown:</div>
      <div className="space-y-2 mb-4">
        {[
          { label: 'Hazard (45%)', val: data.hazard_score, color: '#DC2626' },
          { label: 'Exposure (25%)', val: data.exposure_score, color: '#EA580C' },
          { label: 'Vulnerability (20%)', val: data.vulnerability_score, color: '#D97706' },
          { label: 'Infrastructure (10%)', val: data.infrastructure_criticality, color: '#3B82F6' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-32 text-[10px] text-slate-300">{item.label}</div>
            <div className="w-8 text-[10px] font-mono text-slate-400">{item.val.toFixed(2)}</div>
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full" style={{ width: `${item.val * 100}%`, backgroundColor: item.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="text-[11px] font-semibold text-slate-400 mb-2">Context:</div>
      <div className="space-y-1.5 mb-4">
        <div className="glass-card rounded p-2 flex items-center gap-2 text-[11px]">
          <span>👥</span> <span className="text-slate-400 w-24">Pop at risk:</span> <span className="text-white">~{data.population_at_risk.toLocaleString()}</span>
        </div>
        <div className="glass-card rounded p-2 flex items-center gap-2 text-[11px]">
          <span>🛣️</span> <span className="text-slate-400 w-24">Road:</span> <span className="text-white truncate">{data.road_name}</span>
        </div>
        <div className="glass-card rounded p-2 flex items-center gap-2 text-[11px]">
          <span>🏥</span> <span className="text-slate-400 w-24">Hospital:</span> <span className="text-white">{data.nearest_hospital_km} km</span>
        </div>
      </div>
      
      <div className="text-[9px] text-slate-500 italic text-center">
        Priority weights are configurable decision-support parameters.
      </div>
    </div>
  );
};
