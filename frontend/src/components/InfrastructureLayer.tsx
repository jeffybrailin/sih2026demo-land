import React from 'react';
import { Shield } from 'lucide-react';

interface Props {
  sectorId: string | null;
  nearbyInfra?: {
    hospitals: Array<{name: string; distance_km: number}>;
    bridges: Array<{name: string; status: string}>;
    schools: Array<{name: string; distance_km: number}>;
    relief_centres: Array<{name: string; distance_km: number}>;
  };
}

export const InfrastructureLayer: React.FC<Props> = ({ sectorId, nearbyInfra }) => {
  if (!sectorId) return null;

  // Fallback mock data if not provided
  const infra = nearbyInfra || {
    hospitals: [{ name: 'District Hospital', distance_km: 12.5 }, { name: 'PHC Centre', distance_km: 3.2 }],
    bridges: [{ name: 'NH-10 Main Bridge', status: 'AT_RISK' }, { name: 'Local Stream Crossing', status: 'OPEN' }],
    schools: [{ name: 'Govt High School', distance_km: 1.5 }],
    relief_centres: [{ name: 'Community Hall', distance_km: 2.0 }]
  };

  const getStatusColor = (s: string) => s === 'OPEN' ? 'text-green-400' : s === 'BLOCKED' ? 'text-red-400' : 'text-orange-400';

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield size={14} className="text-blue-400" />
        <span className="section-label">Critical Infrastructure</span>
      </div>
      
      <div className="glass-card rounded-xl p-3 bg-blue-900/10 border-blue-900/30 mb-4">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Nearest Hospital</div>
        <div className="text-sm font-bold text-blue-300">{infra.hospitals[0]?.name} <span className="text-xs font-normal text-slate-300 ml-1">({infra.hospitals[0]?.distance_km} km)</span></div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-[10px] font-semibold text-slate-400 mb-1.5 uppercase">Bridges & Routes</div>
          <div className="space-y-1">
            {infra.bridges.map((b, i) => (
              <div key={i} className="flex justify-between items-center text-[11px] bg-slate-800/40 px-2 py-1.5 rounded">
                <span className="text-slate-300">{b.name}</span>
                <span className={`font-mono text-[9px] ${getStatusColor(b.status)}`}>{b.status}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <div className="text-[10px] font-semibold text-slate-400 mb-1.5 uppercase">Relief Centres</div>
          <div className="space-y-1">
            {infra.relief_centres.map((r, i) => (
              <div key={i} className="flex justify-between items-center text-[11px] bg-slate-800/40 px-2 py-1.5 rounded">
                <span className="text-slate-300">{r.name}</span>
                <span className="text-slate-400">{r.distance_km} km</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
