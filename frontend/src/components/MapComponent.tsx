import React, { useRef, useEffect, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore } from '../store/useStore';
import { MapControls } from './MapControls';
import { MapTooltip, TooltipData } from './MapTooltip';

// ── National Highway lookup per sector ───────────────────────────────────────
const HIGHWAY_MAP: Record<string, string> = {
  // Assam
  'AS-01': 'NH-27 (Guwahati Ring Road)',
  'AS-02': 'NH-37 (Guwahati-Kamakhya)',
  'AS-03': 'NH-37 (Tezpur Corridor)',
  'AS-04': 'NH-27 (Haflong-Silchar)',
  'AS-05': 'NH-6  (Silchar-Jiribam)',
  'AS-06': 'NH-37 (Dibrugarh-Tinsukia)',
  'AS-07': 'NH-27 (Dima Hasao)',
  'AS-08': 'NH-6  (Barak Valley)',
  // Meghalaya
  'ML-01': 'NH-6  (Shillong Bypass)',
  'ML-02': 'NH-6  (Umiam Lake)',
  'ML-03': 'NH-6  (Shillong–Silchar)',
  'ML-04': 'NH-6  (Sonapur Tunnel)',
  'ML-05': 'NH-6  (Cherrapunji Spur)',
  'ML-06': 'NH-51 (Tura-Dalu)',
  'ML-07': 'NH-44 (Nongstoin-Shillong)',
  // Manipur
  'MN-01': 'NH-37 (Imphal Ring)',
  'MN-02': 'NH-150 (Churachandpur)',
  'MN-03': 'NH-102 (Senapati)',
  'MN-04': 'NH-37 (Tamenglong Spur)',
  'MN-05': 'NH-202 (Ukhrul)',
  // Mizoram
  'MZ-01': 'NH-54 (Aizawl)',
  'MZ-02': 'NH-54 (Lunglei)',
  'MZ-03': 'NH-54 (Champhai)',
  'MZ-04': 'NH-306 (Kolasib)',
  // Nagaland
  'NL-01': 'NH-29 (Kohima)',
  'NL-02': 'NH-29 (Dimapur)',
  'NL-03': 'NH-29 (Mokokchung)',
  'NL-04': 'NH-36 (Tuensang)',
  'NL-05': 'NH-29 (Wokha)',
  // Tripura
  'TR-01': 'NH-44 (Ambassa)',
  'TR-02': 'NH-44 (Dharmanagar)',
  'TR-03': 'NH-8  (Udaipur)',
  // Arunachal Pradesh
  'AR-01': 'NH-415 (Itanagar)',
  'AR-02': 'NH-13  (Tawang)',
  'AR-03': 'NH-13  (Bomdila)',
  'AR-04': 'NH-229 (Along)',
  'AR-05': 'NH-37  (Pasighat)',
  'AR-06': 'NH-415 (Ziro)',
  // Sikkim & WB Hills
  'SK-01': 'NH-10  (Teesta Valley)',
  'SK-02': 'NH-717 (Kalimpong)',
  'SK-03': 'NH-10  (Rangpo Border)',
  'SK-04': 'NH-10  (Singtam Bend)',
  'SK-05': 'NH-10  (Gangtok)',
  'SK-06': 'NH-10  (Mangan)',
};

