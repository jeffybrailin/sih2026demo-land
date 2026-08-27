import React, { useRef, useEffect, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore } from '../store/useStore';
import { MapControls } from './MapControls';
import { MapTooltip, TooltipData } from './MapTooltip';

// Nearest highways lookup per sector
const HIGHWAY_MAP: Record<string, string> = {
  'NE-01': 'NH-6 (Shillong-Silchar)',
  'NE-02': 'NH-6 (Shillong-Silchar)',
  'NE-03': 'NH-10 (Siliguri-Gangtok)',
  'NE-04': 'NH-10 (Siliguri-Gangtok)',
  'NE-05': 'NH-40 (Shillong-Jowai)',
  'NE-06': 'NH-27 (Guwahati-Shillong)',
  'NE-07': 'NH-51 (Tura-Dalu)',
  'NE-08': 'NH-27 (Trans-Arunachal)',
};

const HISTORICAL_EVENTS: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [91.873, 25.565] }, properties: { date: '2022-06-12', severity: 'Major', deaths: 14, name: 'Mawsynram Slope' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [91.920, 25.620] }, properties: { date: '2021-07-08', severity: 'Moderate', deaths: 3, name: 'Nongstoin Cut' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [88.480, 27.080] }, properties: { date: '2023-08-01', severity: 'Major', deaths: 9, name: 'Kalimpong Ridge' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [88.510, 27.190] }, properties: { date: '2020-06-20', severity: 'Minor', deaths: 0, name: 'Pedong Hill' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [91.860, 25.540] }, properties: { date: '2019-09-05', severity: 'Major', deaths: 7, name: 'Cherrapunji Escarpment' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [92.140, 25.440] }, properties: { date: '2023-07-15', severity: 'Moderate', deaths: 2, name: 'Jowai Bypass' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [88.490, 27.100] }, properties: { date: '2022-09-10', severity: 'Major', deaths: 11, name: 'Darjeeling Tea Garden' } },
  ],
};

// Stadia Alidade Smooth Dark — vector, free for dev, English labels
const BASEMAP_STYLE = 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json';

