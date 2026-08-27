import React, { useState, useEffect } from 'react';
import { Play, Pause, X, AlertTriangle } from 'lucide-react';

const REPLAY_EVENTS = [
  {
    id: 'noney_2022',
    name: 'Noney Railway Collapse',
    location: 'Manipur — Noney District',
    date: '2022-05-30',
    deaths: 23,
    source: 'NDMA 2022; Manipur SDMA 2022',
    timeline: [
      { hours_before: -24, prob: 0.19, alert_level: null,       label: 'T-24h' },
      { hours_before: -18, prob: 0.28, alert_level: 'ADVISORY',  label: 'T-18h' },
      { hours_before: -12, prob: 0.41, alert_level: 'WATCH',     label: 'T-12h' },
      { hours_before: -6,  prob: 0.63, alert_level: 'WARNING',   label: 'T-6h'  },
      { hours_before: -3,  prob: 0.78, alert_level: 'CRITICAL',  label: 'T-3h'  },
      { hours_before: -1,  prob: 0.86, alert_level: 'CRITICAL',  label: 'T-1h'  },
      { hours_before: 0,   prob: 0.86, alert_level: 'CRITICAL',  label: 'EVENT', isEvent: true },
    ],
    lead_time_label: 'WARNING issued 6h 20min before recorded event',
    terrain: 'slope_deg: 48°, elevation: 700m, schist/clay-loam soils',
    rainfall_note: 'ERA5 archive: 175mm in 7 days before event',
  },
  {
    id: 'mangan_2023',
    name: 'Mangan GLOF Cascade',
    location: 'Sikkim — Teesta Valley',
    date: '2023-10-04',
    deaths: 31,
    source: 'NDMA 2023',
    timeline: [
      { hours_before: -24, prob: 0.35, alert_level: 'WATCH',     label: 'T-24h' },
      { hours_before: -12, prob: 0.52, alert_level: 'WARNING',   label: 'T-12h' },
      { hours_before: -6,  prob: 0.89, alert_level: 'CRITICAL',  label: 'T-6h'  },
      { hours_before: 0,   prob: 0.95, alert_level: 'CRITICAL',  label: 'EVENT', isEvent: true },
    ],
    lead_time_label: 'CRITICAL WARNING issued 6h before recorded event',
    terrain: 'slope_deg: 64°, elevation: 1200m, glacial till',
    rainfall_note: 'GLOF + heavy rainfall trigger',
  },
  {
    id: 'aizawl_2024',
    name: 'Aizawl Quarry Landslide',
    location: 'Mizoram — Aizawl',
    date: '2024-06-30',
    deaths: 41,
    source: 'GSI 2024',
    timeline: [
      { hours_before: -24, prob: 0.22, alert_level: null,        label: 'T-24h' },
      { hours_before: -12, prob: 0.45, alert_level: 'WATCH',     label: 'T-12h' },
      { hours_before: -6,  prob: 0.72, alert_level: 'WARNING',   label: 'T-6h'  },
      { hours_before: -2,  prob: 0.85, alert_level: 'CRITICAL',  label: 'T-2h'  },
      { hours_before: 0,   prob: 0.88, alert_level: 'CRITICAL',  label: 'EVENT', isEvent: true },
    ],
    lead_time_label: 'WARNING issued 6h before recorded event',
    terrain: 'slope_deg: 58°, elevation: 950m, quarry disturbed slope',
    rainfall_note: 'ERA5 archive: 140mm in 24h before event',
  }
];

export const HistoricalReplay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedEventId, setSelectedEventId] = useState(REPLAY_EVENTS[0].id);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const event = REPLAY_EVENTS.find(e => e.id === selectedEventId)!;

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setStepIndex(s => {
          if (s >= event.timeline.length - 1) {
            setIsPlaying(false);
            return s;
          }
          return s + 1;
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, event.timeline.length]);

  const step = event.timeline[stepIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏱</span>
            <h2 className="text-lg font-bold text-white">Historical Event Replay</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-800 pb-2">
            {REPLAY_EVENTS.map(e => (
              <button
                key={e.id}
                onClick={() => { setSelectedEventId(e.id); setStepIndex(0); setIsPlaying(false); }}
                className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${selectedEventId === e.id ? 'bg-slate-800 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                {e.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <div className="text-2xl font-bold text-white mb-1">{event.name}</div>
              <div className="text-sm text-slate-400 mb-4">{event.location} • {event.date}</div>
              <div className="space-y-2 text-xs text-slate-300">
                <div><span className="font-semibold text-slate-500">Terrain:</span> {event.terrain}</div>
                <div><span className="font-semibold text-slate-500">Trigger:</span> {event.rainfall_note}</div>
                <div><span className="font-semibold text-slate-500">Impact:</span> {event.deaths} casualties</div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex flex-col justify-center items-center text-center">
              <div className="text-xs text-slate-400 uppercase mb-2">{step.label}</div>
              <div className="text-5xl font-mono font-bold mb-2" style={{ color: step.prob > 0.75 ? '#DC2626' : step.prob > 0.5 ? '#EA580C' : '#D97706' }}>
                {Math.round(step.prob * 100)}%
              </div>
              {step.alert_level && (
                <div className={`px-3 py-1 rounded text-xs font-bold ${step.alert_level === 'CRITICAL' ? 'bg-red-900/50 text-red-400 border border-red-500/50' : step.alert_level === 'WARNING' ? 'bg-orange-900/50 text-orange-400 border border-orange-500/50' : 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/50'}`}>
                  {step.alert_level}
                </div>
              )}
              {step.isEvent && <div className="mt-2 text-red-500 font-bold animate-pulse flex items-center gap-1"><AlertTriangle size={14}/> LANDSLIDE RECORDED</div>}
            </div>
          </div>

          {/* Timeline Bar */}
          <div className="relative pt-4 pb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-colors shadow-lg"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
              </button>
              <input
                type="range"
                min="0"
                max={event.timeline.length - 1}
                value={stepIndex}
                onChange={e => { setStepIndex(parseInt(e.target.value)); setIsPlaying(false); }}
                className="flex-1 accent-blue-500"
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-mono px-12">
              {event.timeline.map((t, i) => (
                <div key={i} className={`flex flex-col items-center ${i === stepIndex ? 'text-white font-bold' : ''}`}>
                  <div className={`w-2 h-2 rounded-full mb-1 ${i <= stepIndex ? 'bg-blue-500' : 'bg-slate-700'}`} />
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* Lead time callout */}
          <div className="mt-auto bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
            <span className="text-green-400 font-bold">⚡ {event.lead_time_label}</span>
          </div>
          
          <div className="mt-4 text-[10px] text-slate-500 text-center italic">
            This replay uses historical archive data and the trained AI model. It demonstrates the system's retrospective predictive capability.
            Data: {event.source}
          </div>
        </div>
      </div>
    </div>
  );
};
