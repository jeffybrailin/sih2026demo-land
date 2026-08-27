import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';
import { X, AlertOctagon } from 'lucide-react';

export const AlertBanner: React.FC = () => {
  const { isAlertActive, intersectedZone, dismissAlert } = useStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isAlertActive) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⚠️ Landslide CRITICAL Alert — NDMA', {
        body: `${t('critical_sms')} | Zone: ${intersectedZone}`,
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    if ('vibrate' in navigator) navigator.vibrate([400, 150, 400, 150, 600]);
  }, [isAlertActive, intersectedZone, t]);

  if (!isAlertActive) return null;

  return (
    <div
      className="slide-down fixed top-14 left-0 right-0 z-50"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div
        className="pulse-alert flex items-center justify-between px-4 py-3 shadow-2xl"
        style={{ background: '#DC2626', borderBottom: '2px solid #991b1b' }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Animated dot */}
          <div className="relative flex-shrink-0 w-5 h-5">
            <div className="w-5 h-5 rounded-full bg-white animate-ping absolute inset-0 opacity-60" />
            <div className="w-5 h-5 rounded-full bg-white relative flex items-center justify-center">
              <AlertOctagon size={11} className="text-red-600" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-white tracking-wide">{t('critical_banner')}</p>
            <p className="text-xs text-red-100 truncate mt-0.5">
              {t('critical_sms_hi')} —{' '}
              <strong className="text-white">Zone: {intersectedZone}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-red-200 uppercase tracking-wider">Turf.js Engine</div>
            <div className="text-xs font-bold text-white">INTERSECTION ACTIVE</div>
          </div>
          <button
            onClick={dismissAlert}
            className="p-2 rounded-lg hover:bg-red-700 transition-colors"
            aria-label="Dismiss critical alert"
            style={{ minWidth: '36px', minHeight: '36px' }}
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
