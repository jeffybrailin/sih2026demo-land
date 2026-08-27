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

  const pan = useCallback((dx: number, dy: number) => {
    mapRef.current?.panBy([dx, dy], { duration: 300 });
  }, [mapRef]);

  const bearing = mapRef.current?.getBearing() ?? 0;

  const btnClass = `
    glass-card w-9 h-9 flex items-center justify-center rounded-xl
    hover:border-blue-600/40 hover:bg-blue-900/20 transition-all
    text-slate-300 hover:text-white
  `.trim();

  const arrowBtnClass = `
    glass-card w-9 h-9 flex items-center justify-center rounded-lg
    hover:border-blue-600/40 hover:bg-blue-900/20 transition-all
    text-slate-300 hover:text-white active:scale-95
  `.trim();

  return (
    <div
      className="absolute right-1 bottom-2 z-20 flex flex-col gap-1.5"
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

      {/* ── D-Pad: directional pan ── */}
      <div className="flex flex-col items-center gap-0.5" aria-label="Pan controls">
        {/* Up */}
        <button
          onClick={() => pan(0, -150)}
          className={arrowBtnClass}
          aria-label="Pan up"
          title="Pan up"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M7 2l5 7H2l5-7z" />
          </svg>
        </button>

        {/* Left + Right row */}
        <div className="flex gap-0.5">
          <button
            onClick={() => pan(-150, 0)}
            className={arrowBtnClass}
            aria-label="Pan left"
            title="Pan left"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M2 7l7-5v10L2 7z" />
            </svg>
          </button>
          {/* Centre dot */}
          <div className="w-9 h-9 glass-card rounded-lg flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          </div>
          <button
            onClick={() => pan(150, 0)}
            className={arrowBtnClass}
            aria-label="Pan right"
            title="Pan right"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M12 7l-7 5V2l7 5z" />
            </svg>
          </button>
        </div>

        {/* Down */}
        <button
          onClick={() => pan(0, 150)}
          className={arrowBtnClass}
          aria-label="Pan down"
          title="Pan down"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M7 12L2 5h10l-5 7z" />
          </svg>
        </button>
      </div>

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
