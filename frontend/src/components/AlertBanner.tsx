import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

export const AlertBanner: React.FC = () => {
  const { isAlertActive, intersectedZone, dismissAlert } = useStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isAlertActive) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⚠️ Landslide CRITICAL Alert', {
        body: `${t('critical_sms')} | ${t('critical_sms_hi')}`,
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    if ('vibrate' in navigator) navigator.vibrate([400, 150, 400, 150, 600]);
  }, [isAlertActive, t]);

  if (!isAlertActive) return null;

  return (
    <div className="slide-down fixed top-0 left-0 right-0 z-50">
      <div className="pulse-alert bg-red-600 border-b-2 border-red-400 text-white px-4 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0 w-4 h-4">
            <div className="w-4 h-4 rounded-full bg-white animate-ping absolute inset-0 opacity-75" />
            <div className="w-4 h-4 rounded-full bg-white relative" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm tracking-wide">{t('critical_banner')}</p>
            <p className="text-xs text-red-100 truncate">
              {t('critical_sms_hi')} — Zone: <strong>{intersectedZone}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-3 flex-shrink-0">
          <div className="text-[10px] text-red-200 text-right hidden sm:block">
            <div>Turf.js Engine</div>
            <div className="text-white font-bold">ACTIVE</div>
          </div>
          <button onClick={dismissAlert} className="p-1.5 hover:bg-red-700 rounded transition-colors">
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
