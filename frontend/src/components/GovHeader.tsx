import React, { useState, useEffect } from 'react';
import { useClock } from '../context/ClockContext';
import { Wifi, Maximize2, Minimize2, Globe } from 'lucide-react';
import { useStore } from '../store/useStore';
import i18n from '../i18n';

export const GovHeader: React.FC = () => {
  const { timeString, dateString } = useClock();
  const { language, setLanguage, weatherStatus } = useStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleLangToggle = () => {
    const next = language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(next);
    setLanguage(next);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center h-14 px-3 md:px-5 border-b border-navy-700"
      style={{ background: 'var(--color-navy-900)', borderBottomColor: '#1E3A8A' }}
      role="banner"
      aria-label="Government of India — NDMA Landslide Early Warning System · NE India (44 Sectors)"
    >


      {/* ── Centre: System status badges ── */}
      <div className="flex-1 flex items-center justify-center gap-2 px-2 overflow-hidden">
        {/* Live indicator */}
        <div className="hidden md:flex items-center gap-1.5 glass-card rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">Live</span>
        </div>
        {/* API status */}
        <div className={`hidden lg:flex items-center gap-1.5 glass-card rounded-full px-3 py-1 ${
          weatherStatus === 'error' ? 'border-red-800/50' : ''
        }`}>
          <Wifi size={10} className={
            weatherStatus === 'fetching' ? 'text-blue-400 animate-pulse' :
            weatherStatus === 'error' ? 'text-red-400' : 'text-green-400'
          } />
          <span className="text-[10px] text-slate-400">
            {weatherStatus === 'fetching' ? 'Syncing…' :
             weatherStatus === 'error' ? 'API Error' :
             'Open-Meteo Live'}
          </span>
        </div>
      </div>

      {/* ── Right: Clock + Controls ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Live Clock */}
        <div className="glass-card rounded-lg px-3 py-1.5 text-right hidden sm:block">
          <div className="font-mono text-sm font-bold text-white tracking-widest leading-none">
            {timeString} <span className="text-[10px] text-blue-400 font-semibold">IST</span>
          </div>
          <div className="text-[9px] text-slate-500 tracking-wide mt-0.5">{dateString}</div>
        </div>

        {/* Language toggle */}
        <button
          onClick={handleLangToggle}
          className="glass-card rounded-lg p-2 hover:border-blue-600/40 transition-colors flex items-center gap-1.5"
          aria-label="Toggle language between English and Hindi"
        >
          <Globe size={13} className="text-blue-400" />
          <span className="text-[10px] font-semibold text-slate-300 hidden sm:inline">
            {language === 'en' ? 'हिं' : 'EN'}
          </span>
        </button>

        {/* Fullscreen */}
        <button
          onClick={handleFullscreen}
          className="glass-card rounded-lg p-2 hover:border-blue-600/40 transition-colors"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen
            ? <Minimize2 size={13} className="text-slate-400" />
            : <Maximize2 size={13} className="text-slate-400" />
          }
        </button>
      </div>
    </header>
  );
};
