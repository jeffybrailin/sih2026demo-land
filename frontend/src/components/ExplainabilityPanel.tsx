import React from 'react';
import { SHAPContributor } from '../services/apiService';
import { Info } from 'lucide-react';

interface Props {
  contributors: SHAPContributor[];
  topReason: string;
  riskScore: number;
  riskLevel: string;
  loading?: boolean;
}

export const ExplainabilityPanel: React.FC<Props> = ({ contributors, topReason, riskScore, riskLevel, loading }) => {
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-4 bg-slate-800 rounded w-1/2"></div><div className="h-24 bg-slate-800 rounded"></div></div>;
  if (!contributors || contributors.length === 0) return <div className="p-4 text-xs text-slate-500">No explainability data available.</div>;

  const getColor = (level: string) => {
    if (level === 'CRITICAL') return '#DC2626';
    if (level === 'HIGH') return '#EA580C';
    if (level === 'WATCH') return '#D97706';
    return '#16A34A';
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor(riskLevel) }} />
        <span className="text-sm font-bold text-white">{riskLevel} RISK — {Math.round(riskScore * 100)}%</span>
      </div>
      <div className="text-xs text-slate-300 mb-4 bg-slate-800/50 p-2 rounded italic">Why? {topReason}</div>
      
      <div className="flex justify-between items-center mb-2">
        <div className="text-[11px] font-semibold text-slate-400">Model contributions:</div>
        <button className="text-slate-500 hover:text-white group relative" aria-label="What is this?">
          <Info size={12} />
          <div className="absolute right-0 top-4 w-48 bg-slate-800 p-2 text-[10px] rounded shadow-lg hidden group-hover:block z-10 text-left text-slate-300">
            SHAP (SHapley Additive exPlanations) values show the marginal contribution of each feature to the model's final prediction.
          </div>
        </button>
      </div>

      <div className="space-y-2">
        {contributors.map(c => (
          <div key={c.feature} className="flex items-center gap-2">
            <div className="w-24 text-[10px] text-slate-300 truncate" title={c.display_name}>{c.display_name}</div>
            <div className="flex-1 h-3 bg-slate-800/50 rounded overflow-hidden flex items-center justify-start">
              <div className="h-full" style={{ width: `${c.importance * 100}%`, backgroundColor: c.direction === 'up' ? '#DC2626' : '#16A34A', opacity: 0.8 }} />
            </div>
            <div className="w-6 text-center text-[10px]">{c.direction === 'up' ? '↑' : '↓'}</div>
            <div className="w-8 text-right text-[10px] font-mono">{Math.round(c.importance * 100)}%</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-1.5 text-[9px] text-slate-500">
        <div className="px-1 border border-slate-700 rounded text-[8px]">ⓘ</div>
        <p>Model contribution values show relative feature influence. They are not causal percentages or probabilities.</p>
      </div>
    </div>
  );
};
