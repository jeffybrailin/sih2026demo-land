import React from 'react';
import { AlertTriangle, Phone, Radio, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ForecastTimeline } from './ForecastTimeline';
import { ExplainabilityPanel } from './ExplainabilityPanel';
import { PriorityPanel } from './PriorityPanel';

const EMERGENCY_CONTACTS = [
  { name: 'NDRF Control Room',      number: '011-24363260', color: '#DC2626' },
  { name: 'SDRF Meghalaya',         number: '0364-2503010', color: '#1E3A8A' },
  { name: 'IMD Guwahati',           number: '0361-2637537', color: '#0369A1' },
  { name: 'State Emergency (NE)',   number: '1070',         color: '#D97706' },
];

export const RightPanel: React.FC = () => {
  const { activeAlerts, selectedSectorId, forecastData, inferenceResults } = useStore();
  const selectedInf = inferenceResults.find(r => r.sector_id === selectedSectorId);
  const forecast = selectedSectorId ? forecastData[selectedSectorId] : null;

  // Mock priority data for demo since we didn't add full mock array in store
  const priorityMock = selectedSectorId ? {
    sector_id: selectedSectorId, hazard_score: 0.84, exposure_score: 0.77,
    vulnerability_score: 0.62, infrastructure_criticality: 0.90, priority_score: 0.78,
    priority_rank: 1, population_at_risk: 42000, road_name: 'NH-10 (Teesta Valley)', nearest_hospital_km: 18.5
  } : null;

  return (
    <aside
      className="hidden lg:flex flex-col h-full border-l border-slate-800/60 overflow-y-auto"
      style={{ width: 'var(--right-w)', background: 'rgba(9, 14, 26, 0.6)', backdropFilter: 'blur(8px)' }}
      aria-label="Incident log and emergency dispatch panel"
    >
      {/* ── Section 1: Live Incident Feed ── */}
      <div className="flex-shrink-0 p-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={13} className="text-orange-400" />
          <span className="section-label">Live Incident Feed</span>
          {activeAlerts.length > 0 && (
            <span className="ml-auto badge-critical text-[9px] px-2 py-0.5 rounded-full font-bold">
              {activeAlerts.length} Active
            </span>
          )}
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-4">
              <div className="w-3 h-3 rounded-full bg-green-400 mx-auto mb-1" />
              <div className="text-xs text-slate-500">All zones nominal</div>
            </div>
          ) : (
            activeAlerts.map((a, i) => (
              <div key={`${a.sector_id}-${i}`} className="glass-card rounded-xl p-2.5 border-l-2" style={{ borderLeftColor: a.severity === 'RED' ? '#DC2626' : '#EA580C' }}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-semibold text-white truncate">{a.name}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${a.severity === 'RED' ? 'badge-critical' : 'badge-high'}`}>{a.severity}</span>
                </div>
                <div className="text-[10px] mt-1 text-slate-400 leading-tight bg-slate-900/50 px-2 py-1 rounded">
                  {a.recommended_action}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {!selectedSectorId ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 border-b border-slate-800/60">
          <Activity size={32} className="mb-2 opacity-50" />
          <div className="text-sm font-semibold">No Sector Selected</div>
          <div className="text-xs mt-1">Click a sector on the map to see AI analysis</div>
        </div>
      ) : (
        <>
          {/* ── Section 2: Forecast Timeline ── */}
          <div className="border-b border-slate-800/60 relative">
            <div className="absolute top-0 right-0 p-4 text-[9px] font-mono text-slate-500">{selectedSectorId}</div>
            <ForecastTimeline
              sectorId={selectedSectorId}
              probNow={forecast?.prob_now ?? 0} prob1h={forecast?.prob_1h ?? 0}
              prob6h={forecast?.prob_6h ?? 0} prob12h={forecast?.prob_12h ?? 0} prob24h={forecast?.prob_24h ?? 0}
              loading={!forecast}
            />
          </div>

          {/* ── Section 3: Explainability ── */}
          <div className="border-b border-slate-800/60">
            <ExplainabilityPanel
              contributors={forecast?.shap_contributors ?? []}
              topReason={forecast?.top_reason ?? ''}
              riskScore={selectedInf?.risk_score ?? 0}
              riskLevel={selectedInf?.severity ?? 'GREEN'}
              loading={!forecast}
            />
          </div>

          {/* ── Section 4: Priority Breakdown ── */}
          <div className="border-b border-slate-800/60">
            <PriorityPanel data={priorityMock} loading={!priorityMock} />
          </div>
        </>
      )}

      {/* ── Section 5: Emergency Dispatch ── */}
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Radio size={13} className="text-red-400" />
          <span className="section-label">Emergency Dispatch</span>
        </div>
        <div className="space-y-1.5">
          {EMERGENCY_CONTACTS.map(c => (
            <div key={c.name} className="glass-card rounded-xl px-3 py-2 flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-slate-300 truncate">{c.name}</div>
                <div className="font-mono text-[11px] font-bold" style={{ color: c.color }}>{c.number}</div>
              </div>
              <a href={`tel:${c.number.replace(/-/g, '')}`} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors">
                <Phone size={12} className="text-slate-400" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