// ── Historical landslide events (GeoJSON points, [lon, lat]) ─────────────────
const HISTORICAL_EVENTS: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    // Meghalaya
    { type: 'Feature', geometry: { type: 'Point', coordinates: [91.873, 25.565] }, properties: { date: '2022-06-12', severity: 'Major',        deaths: 14, name: 'Mawsynram Slope' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [91.720, 25.280] }, properties: { date: '2023-07-20', severity: 'Major',        deaths: 8,  name: 'Cherrapunji Cliff' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [91.920, 25.620] }, properties: { date: '2021-07-08', severity: 'Moderate',     deaths: 3,  name: 'Nongstoin Cut' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [91.860, 25.540] }, properties: { date: '2019-09-05', severity: 'Major',        deaths: 7,  name: 'Cherrapunji Escarpment' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [92.140, 25.440] }, properties: { date: '2023-07-15', severity: 'Moderate',     deaths: 2,  name: 'Jowai Bypass' } },
    // Sikkim / WB Hills
    { type: 'Feature', geometry: { type: 'Point', coordinates: [88.480, 27.080] }, properties: { date: '2023-08-01', severity: 'Major',        deaths: 9,  name: 'Kalimpong Ridge' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [88.533, 27.520] }, properties: { date: '2023-10-04', severity: 'Catastrophic', deaths: 31, name: 'Mangan GLOF Cascade' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [88.510, 27.190] }, properties: { date: '2020-06-20', severity: 'Minor',        deaths: 0,  name: 'Pedong Hill' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [88.490, 27.100] }, properties: { date: '2022-09-10', severity: 'Major',        deaths: 11, name: 'Darjeeling Tea Garden' } },
    // Manipur
    { type: 'Feature', geometry: { type: 'Point', coordinates: [93.982, 24.820] }, properties: { date: '2022-05-30', severity: 'Major',        deaths: 23, name: 'Noney Rail Collapse' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [93.683, 24.340] }, properties: { date: '2021-08-10', severity: 'Moderate',     deaths: 5,  name: 'Churachandpur Slope' } },
    // Arunachal Pradesh
    { type: 'Feature', geometry: { type: 'Point', coordinates: [91.860, 27.590] }, properties: { date: '2021-07-12', severity: 'Major',        deaths: 6,  name: 'Tawang Approach' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [92.420, 27.270] }, properties: { date: '2023-08-15', severity: 'Moderate',     deaths: 3,  name: 'Bomdila NH-13' } },
    // Mizoram
    { type: 'Feature', geometry: { type: 'Point', coordinates: [92.717, 23.730] }, properties: { date: '2024-06-30', severity: 'Catastrophic', deaths: 41, name: 'Aizawl Quarry Slide' } },
    // Assam
    { type: 'Feature', geometry: { type: 'Point', coordinates: [93.020, 25.170] }, properties: { date: '2022-07-15', severity: 'Major',        deaths: 8,  name: 'Haflong Hill Failure' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [92.780, 24.830] }, properties: { date: '2023-06-20', severity: 'Moderate',     deaths: 4,  name: 'Silchar Embankment' } },
  ],
};

/**
 * CartoDB Dark Matter GL — free, no API key.
 * Roads render as bright white/grey lines on a dark background,
 * giving excellent contrast in both 2-D and 3-D terrain mode.
 */
const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// Outer perimeter of the North East India monitoring region.
const NORTHEAST_PERIMETER: GeoJSON.Feature<GeoJSON.Polygon> = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [87.90, 26.60], [88.10, 28.10], [89.10, 28.25], [91.00, 28.20], [93.00, 28.50],
      [95.10, 29.45], [97.00, 29.50], [97.70, 28.00], [97.65, 26.10],
      [97.30, 24.60], [96.20, 23.00], [95.00, 22.00], [93.70, 21.65],
      [92.30, 21.70], [90.90, 22.20], [90.00, 23.20], [89.20, 24.80],
      [87.90, 26.60],
    ]],
  },
  properties: {},
};

