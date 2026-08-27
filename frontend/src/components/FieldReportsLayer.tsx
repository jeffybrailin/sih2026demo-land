import React from 'react';
import { FieldReport } from '../services/apiService';

interface Props {
  reports: FieldReport[];
  onReportClick?: (report: FieldReport) => void;
  filterStatus?: string;
}

const typeIcon = (type: string) => {
  if (type === 'Landslide') return '🔴';
  if (type === 'Slope Movement') return '🟠';
  if (type === 'Crack') return '🟡';
  return '🚧';
};

export const FieldReportsLayer: React.FC<Props> = ({ reports, onReportClick, filterStatus = 'ALL' }) => {
  const filtered = reports.filter(r => filterStatus === 'ALL' || r.verification_status === filterStatus);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="section-label">Field Intelligence</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-xs text-slate-500 py-4">No field reports in this area.</div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filtered.map(r => (
            <div key={r.id} onClick={() => onReportClick && onReportClick(r)} className="glass-card rounded-xl p-2.5 cursor-pointer hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start justify-between mb-1">
                <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <span>{typeIcon(r.report_type)}</span>
                  {r.report_type}
                </div>
                <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${r.verification_status === 'VERIFIED' ? 'bg-green-900/50 text-green-400' : r.verification_status === 'REJECTED' ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                  {r.verification_status}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 line-clamp-2 mb-1">{r.description}</div>
              <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                <span>{r.lat.toFixed(4)}, {r.lon.toFixed(4)}</span>
                <span>{new Date(r.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-3 text-[9px] text-slate-500 italic text-center">
        Field reports are supplementary ground intelligence. The AI system warns independently.
      </div>
    </div>
  );
};
