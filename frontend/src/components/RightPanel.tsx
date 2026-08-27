import React from 'react';
import { AlertTriangle, Phone, Radio, BarChart2, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';

const EMERGENCY_CONTACTS = [
  { name: 'NDRF Control Room',      number: '011-24363260', icon: '🚨', color: '#DC2626' },
  { name: 'SDRF Meghalaya',         number: '0364-2503010', icon: '🪖', color: '#1E3A8A' },
  { name: 'IMD Guwahati',           number: '0361-2637537', icon: '🌧️', color: '#0369A1' },
  { name: 'State Emergency (NE)',   number: '1070',         icon: '📡', color: '#D97706' },
];

export const RightPanel: React.FC = () => {
  const { activeAlerts, inferenceResults } = useStore();

  // Sort all by risk score descending
  const ranked = [...inferenceResults].sort((a, b) => b.risk_score - a.risk_score).slice(0, 8);

  const getBarColor = (sev: string) => {
    if (sev === 'RED')    return '#DC2626';
    if (sev === 'ORANGE') return '#EA580C';
    if (sev === 'YELLOW') return '#D97706';
    return '#16A34A';
  };

  const maxScore = ranked[0]?.risk_score ?? 1;

  return (
    <aside
      className="hidden lg:flex flex-col h-full border-l border-slate-800/60 overflow-hidden"
      style={{ width: 'var(--right-w)', background: 'rgba(9, 14, 26, 0.6)', backdropFilter: 'blur(8px)' }}
      aria-label="Incident log and emergency dispatch panel"
    >
      {/* ── Section 1: Incident Log ── */}
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
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-5">
              <div className="text-xl mb-1">🟢</div>
              <div className="text-xs text-slate-500">All zones nominal</div>
            </div>
          ) : (
            activeAlerts.map((a, i) => (
              <div
                key={`${a.sector_id}-${i}`}
                className="glass-card rounded-xl p-2.5 border-l-2 animate-fade-in"
                style={{ borderLeftColor: a.severity === 'RED' ? '#DC2626' : '#EA580C' }}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-semibold text-white truncate">{a.name}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                    a.severity === 'RED' ? 'badge-critical' : 'badge-high'
                  }`}>{a.severity}</span>
                </div>
                <div className="text-[10px] text-slate-500 flex gap-2 flex-wrap">
                  <span className="flex items-center gap-0.5">
                    <Clock size={7} /> {new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>FoS {a.fos}</span>
                  <span>Rain {a.rainfall_24h}mm</span>
                </div>
                <div className="text-[9px] mt-1 text-slate-400 leading-tight bg-slate-900/50 px-2 py-1 rounded">
                  {a.recommended_action}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Section 2: AI Risk Ranking ── */}
      <div className="flex-1 p-4 border-b border-slate-800/60 overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={13} className="text-purple-400" />
          <span className="section-label">AI Risk Ranking</span>
          <span className="ml-auto text-[9px] text-slate-600">{inferenceResults.length} sectors</span>
        </div>
        <div className="space-y-1.5 overflow-y-auto h-full pb-4 pr-1">
          {ranked.map((r, i) => (
            <div key={r.sector_id} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-600 w-4 flex-shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-slate-300 truncate leading-none">{r.name}</span>
                  <span className="font-mono text-[9px] text-slate-500 flex-shrink-0 ml-1">
                    {(r.risk_score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(r.risk_score / maxScore) * 100}%`,
                      background: getBarColor(r.severity),
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Emergency Dispatch ── */}
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Radio size={13} className="text-red-400" />
          <span className="section-label">Emergency Dispatch</span>
        </div>
        <div className="space-y-1.5">
          {EMERGENCY_CONTACTS.map(c => (
            <div key={c.name} className="glass-card rounded-xl px-3 py-2 flex items-center gap-2.5">
              <span className="text-base flex-shrink-0">{c.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-slate-300 truncate">{c.name}</div>
                <div className="font-mono text-[11px] font-bold" style={{ color: c.color }}>
                  {c.number}
                </div>
              </div>
              <a
                href={`tel:${c.number.replace(/-/g, '')}`}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
                aria-label={`Call ${c.name}`}
              >
                <Phone size={12} className="text-slate-400" />
              </a>
            </div>
          ))}
        </div>
        <div className="mt-3 text-center text-[9px] text-slate-700">
          MapLibre · Turf.js · Open-Meteo · FastAPI
        </div>
      </div>
    </aside>
  );
};