export const MapComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const { riskGeoJSON, setUserLocation } = useStore();
  const [is3D, setIs3D] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const initMap = useCallback(() => {
    if (map.current || !mapContainer.current) return;

    // Center on North East India; zoom-out to see all 8 states
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: BASEMAP_STYLE,
      center: [93.0, 25.5],
      zoom: 6.2,
      pitch: 55,
      bearing: -8,
      maxPitch: 70,
      attributionControl: false,
    });

    const m = map.current;
    m.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

    m.on('load', () => {

      // ── 1. Boost road visibility ──────────────────────────────────────
      // CartoDB Dark Matter already has visible roads; we boost line-layers
      // whose IDs contain road-related keywords to make them even brighter.
      const allLayers = m.getStyle().layers ?? [];
      allLayers.forEach(layer => {
        if (layer.type === 'symbol') {
          // English labels with a dark halo so they're readable over terrain
          try { m.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', 'name:en'], ['get', 'name']]); } catch (_) {}
          try { m.setPaintProperty(layer.id, 'text-halo-color', '#000000'); } catch (_) {}
          try { m.setPaintProperty(layer.id, 'text-halo-width', 1.5); } catch (_) {}
        }
        if (layer.type === 'line') {
          const lid = layer.id.toLowerCase();
          const sourceLayer = String((layer as maplibregl.Layer)['source-layer'] ?? '').toLowerCase();
          const isRoad = lid.includes('road') || lid.includes('motorway') ||
                         lid.includes('highway') || lid.includes('trunk') ||
                         lid.includes('primary') || lid.includes('secondary') ||
                         lid.includes('street') || lid.includes('tunnel') ||
                         sourceLayer.includes('road') || sourceLayer.includes('transport');
          if (isRoad) {
            // Keep transport lines readable over both terrain and flat basemap.
            try { m.setPaintProperty(layer.id, 'line-opacity', 1.0); } catch (_) {}
            try { m.setPaintProperty(layer.id, 'line-color', '#d8dee8'); } catch (_) {}
            try {
              const w = m.getPaintProperty(layer.id, 'line-width');
              if (typeof w === 'number' && w > 0) {
                m.setPaintProperty(layer.id, 'line-width', Math.max(w * 1.6, 1.2));
              }
            } catch (_) {}
          }
        }
      });

      // ── 2. 3-D Terrain (AWS Terrarium DEM) ───────────────────────────
      m.addSource('terrain-dem', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 15,
        encoding: 'terrarium',
      });
      m.setTerrain({ source: 'terrain-dem', exaggeration: 1.3 });

      // ── 3. Hillshade for terrain depth ───────────────────────────────
      m.addLayer({
        id: 'hillshade',
        type: 'hillshade',
        source: 'terrain-dem',
        paint: {
          'hillshade-exaggeration': 0.45,
          'hillshade-highlight-color': '#ffffff',
          'hillshade-shadow-color': '#000000',
          'hillshade-illumination-anchor': 'viewport',
        },
      });

      // Persistent regional boundary, deliberately above terrain shading.
      m.addSource('northeast-perimeter', { type: 'geojson', data: NORTHEAST_PERIMETER });
      m.addLayer({
        id: 'northeast-perimeter-casing',
        type: 'line',
        source: 'northeast-perimeter',
        paint: {
          'line-color': '#160707',
          'line-width': 7,
          'line-opacity': 0.95,
        },
      });
      m.addLayer({
        id: 'northeast-perimeter',
        type: 'line',
        source: 'northeast-perimeter',
        paint: {
          'line-color': '#ef3340',
          'line-width': 3.5,
          'line-opacity': 1,
        },
      });

      // ── 4. Historical landslide event points ──────────────────────────
      m.addSource('hist', { type: 'geojson', data: HISTORICAL_EVENTS });
      m.addLayer({
        id: 'hist-glow', type: 'circle', source: 'hist',
        paint: { 'circle-radius': 20, 'circle-color': '#f59e0b', 'circle-opacity': 0.12, 'circle-blur': 1.2 },
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

      // ── 5. Live risk zone polygons (GeoJSON, updated every 15 min) ────
      m.addSource('risk', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      // Semi-transparent fill — opacity 0.38 so underlying roads stay visible
      m.addLayer({
        id: 'risk-fill', type: 'fill', source: 'risk',
        paint: {
          'fill-color': ['match', ['get', 'severity'],
            'RED', '#DC2626', 'ORANGE', '#EA580C', 'YELLOW', '#D97706', 'GREEN', '#16A34A', '#16A34A'],
          'fill-opacity': 0.38,
          'fill-antialias': true,
        },
      });
      // Bright outline so zone boundaries are always sharp
      m.addLayer({
        id: 'risk-outline', type: 'line', source: 'risk',
        paint: {
          'line-color': ['match', ['get', 'severity'],
            'RED', '#ef4444', 'ORANGE', '#f97316', 'YELLOW', '#eab308', 'GREEN', '#22c55e', '#ffffff'],
          'line-width': 2.2,
          'line-opacity': 1.0,
        },
      });
      m.addLayer({
        id: 'risk-label', type: 'symbol', source: 'risk',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 10,
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-anchor': 'center',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 2,
          'text-halo-blur': 0.5,
        },
      });

      // ── 6. Click: historical event popup ─────────────────────────────
      m.on('click', 'hist-dot', (e) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties as any;
        new maplibregl.Popup({ offset: 14, className: 'lews-popup' })
          .setLngLat((e.features[0].geometry as GeoJSON.Point).coordinates as [number, number])
          .setHTML(`
            <div style="font-family:'Inter',sans-serif">
              <div style="color:#fbbf24;font-weight:700;font-size:13px;margin-bottom:8px">
                ⚠️ Historical Landslide Event
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

      // ── 7. Click: risk zone popup ─────────────────────────────────────
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
                  <span style="color:#94a3b8">Live Rainfall</span>
                  <strong style="color:#93c5fd;font-family:'JetBrains Mono',monospace">${Number(p.current_precipitation_mm ?? 0).toFixed(1)} mm/hr</strong>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:#94a3b8">24h Rainfall</span>
                  <strong style="color:#93c5fd;font-family:'JetBrains Mono',monospace">${Number(p.rainfall_24h ?? 0).toFixed(1)} mm</strong>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:#94a3b8">Soil Moisture</span>
                  <strong style="color:#86efac;font-family:'JetBrains Mono',monospace">${(Number(p.soil_moisture ?? 0) * 100).toFixed(1)}%</strong>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:#94a3b8">Factor of Safety</span>
                  <strong style="color:${Number(p.fos) < 1.0 ? '#f87171' : '#4ade80'};font-family:'JetBrains Mono',monospace">${Number(p.fos ?? 0).toFixed(2)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:#94a3b8">Risk Score</span>
                  <strong style="color:#e2e8f0;font-family:'JetBrains Mono',monospace">${Number(p.risk_score ?? 0).toFixed(3)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:#94a3b8">Nearest Highway</span>
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
        m.flyTo({ center: e.lngLat, zoom: 12, pitch: 55, duration: 1000 });
      });

      // ── 8. Hover tooltip ──────────────────────────────────────────────
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

      // ── 9. Click empty area → place monitoring pin ────────────────────
      m.on('click', (e) => {
        const hits = m.queryRenderedFeatures(e.point, { layers: ['risk-fill', 'hist-dot'] });
        if (hits.length > 0) return;
        if (markerRef.current) markerRef.current.remove();
        const el = document.createElement('div');
        el.style.cssText = `
          width:18px;height:18px;border-radius:50%;
          background:#3b82f6;border:3px solid #fff;
          box-shadow:0 0 0 5px rgba(59,130,246,0.35),0 4px 12px rgba(0,0,0,0.4);
        `;
        markerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .addTo(m);
        setUserLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });

      // Cursor helpers
      m.on('mouseenter', 'risk-fill', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'risk-fill', () => { m.getCanvas().style.cursor = ''; });
      m.on('mouseenter', 'hist-dot',  () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'hist-dot',  () => { m.getCanvas().style.cursor = ''; });
    });
  }, [setUserLocation]);

  useEffect(() => { initMap(); }, [initMap]);

  // Hot-swap GeoJSON data whenever Zustand store updates
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
    const nextIs3D = !is3D;
    const m = map.current;
    if (m) {
      if (nextIs3D) {
        m.setTerrain({ source: 'terrain-dem', exaggeration: 1.3 });
      } else {
        m.setTerrain(null);
      }
    }
    setIs3D(nextIs3D);
  }, [is3D]);

  return (
    <>
      <div
        ref={mapContainer}
        className="w-full h-full"
        role="application"
        aria-label="Interactive 3D terrain map — NE India landslide risk zones (44 sectors)"
        tabIndex={0}
      />
      <MapControls mapRef={map} is3D={is3D} onToggle3D={handle3DToggle} />
      <MapTooltip data={tooltip} />
    </>
  );
};
