import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle, X } from 'lucide-react';

export const AlertBanner: React.FC = () => {
  const { isAlertActive, alertMessage, dismissAlert } = useStore();

  // Trigger notification if supported
  useEffect(() => {
    if (!isAlertActive) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⚠️ Landslide Alert', {
        body: alertMessage,
        icon: '/vite.svg',
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    if ('vibrate' in navigator) navigator.vibrate([400, 100, 400, 100, 400]);
  }, [isAlertActive, alertMessage]);

  if (!isAlertActive) return null;

  return (
    <div className="slide-down fixed top-0 left-0 right-0 z-50">
      <div className="pulse-alert bg-red-600 border-b-2 border-red-400 text-white px-4 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3 flex-1">
          {/* Pulsing dot */}
          <div className="relative flex-shrink-0">
            <div className="w-4 h-4 rounded-full bg-white animate-ping absolute inset-0 opacity-75" />
            <div className="w-4 h-4 rounded-full bg-white relative" />
          </div>
          <div>
            <p className="font-bold text-sm tracking-wide">WARNING: High Landslide Probability Detected in Current Zone</p>
            <p className="text-xs text-red-200 mt-0.5">{alertMessage}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <div className="text-xs text-red-200 text-right hidden sm:block">
            <div>Turf.js Intersection</div>
            <div className="text-red-100 font-semibold">ACTIVE</div>
          </div>
          <button
            onClick={dismissAlert}
            className="p-1.5 hover:bg-red-700 rounded transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