export const MapComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const { riskGeoJSON, setUserLocation } = useStore();
  const [is3D, setIs3D] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const initMap = useCallback(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: BASEMAP_STYLE,
      center: [91.0, 26.0],
      zoom: 7.5,
      pitch: 60,
      bearing: -10,
      maxPitch: 70,
    });

    const m = map.current;
    // Scale only (no nav control — we use custom MapControls)
    m.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

    m.on('load', () => {
      // ── Force English labels on all symbol layers ─────────────────
      const allLayers = m.getStyle().layers ?? [];
      allLayers.forEach(layer => {
        if (layer.type === 'symbol') {
          try {
            m.setLayoutProperty(layer.id, 'text-field', [
              'coalesce', ['get', 'name:en'], ['get', 'name'],
            ]);
          } catch (_) {}
          // High-visibility halo on every label
          try {
            m.setPaintProperty(layer.id, 'text-halo-color', '#000000');
            m.setPaintProperty(layer.id, 'text-halo-width', 2);
            m.setPaintProperty(layer.id, 'text-halo-blur', 0.5);
          } catch (_) {}
        }
      });

      // ── 3D Terrain (AWS Terrarium) ────────────────────────────────
      m.addSource('terrain-dem', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 15,
        encoding: 'terrarium',
      });
      m.setTerrain({ source: 'terrain-dem', exaggeration: 1.4 });

      // ── Hillshade layer for depth perception ─────────────────────
      m.addLayer({
        id: 'hillshade',
        type: 'hillshade',
        source: 'terrain-dem',
        paint: {
          'hillshade-exaggeration': 0.5,
          'hillshade-highlight-color': '#ffffff',
          'hillshade-shadow-color': '#000000',
          'hillshade-illumination-anchor': 'viewport',
        },
      });

      // ── Historical events ─────────────────────────────────────────
      m.addSource('hist', { type: 'geojson', data: HISTORICAL_EVENTS });
      m.addLayer({
        id: 'hist-glow', type: 'circle', source: 'hist',
        paint: { 'circle-radius': 18, 'circle-color': '#f59e0b', 'circle-opacity': 0.14, 'circle-blur': 1.2 },
      });
      m.addLayer({
        id: 'hist-dot', type: 'circle', source: 'hist',
        paint: {
          'circle-radius': 6,
          'circle-color': '#f59e0b',
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.95,
        },
      });

      // ── Risk zone polygons ────────────────────────────────────────
      m.addSource('risk', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      m.addLayer({
        id: 'risk-fill', type: 'fill', source: 'risk',
        paint: {
          'fill-color': ['match', ['get', 'severity'],
            'RED', '#DC2626', 'ORANGE', '#EA580C', 'YELLOW', '#D97706', 'GREEN', '#16A34A', '#16A34A'],
          'fill-opacity': 0.55,
          'fill-antialias': true,
        },
      });
      m.addLayer({
        id: 'risk-outline', type: 'line', source: 'risk',
        paint: {
          'line-color': ['match', ['get', 'severity'],
            'RED', '#DC2626', 'ORANGE', '#EA580C', 'YELLOW', '#D97706', 'GREEN', '#16A34A', '#ffffff'],
          'line-width': 2,
          'line-opacity': 0.95,
        },
      });
      m.addLayer({
        id: 'risk-label', type: 'symbol', source: 'risk',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-anchor': 'center',
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 2,
          'text-halo-blur': 0.5,
        },
      });

      // ── Click: Historical popup ───────────────────────────────────
      m.on('click', 'hist-dot', (e) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties as any;
        new maplibregl.Popup({ offset: 14, className: 'lews-popup' })
          .setLngLat((e.features[0].geometry as GeoJSON.Point).coordinates as [number, number])
          .setHTML(`
            <div style="font-family:'Inter',sans-serif">
              <div style="color:#fbbf24;font-weight:700;font-size:13px;margin-bottom:8px;display:flex;align-items:center;gap:6px">
                <span>📍</span> Historical Landslide Event
              </div>
              <div style="display:grid;gap:4px">
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:#94a3b8">Location</span>
                  <strong style="color:#e2e8f0">${p.name ?? 'Unknown'}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:#94a3b8">Date</span>
                  <strong style="color:#e2e8f0">${p.date}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:#94a3b8">Severity</span>
                  <strong style="color:#fbbf24">${p.severity}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:#94a3b8">Casualties</span>
                  <strong style="color:#f87171">${p.deaths} fatalities</strong>
                </div>
              </div>
            </div>`)
          .addTo(m);
      });

      // ── Click: Risk zone popup ────────────────────────────────────
      m.on('click', 'risk-fill', (e) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties as any;
        const colorMap: Record<string, string> = {
          RED: '#DC2626', ORANGE: '#EA580C', YELLOW: '#D97706', GREEN: '#16A34A',
        };
        const sc = colorMap[p.severity] ?? '#16A34A';
        const labelMap: Record<string, string> = {
          RED: 'CRITICAL WARNING', ORANGE: 'HIGH RISK', YELLOW: 'WATCH', GREEN: 'SAFE',
        };
        const highway = HIGHWAY_MAP[p.sector_id] ?? 'NH data pending';
        new maplibregl.Popup({ offset: 14, maxWidth: '320px' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:'Inter',sans-serif">
              <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:10px;gap:8px">
                <div style="font-weight:700;font-size:14px;color:#f1f5f9;line-height:1.2">${p.name}</div>
                <div style="background:${sc}22;border:1px solid ${sc}55;border-radius:6px;padding:3px 8px;font-size:9px;font-weight:700;color:${sc};white-space:nowrap">
                  ${labelMap[p.severity] ?? 'UNKNOWN'}
                </div>
              </div>
              <div style="height:1px;background:linear-gradient(90deg,${sc}80,transparent);margin-bottom:10px"></div>
              <div style="display:grid;gap:5px;margin-bottom:10px">
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:#94a3b8;display:flex;align-items:center;gap:4px">🌧 Live Rainfall</span>
                  <strong style="color:#93c5fd;font-family:'JetBrains Mono',monospace">${Number(p.current_precipitation_mm ?? 0).toFixed(1)} mm/hr</strong>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:#94a3b8">24h Rainfall</span>
                  <strong style="color:#93c5fd;font-family:'JetBrains Mono',monospace">${Number(p.rainfall_24h ?? 0).toFixed(1)} mm</strong>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:#94a3b8;display:flex;align-items:center;gap:4px">💧 Soil Moisture</span>
                  <strong style="color:#86efac;font-family:'JetBrains Mono',monospace">${(Number(p.soil_moisture ?? 0) * 100).toFixed(1)}%</strong>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:#94a3b8">Factor of Safety</span>
                  <strong style="color:${p.fos < 1.0 ? '#f87171' : '#4ade80'};font-family:'JetBrains Mono',monospace">${Number(p.fos ?? 0).toFixed(2)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:#94a3b8">Risk Score</span>
                  <strong style="color:#e2e8f0;font-family:'JetBrains Mono',monospace">${Number(p.risk_score ?? 0).toFixed(3)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:#94a3b8">🛣 Nearest Highway</span>
                  <strong style="color:#fbbf24;font-size:10px">${highway}</strong>
                </div>
              </div>
              <div style="background:${sc}18;border:1px solid ${sc}40;border-radius:8px;padding:8px;font-size:11px">
                <div style="color:${sc};font-weight:700;margin-bottom:3px">Recommended Action</div>
                <div style="color:#cbd5e1;line-height:1.4">${p.recommended_action}</div>
              </div>
              ${p.triggered_rules ? `<div style="color:#475569;font-size:9px;font-style:italic;margin-top:8px;padding:4px 6px;background:rgba(255,255,255,0.03);border-radius:4px">${p.triggered_rules}</div>` : ''}
            </div>`)
          .addTo(m);
        m.flyTo({ center: e.lngLat, zoom: 13, pitch: 60, duration: 1000 });
      });

      // ── Mousemove: tooltip ────────────────────────────────────────
      m.on('mousemove', 'risk-fill', (e) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties as any;
        setTooltip({
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY,
          name: p.name,
          precipitation: Number(p.current_precipitation_mm ?? 0),
          soilMoisture: Number(p.soil_moisture ?? 0),
          severity: p.severity,
          highway: HIGHWAY_MAP[p.sector_id] ?? 'NH data pending',
        });
      });
      m.on('mouseleave', 'risk-fill', () => setTooltip(null));

      // ── Click: place monitoring pin ───────────────────────────────
      m.on('click', (e) => {
        const hits = m.queryRenderedFeatures(e.point, { layers: ['risk-fill', 'hist-dot'] });
        if (hits.length > 0) return;
        if (markerRef.current) markerRef.current.remove();
        const el = document.createElement('div');
        el.style.cssText = `
          width: 18px; height: 18px; border-radius: 50%;
          background: #3b82f6; border: 3px solid #fff;
          box-shadow: 0 0 0 5px rgba(59,130,246,0.35), 0 4px 12px rgba(0,0,0,0.4);
        `;
        markerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .addTo(m);
        setUserLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });

      m.on('mouseenter', 'risk-fill', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'risk-fill', () => { m.getCanvas().style.cursor = ''; });
      m.on('mouseenter', 'hist-dot', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'hist-dot', () => { m.getCanvas().style.cursor = ''; });
    });
  }, [setUserLocation]);

  useEffect(() => { initMap(); }, [initMap]);

  useEffect(() => {
    if (!map.current || !riskGeoJSON) return;
    const update = () => {
      const src = map.current?.getSource('risk') as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(riskGeoJSON as any);
    };
    if (map.current.isStyleLoaded()) update();
    else map.current.once('idle', update);
  }, [riskGeoJSON]);

  const handle3DToggle = useCallback(() => {
    setIs3D(prev => !prev);
  }, []);

  return (
    <>
      <div
        ref={mapContainer}
        className="w-full h-full"
        role="application"
        aria-label="Interactive 3D terrain map — NE India landslide risk zones"
        tabIndex={0}
      />
      <MapControls mapRef={map} is3D={is3D} onToggle3D={handle3DToggle} />
      <MapTooltip data={tooltip} />
    </>
  );
};
