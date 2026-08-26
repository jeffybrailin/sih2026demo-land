import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { AlertTriangle, MapPin, Activity, Zap, RefreshCw, Globe, CloudRain, Droplets, Brain } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeAlerts, userLocation, isAlertActive,
    weatherStatus, lastWeatherFetch, weatherData,
    inferenceResults, fetchLiveWeather, setLanguage, language,
  } = useStore();
  const { t } = useTranslation();
  const [smsSent, setSmsSent] = useState(false);

  const handleLangToggle = () => {
    const next = language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(next);
    setLanguage(next);
  };

  const handleSimulateSMS = () => {
    setSmsSent(true);
    alert(
      `📱 SMS BROADCAST TRIGGERED\n\n` +
      `🇬🇧 ${t('critical_sms')}\n\n` +
      `🇮🇳 ${t('critical_sms_hi')}\n\n` +
      `[Via Twilio/Fast2SMS → Registered phones in affected geo-fence]`
    );
    setTimeout(() => setSmsSent(false), 4000);
  };

  const severityBg: Record<string, string> = {
    RED: 'bg-red-900/25 border-red-800 text-red-300',
    ORANGE: 'bg-orange-900/25 border-orange-800 text-orange-300',
    YELLOW: 'bg-yellow-900/25 border-yellow-800 text-yellow-300',
    GREEN: 'bg-green-900/25 border-green-800 text-green-300',
  };

  // Summary stats from live data
  const redCount = activeAlerts.filter(a => a.severity === 'RED').length;
  const orangeCount = activeAlerts.filter(a => a.severity === 'ORANGE').length;
  const avgRain = weatherData.length
    ? (weatherData.reduce((s, w) => s + w.hourly_precipitation_24h, 0) / weatherData.length).toFixed(1)
    : '–';
  const avgSM = weatherData.length
    ? (weatherData.reduce((s, w) => s + w.current_soil_moisture, 0) / weatherData.length).toFixed(4)
    : '–';

  return (
    <div className="w-80 bg-gray-950 text-white flex flex-col h-full border-r border-gray-800 z-10 relative select-none">

      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-br from-blue-950/60 to-gray-950">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-blue-400" />
            <h1 className="text-sm font-bold text-white">{t('system_title')}</h1>
          </div>
          <button onClick={handleLangToggle}
            className="flex items-center gap-1 text-[10px] bg-gray-800 hover:bg-gray-700 border border-gray-700 px-2 py-1 rounded transition-colors">
            <Globe size={10} className="text-blue-400" />
            {t('lang_switch')}
          </button>
        </div>
        <p className="text-[10px] text-gray-600">{t('system_subtitle')}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-green-400">{t('live_monitoring')}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Live Weather Stats */}
        <div className="p-3 border-b border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <CloudRain size={12} className="text-blue-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('live_weather')}</span>
            </div>
            <button onClick={fetchLiveWeather} disabled={weatherStatus === 'fetching'}
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors disabled:opacity-40">
              <RefreshCw size={9} className={weatherStatus === 'fetching' ? 'animate-spin' : ''} />
              {weatherStatus === 'fetching' ? t('fetching') : weatherStatus === 'error' ? t('error_fetch') : lastWeatherFetch}
            </button>
          </div>
          <div className="text-[9px] text-blue-500 mb-2">{t('open_meteo')}</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-900 rounded-lg p-2 border border-gray-800">
              <div className="text-[9px] text-gray-500 mb-0.5">{t('precipitation')} avg</div>
              <div className="text-sm font-bold text-blue-300">{avgRain}<span className="text-[9px] text-gray-500"> mm</span></div>
            </div>
            <div className="bg-gray-900 rounded-lg p-2 border border-gray-800">
              <div className="text-[9px] text-gray-500 mb-0.5">{t('soil_moisture')} avg</div>
              <div className="text-sm font-bold text-emerald-300">{avgSM}</div>
            </div>
          </div>
        </div>

        {/* ML Inference Status */}
        <div className="p-3 border-b border-gray-800">
          <div className="flex items-center gap-1.5 mb-2">
            <Brain size={12} className="text-purple-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('ml_engine')}</span>
            <span className="ml-auto text-[9px] bg-purple-900/40 text-purple-400 border border-purple-800 px-1.5 py-0.5 rounded">{t('rf_active')}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-red-950/30 border border-red-900 rounded p-1.5 text-center">
              <div className="text-base font-bold text-red-400">{redCount}</div>
              <div className="text-[9px] text-red-500">Critical</div>
            </div>
            <div className="bg-orange-950/30 border border-orange-900 rounded p-1.5 text-center">
              <div className="text-base font-bold text-orange-400">{orangeCount}</div>
              <div className="text-[9px] text-orange-500">Warning</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded p-1.5 text-center">
              <div className="text-base font-bold text-gray-300">{inferenceResults.length}</div>
              <div className="text-[9px] text-gray-500">Sectors</div>
            </div>
          </div>
        </div>

        {/* Turf Intersection Engine */}
        <div className={`mx-3 mt-3 rounded-lg p-3 border text-xs ${isAlertActive ? 'bg-red-900/30 border-red-700' : 'bg-gray-900 border-gray-800 text-gray-500'}`}>
          <div className="flex items-center gap-1.5 font-semibold">
            <Zap size={12} className={isAlertActive ? 'text-red-400' : 'text-gray-600'} />
            <span className={isAlertActive ? 'text-red-300' : ''}>Turf.js booleanPointInPolygon</span>
          </div>
          <div className="mt-1 text-[10px]">
            {userLocation
              ? `📍 ${userLocation.lat.toFixed(4)}°N, ${userLocation.lng.toFixed(4)}°E`
              : t('click_map')}
          </div>
          {isAlertActive && <div className="text-red-400 font-bold mt-1 text-[10px]">{t('intersection_active')}</div>}
        </div>

        {/* Active Alerts */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-orange-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('active_alerts')}</span>
            </div>
            {activeAlerts.length > 0 && (
              <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-bold">{activeAlerts.length}</span>
            )}
          </div>

          {activeAlerts.length === 0 ? (
            <div className="text-[11px] text-gray-600 text-center py-4 border border-gray-800 rounded-lg bg-gray-900/40">
              <div className="text-xl mb-1">🟢</div>
              {t('no_alerts')}
            </div>
          ) : (
            <div className="space-y-2">
              {activeAlerts.map((a, i) => (
                <div key={`${a.sector_id}-${i}`} className={`rounded-lg border p-2.5 ${severityBg[a.severity] ?? ''}`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-xs">{a.name}</div>
                      <div className="text-[10px] opacity-60 mt-0.5 flex gap-1 flex-wrap">
                        <span className="flex items-center gap-0.5"><MapPin size={8} />{a.sector_id}</span>
                        <span>FoS: {a.fos}</span>
                        <span>Rain: {a.rainfall_24h}mm</span>
                      </div>
                      <div className="text-[10px] mt-1.5 bg-black/25 px-2 py-1 rounded font-medium leading-tight">
                        {a.recommended_action}
                      </div>
                      <div className="text-[9px] mt-1 opacity-50 italic">{a.triggered_rules[0]}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 space-y-2">
        <button onClick={handleSimulateSMS}
          className={`w-full py-2 text-xs font-semibold rounded-lg transition-all ${smsSent ? 'bg-green-700 text-white' : 'bg-blue-700 hover:bg-blue-600 text-white'}`}>
          {smsSent ? `✓ ${t('sms_sent')}` : `📡 ${t('sms_broadcast')}`}
        </button>
        <div className="text-center text-[9px] text-gray-700">
          MapLibre · Turf.js · Open-Meteo · FastAPI · i18next
        </div>
      </div>
    </div>
  );
};
