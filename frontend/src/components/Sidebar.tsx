import React from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle, MapPin, Activity } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { forecastRain24h, antecedentRain7d, setForecastRain24h, setAntecedentRain7d, alerts } = useStore();

  const handleSimulateSMS = () => {
    alert("CRITICAL WARNING: Imminent Landslide Risk. Evacuate immediately! / \u092D\u093E\u0930\u0940 \u092C\u093E\u0930\u093F\u0936 \u0914\u0930 \u092D\u0942\u0938\u094D\u0916\u0932\u0928 \u0915\u0940 \u091A\u0947\u0924\u093E\u0935\u0928\u0940");
  };

  return (
    <div className="w-80 bg-gray-900 text-white flex flex-col h-full border-r border-gray-700 shadow-2xl z-10 relative">
      <div className="p-5 border-b border-gray-700">
        <h1 className="text-xl font-bold flex items-center gap-2 text-blue-400">
          <Activity size={24} />
          GeoRisk Dashboard
        </h1>
        <p className="text-xs text-gray-400 mt-1">North Eastern Region, India</p>
      </div>

      <div className="p-5 flex-1 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Simulation Engine</h2>
          
          <div className="mb-4">
            <label className="block text-sm mb-1 flex justify-between">
              <span>24h Forecast (mm)</span>
              <span className="font-mono text-blue-400">{forecastRain24h}</span>
            </label>
            <input 
              type="range" 
              min="0" max="300" 
              value={forecastRain24h} 
              onChange={(e) => setForecastRain24h(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1 flex justify-between">
              <span>7-Day Antecedent (mm)</span>
              <span className="font-mono text-blue-400">{antecedentRain7d}</span>
            </label>
            <input 
              type="range" 
              min="0" max="500" 
              value={antecedentRain7d} 
              onChange={(e) => setAntecedentRain7d(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4 flex items-center justify-between">
            Active Alerts
            <span className="bg-red-500/20 text-red-500 py-0.5 px-2 rounded-full text-xs">
              {alerts.length}
            </span>
          </h2>
          
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-sm text-gray-500 text-center p-4 border border-gray-800 rounded bg-gray-800/50">
                No active warnings
              </div>
            ) : (
              alerts.map((alert: any) => (
                <div key={alert.sector_id} className={`p-3 rounded border ${alert.severity === 'RED' ? 'bg-red-900/20 border-red-900' : 'bg-orange-900/20 border-orange-900'}`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className={alert.severity === 'RED' ? 'text-red-500' : 'text-orange-500'} />
                    <div>
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        {alert.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <MapPin size={10} /> Sector: {alert.sector_id}
                      </p>
                      <p className="text-xs font-semibold mt-2 text-white bg-black/30 p-1.5 rounded inline-block">
                        {alert.recommended_action}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-700">
        <button 
          onClick={handleSimulateSMS}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
        >
          Simulate SMS Broadcast
        </button>
      </div>
    </div>
  );
};
