import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle, MapPin, Activity, Zap, RefreshCw,
  CloudRain, Droplets, Brain, BarChart2, Satellite,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeAlerts, userLocation, isAlertActive,
    weatherStatus, lastWeatherFetch, weatherData,
    inferenceResults, fetchLiveWeather,
  } = useStore();
  const { t } = useTranslation();
  const [smsSent, setSmsSent] = useState(false);

  const handleSimulateSMS = () => {
    setSmsSent(true);
    alert(
      `SMS BROADCAST TRIGGERED\n\n` +
      `EN: ${t('critical_sms')}\n\n` +
      `HI: ${t('critical_sms_hi')}\n\n` +
      `[Via Twilio/Fast2SMS → Registered phones in affected geo-fence]`
    );
    setTimeout(() => setSmsSent(false), 4000);
  };

  // Summary stats
  const redCount   = activeAlerts.filter(a => a.severity === 'RED').length;
  const orangeCount = activeAlerts.filter(a => a.severity === 'ORANGE').length;
  const greenCount  = inferenceResults.filter(r => r.severity === 'GREEN').length;

  const avgRain = weatherData.length
    ? (weatherData.reduce((s, w) => s + w.hourly_precipitation_24h, 0) / weatherData.length).toFixed(1)
    : '–';
  const avgSM = weatherData.length
    ? (weatherData.reduce((s, w) => s + w.current_soil_moisture, 0) / weatherData.length).toFixed(4)
    : '–';

  const severityBorder: Record<string, string> = {
    RED:    '#DC2626',
    ORANGE: '#EA580C',
    YELLOW: '#D97706',
    GREEN:  '#16A34A',
  };
  const severityBadge: Record<string, string> = {
    RED:    'badge-critical',
    ORANGE: 'badge-high',
    YELLOW: 'badge-watch',
    GREEN:  'badge-safe',
  };

  return (
    <aside
      className="hidden md:flex flex-col h-full border-r border-slate-800/60 overflow-hidden select-none"
      style={{ width: 'var(--sidebar-w)', background: 'rgba(9,14,26,0.7)', backdropFilter: 'blur(10px)' }}
      aria-label="Telemetry sidebar — live weather and ML inference data"
    >
      {/* ── Live Status Badge ── */}
      <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-green-400 uppercase tracking-widest">
            Live Monitoring Active
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Satellite size={10} className="text-blue-400" />
          <span className="text-[10px] text-white">NE India</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Section: Live Weather ── */}
        <div className="p-4 border-b border-slate-800/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CloudRain size={13} className="text-blue-400" />
              <span className="section-label">Live Weather · Open-Meteo</span>
            </div>
            <button
              onClick={fetchLiveWeather}
              disabled={weatherStatus === 'fetching'}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white transition-colors disabled:opacity-40 py-1 px-1.5 rounded hover:bg-slate-800/50"
              aria-label="Refresh live weather data"
            >
              <RefreshCw size={9} className={weatherStatus === 'fetching' ? 'animate-spin' : ''} />
              {weatherStatus === 'fetching' ? 'Syncing…' :
               weatherStatus === 'error' ? 'Retry' :
               lastWeatherFetch}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="glass-card rounded-xl p-3">
              <div className="text-[9px] text-white mb-1 uppercase tracking-wider">Avg Rainfall</div>
              <div className="font-mono text-xl font-bold text-blue-300 leading-none">{avgRain}</div>
              <div className="text-[9px] text-white mt-0.5">mm · 24h avg</div>
            </div>
            <div className="glass-card rounded-xl p-3">
              <div className="text-[9px] text-white mb-1 uppercase tracking-wider">Soil Moisture</div>
              <div className="font-mono text-xl font-bold text-emerald-300 leading-none">{avgSM}</div>
              <div className="text-[9px] text-white mt-0.5">volumetric avg</div>
            </div>
          </div>

          {/* Status pill */}
          <div className={`mt-2 rounded-lg px-3 py-2 text-[10px] flex items-center gap-1.5 ${
            weatherStatus === 'error' ? 'bg-red-950/40 border border-red-900/50 text-red-400' :
            weatherStatus === 'fetching' ? 'bg-blue-950/40 border border-blue-900/50 text-blue-400' :
            'bg-green-950/30 border border-green-900/30 text-green-400'
          }`}>
            <Activity size={9} />
            {weatherStatus === 'error' ? 'API unreachable — cached data displayed' :
             weatherStatus === 'fetching' ? 'Fetching Open-Meteo API…' :
             `${inferenceResults.length} sectors live · Updated ${lastWeatherFetch}`}
          </div>
        </div>

        {/* ── Section: ML Inference ── */}
        <div className="p-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={13} className="text-purple-400" />
            <span className="section-label">ML Engine — XGBoost (primary) + RF (baseline)</span>
            <span className="ml-auto text-[9px] bg-purple-950/40 text-purple-400 border border-purple-900/40 px-2 py-0.5 rounded-full font-semibold truncate max-w-[80px]" title="Platt-calibrated | spatial-temporal validation">
              Platt-calibrated | spatial-temporal validation
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mb-2 truncate">IMD · ERA5 · GSI Atlas · NBSS-LUP · NRSC LULC</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="glass-card rounded-xl p-3 text-center border-t-2" style={{ borderTopColor: '#DC2626' }}>
              <div className="font-mono text-2xl font-bold text-red-400 leading-none">{redCount}</div>
              <div className="text-[9px] text-red-500 mt-1 uppercase tracking-wider">Critical</div>
            </div>
            <div className="glass-card rounded-xl p-3 text-center border-t-2" style={{ borderTopColor: '#EA580C' }}>
              <div className="font-mono text-2xl font-bold text-orange-400 leading-none">{orangeCount}</div>
              <div className="text-[9px] text-orange-500 mt-1 uppercase tracking-wider">Warning</div>
            </div>
            <div className="glass-card rounded-xl p-3 text-center border-t-2" style={{ borderTopColor: '#16A34A' }}>
              <div className="font-mono text-2xl font-bold text-green-400 leading-none">{greenCount}</div>
              <div className="text-[9px] text-green-600 mt-1 uppercase tracking-wider">Safe</div>
            </div>
          </div>
        </div>

        {/* ── Section: Turf Intersection ── */}
        <div className="p-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={13} className={isAlertActive ? 'text-red-400' : 'text-slate-600'} />
            <span className="section-label">Turf.js Geo-Intersection</span>
          </div>
          <div className={`glass-card rounded-xl p-3 ${isAlertActive ? 'border-red-800/60' : ''}`}
            style={isAlertActive ? { borderColor: '#DC2626', borderWidth: 1, borderStyle: 'solid' } : {}}>
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin size={10} className={isAlertActive ? 'text-red-400' : 'text-slate-600'} />
              <span className="text-[10px] font-semibold" style={{ color: isAlertActive ? '#f87171' : '#475569' }}>
                {isAlertActive ? 'USER IN DANGER ZONE' : 'Point-in-Polygon Monitor'}
              </span>
            </div>
            <div className="font-mono text-[10px] text-slate-400">
              {userLocation
                ? `${userLocation.lat.toFixed(5)}°N, ${userLocation.lng.toFixed(5)}°E`
                : t('click_map')}
            </div>
            {isAlertActive && (
              <div className="text-red-400 font-bold text-[10px] mt-1.5 animate-pulse">
                {t('intersection_active')}
              </div>
            )}
          </div>
        </div>

        {/* ── Section: Active Alerts ── */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} className="text-orange-400" />
              <span className="section-label">{t('active_alerts')}</span>
            </div>
            {activeAlerts.length > 0 && (
              <span className="badge-critical text-[9px] px-2 py-0.5 rounded-full font-bold">
                {activeAlerts.length}
              </span>
            )}
          </div>

          {activeAlerts.length === 0 ? (
            <div className="glass-card rounded-xl py-6 text-center">
              <div className="w-3 h-3 rounded-full bg-green-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-green-400">All Zones Nominal</div>
              <div className="text-[10px] text-slate-500 mt-1">{t('no_alerts')}</div>
            </div>
          ) : (
            <div className="space-y-2">
              {activeAlerts.map((a, i) => (
                <div
                  key={`${a.sector_id}-${i}`}
                  className="glass-card rounded-xl p-3 border-l-2"
                  style={{ borderLeftColor: severityBorder[a.severity] ?? '#16A34A' }}
                  role="listitem"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="text-xs font-semibold text-white leading-tight">{a.name}</div>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${severityBadge[a.severity] ?? ''}`}>
                      {a.severity}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex gap-2 flex-wrap mb-1.5">
                    <span className="flex items-center gap-0.5">
                      <MapPin size={8} />{a.sector_id}
                    </span>
                    <span className="font-mono">FoS {a.fos}</span>
                    <span className="font-mono">{a.rainfall_24h}mm</span>
                  </div>
                  <div className="text-[10px] text-slate-400 bg-slate-900/50 px-2 py-1.5 rounded-lg leading-tight">
                    {a.recommended_action}
                  </div>
                  <div className="text-[9px] mt-1 text-slate-600 italic truncate">{a.triggered_rules[0]}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 p-4 border-t border-slate-800/60 space-y-2">
        <button
          onClick={handleSimulateSMS}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            smsSent
              ? 'bg-green-700 text-white'
              : 'text-white hover:opacity-90'
          }`}
          style={!smsSent ? { background: 'linear-gradient(135deg, #1E3A8A, #172e70)' } : {}}
          aria-label={smsSent ? 'SMS broadcast sent' : 'Simulate SMS broadcast to emergency contacts'}
        >
          {smsSent ? `✓ ${t('sms_sent')}` : t('sms_broadcast')}
        </button>
        <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-700">
          <BarChart2 size={8} />
          MapLibre · Turf.js · Open-Meteo · FastAPI
        </div>
      </div>
    </aside>
  );
};
