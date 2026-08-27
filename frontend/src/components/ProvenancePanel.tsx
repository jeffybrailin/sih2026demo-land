import React from 'react';
import { ProvenanceData, ModelInfo } from '../services/apiService';

interface Props {
  data: ProvenanceData | null;
  modelInfo: ModelInfo | null;
  loading?: boolean;
}

export const ProvenancePanel: React.FC<Props> = ({ data, modelInfo, loading }) => {
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-20 bg-slate-800 rounded"></div></div>;
  if (!data || !modelInfo) return <div className="p-4 text-xs text-slate-500">No provenance data available.</div>;

  return (
    <div className="p-4">
      <div className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <span>🔍</span> Data Provenance — {data.sector_id}
      </div>

      <div className="space-y-3 mb-4">
        <div className="glass-card rounded p-2.5">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Rainfall Data</div>
          <div className="flex justify-between items-center text-[11px] mb-0.5">
            <span className="text-slate-300">Source:</span> <span className="text-white">{data.rainfall_source}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] mb-0.5">
            <span className="text-slate-300">Time:</span> <span className="text-white">{data.rainfall_obs_time}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-300">Quality:</span> <span className="text-green-400 font-bold text-[9px] bg-green-900/30 px-1.5 rounded">OPERATIONAL ✓</span>
          </div>
        </div>

        <div className="glass-card rounded p-2.5">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Terrain Data</div>
          <div className="flex justify-between items-center text-[11px] mb-0.5">
            <span className="text-slate-300">Source:</span> <span className="text-white">{data.terrain_source}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-300">Resolution:</span> <span className="text-white">{data.terrain_resolution}</span>
          </div>
        </div>

        <div className="glass-card rounded p-2.5">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Soil Data</div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-300">Source:</span> <span className="text-white truncate max-w-[150px]">{data.soil_source}</span>
          </div>
        </div>

        <div className="glass-card rounded p-2.5 border border-purple-500/30 bg-purple-900/10">
          <div className="text-[10px] uppercase font-bold text-purple-400 mb-1">AI Model</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            <div className="flex justify-between"><span className="text-slate-400">Version:</span> <span className="text-white">{modelInfo.model_version}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Trained:</span> <span className="text-white">{modelInfo.trained_on}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">CV AUC-ROC:</span> <span className="text-white font-mono">{modelInfo.cv_roc_auc_mean.toFixed(4)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Brier Score:</span> <span className="text-white font-mono">{modelInfo.brier_score.toFixed(3)}</span></div>
            <div className="flex justify-between col-span-2"><span className="text-slate-400">Split:</span> <span className="text-white">{modelInfo.training_split_method}</span></div>
            <div className="flex justify-between col-span-2"><span className="text-slate-400">Features:</span> <span className="text-white">{modelInfo.feature_count}</span></div>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 text-center mb-1">Prediction generated: {data.prediction_timestamp}</div>
      <div className="text-[9px] text-slate-500 italic text-center">
        All predictions are auditable. Data sources are documented.
      </div>
    </div>
  );
};
