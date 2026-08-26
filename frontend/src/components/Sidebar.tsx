import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle, MapPin, Activity, Layers, Info, Zap } from 'lucide-react';

const CORRIDORS = [
  { id: 'NH6', name: 'NH-6 Guwahati–Shillong', lat: 25.578, lng: 91.893 },
  { id: 'NH10', name: 'NH-10 Teesta–Sikkim', lat: 27.060, lng: 88.470 },
];

export const Sidebar: React.FC = () => {
  const {
    forecastRain24h, antecedentRain7d,
    setForecastRain24h, setAntecedentRain7d,
    alerts, userLocation, isAlertActive
  } = useStore();
  const [smsTriggered, setSmsTriggered] = useState(false);

  const handleSimulateSMS = () => {
    setSmsTriggered(true);
    const messages = [
      `CRITICAL: Landslide risk on NH-6. Avoid travel. Contact: 1070 (NDRF)`,
      `भूस्खलन का खतरा - तुरंत सुरक्षित स्थान पर जाएं। NDRF: 1070`,
      `জরুরি বিজ্ঞপ্তি: ভূমিধস ঝুঁকি। নিরাপদ স্থানে যান। NDRF: 1070`
    ];
    alert(messages.join('\n\n'));
    setTimeout(() => setSmsTriggered(false), 3000);
  };

  const getSeverityBadge = (sev: string) => {
    const map: Record<string, string> = {
      RED: 'bg-red-500/20 text-red-400 border-red-800',
      ORANGE: 'bg-orange-500/20 text-orange-400 border-orange-800',
      YELLOW: 'bg-yellow-500/20 text-yellow-400 border-yellow-800',
      GREEN: 'bg-green-500/20 text-green-400 border-green-800',
    };
    return map[sev] || 'bg-gray-700 text-gray-300 border-gray-600';
  };

  return (
    <div className="w-80 bg-gray-950 text-white flex flex-col h-full border-r border-gray-800 shadow-2xl z-10 relative select-none">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-blue-950 to-gray-950">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={20} className="text-blue-400" />
          <h1 className="text-base font-bold text-white tracking-tight">GeoRisk NE India</h1>
        </div>
        <p className="text-xs text-gray-500">AI-Powered Landslide Early Warning · SIH 2026</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs text-green-400">Live Monitoring Active</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Turf Alert Status */}
        <div className={`mx-3 mt-3 rounded-lg p-3 border text-xs ${isAlertActive ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-gray-900 border-gray-800 text-gray-500'}`}>
          <div className="flex items-center gap-2 font-semibold">
            <Zap size={13} className={isAlertActive ? 'text-red-400' : 'text-gray-600'} />
            Turf.js Intersection Engine
          </div>
          <div className="mt-1">
            {userLocation
              ? `📍 Monitoring: ${userLocation.lat.toFixed(3)}, ${userLocation.lng.toFixed(3)}`
              : 'Click map to place a monitoring point'}
          </div>
          {isAlertActive && <div className="text-red-400 font-bold mt-1">⚠ Intersection Detected!</div>}
        </div>

        {/* Simulation Controls */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={14} className="text-blue-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Rainfall Simulation</h2>
          </div>

          <div className="mb-4">
            <label className="flex justify-between text-xs mb-1.5 text-gray-400">
              <span>24h Forecast</span>
              <span className="font-mono text-blue-300">{forecastRain24h} mm</span>
            </label>
            <input type="range" min="0" max="300" value={forecastRain24h}
              onChange={e => setForecastRain24h(Number(e.target.value))}
              className="w-full h-1.5 accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
              <span>0</span><span>150</span><span>300mm</span>
            </div>
          </div>

          <div>
            <label className="flex justify-between text-xs mb-1.5 text-gray-400">
              <span>7-Day Antecedent API</span>
              <span className="font-mono text-blue-300">{antecedentRain7d} mm</span>
            </label>
            <input type="range" min="0" max="500" value={antecedentRain7d}
              onChange={e => setAntecedentRain7d(Number(e.target.value))}
              className="w-full h-1.5 accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
              <span>0</span><span>250</span><span>500mm</span>
            </div>
          </div>

          {/* Risk meter */}
          <div className="mt-4 rounded-lg bg-gray-900 border border-gray-800 p-3">
            <div className="text-xs text-gray-500 mb-1.5">Computed Saturation Index</div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  (forecastRain24h + antecedentRain7d) < 200 ? 'bg-green-500' :
                  (forecastRain24h + antecedentRain7d) < 400 ? 'bg-yellow-500' :
                  (forecastRain24h + antecedentRain7d) < 600 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(((forecastRain24h + antecedentRain7d) / 800) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>Safe</span><span>Watch</span><span>Warning</span><span>Critical</span>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-orange-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Alerts</h2>
            </div>
            {alerts.length > 0 && (
              <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">{alerts.length}</span>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="text-xs text-gray-600 text-center py-6 border border-gray-800 rounded-lg bg-gray-900/50">
              <div className="text-2xl mb-1">🟢</div>
              No active alerts. Adjust rainfall sliders to simulate conditions.
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert: any, i: number) => (
                <div key={`${alert.sector_id}-${i}`}
                  className={`rounded-lg border p-3 ${getSeverityBadge(alert.severity)}`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-xs truncate">{alert.name}</div>
                      <div className="text-[10px] opacity-70 mt-0.5 flex items-center gap-1">
                        <MapPin size={8} /> {alert.sector_id}
                        <span className="mx-1">·</span>
                        FoS: {parseFloat(alert.fos).toFixed(2)}
                      </div>
                      <div className="text-[10px] mt-1.5 bg-black/20 px-2 py-1 rounded font-medium">
                        {alert.recommended_action}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-gray-800 space-y-2">
        <button
          onClick={handleSimulateSMS}
          className={`w-full py-2 text-white text-xs font-semibold rounded-lg transition-all ${smsTriggered ? 'bg-green-600' : 'bg-blue-700 hover:bg-blue-600'}`}
        >
          {smsTriggered ? '✓ SMS Broadcast Sent' : '📡 Simulate SMS Broadcast (EN / हिन्दी / বাংলা)'}
        </button>
        <div className="text-center text-[9px] text-gray-700">
          MapLibre GL · Turf.js · FastAPI · Open-Meteo
        </div>
      </div>
    </div>
  );
};
