import React, { useCallback } from 'react';
import { Plus, Minus, RotateCcw, Layers } from 'lucide-react';
import maplibregl from 'maplibre-gl';

interface Props {
  mapRef: React.MutableRefObject<maplibregl.Map | null>;
  is3D: boolean;
  onToggle3D: () => void;
}

export const MapControls: React.FC<Props> = ({ mapRef, is3D, onToggle3D }) => {
  const zoomIn = useCallback(() => {
    mapRef.current?.zoomIn({ duration: 300 });
  }, [mapRef]);

  const zoomOut = useCallback(() => {
    mapRef.current?.zoomOut({ duration: 300 });
  }, [mapRef]);

  const resetNorth = useCallback(() => {
    mapRef.current?.easeTo({ bearing: 0, pitch: is3D ? 60 : 0, duration: 600 });
  }, [mapRef, is3D]);

  const toggle3D = useCallback(() => {
    const m = mapRef.current;
    if (!m) return;
    const targetPitch = is3D ? 0 : 60;
    m.easeTo({ pitch: targetPitch, duration: 700 });
    onToggle3D();
  }, [mapRef, is3D, onToggle3D]);

  const bearing = mapRef.current?.getBearing() ?? 0;

  const btnClass = `
    glass-card w-10 h-10 flex items-center justify-center rounded-xl
    hover:border-blue-600/40 hover:bg-blue-900/20 transition-all
    text-slate-300 hover:text-white
  `.trim();

  return (
    <div
      className="absolute right-4 bottom-24 z-20 flex flex-col gap-2"
      role="group"
      aria-label="Map navigation controls"
    >
      {/* 3D Toggle */}
      <button
        onClick={toggle3D}
        className={`${btnClass} flex-col gap-0 !h-auto py-2 px-1`}
        style={{ minHeight: '44px' }}
        aria-label={is3D ? 'Switch to 2D top-down view' : 'Switch to 3D isometric view'}
        aria-pressed={is3D}
      >
        <Layers size={13} className={is3D ? 'text-blue-400' : 'text-slate-400'} />
        <span className="text-[9px] font-bold mt-0.5 leading-none">
          {is3D ? '3D' : '2D'}
        </span>
      </button>

      {/* Compass / North reset */}
      <button
        onClick={resetNorth}
        className={btnClass}
        style={{ minHeight: '44px' }}
        aria-label="Reset compass to North"
        title="Reset to North"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <circle cx="9" cy="9" r="8" stroke="rgba(100,116,139,0.5)" strokeWidth="1" fill="none" />
          {/* North (red) */}
          <polygon
            points="9,2 10.5,9 9,7.5 7.5,9"
            fill="#f87171"
            style={{ transformOrigin: '9px 9px', transform: `rotate(${bearing}deg)` }}
          />
          {/* South (grey) */}
          <polygon
            points="9,16 10.5,9 9,10.5 7.5,9"
            fill="#64748b"
            style={{ transformOrigin: '9px 9px', transform: `rotate(${bearing}deg)` }}
          />
        </svg>
      </button>

      {/* Zoom in */}
      <button
        onClick={zoomIn}
        className={btnClass}
        style={{ minHeight: '44px' }}
        aria-label="Zoom in"
      >
        <Plus size={16} />
      </button>

      {/* Zoom out */}
      <button
        onClick={zoomOut}
        className={btnClass}
        style={{ minHeight: '44px' }}
        aria-label="Zoom out"
      >
        <Minus size={16} />
      </button>
    </div>
  );
};
