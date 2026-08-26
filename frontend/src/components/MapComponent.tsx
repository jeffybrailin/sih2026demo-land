import React, { useRef, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore, RiskFeature } from '../store/useStore';

// Historical landslide events in NE India (real coordinates)
const HISTORICAL_EVENTS: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [91.873, 25.565] }, properties: { date: '2022-06-12', severity: 'Major', deaths: 14 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [91.920, 25.620] }, properties: { date: '2021-07-08', severity: 'Moderate', deaths: 3 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [88.480, 27.080] }, properties: { date: '2023-08-01', severity: 'Major', deaths: 9 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [88.510, 27.190] }, properties: { date: '2020-06-20', severity: 'Minor', deaths: 0 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [91.860, 25.540] }, properties: { date: '2019-09-05', severity: 'Major', deaths: 7 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [92.140, 25.440] }, properties: { date: '2023-07-15', severity: 'Moderate', deaths: 2 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [88.490, 27.100] }, properties: { date: '2022-09-10', severity: 'Major', deaths: 11 } },
  ]
};

export const MapComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const { riskZones, setUserLocation, setSelectedSector } = useStore();

  const initMap = useCallback(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      // Free vector tile style from MapTiler (no key needed for the basemap alternative)
      // Using a public demotiles endpoint for full functionality
      style: {
        version: 8,
        name: 'Dark Terrain',
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
            maxzoom: 19
          },
          'terrarium-dem': {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 15,
            encoding: 'terrarium'
          }
        },
        layers: [
          {
            id: 'osm-background',
            type: 'raster',
            source: 'osm-tiles',
            paint: {
              'raster-brightness-min': 0,
              'raster-brightness-max': 0.35,
              'raster-saturation': -0.7,
              'raster-contrast': 0.2,
            }
          }
        ],
        sky: {
          'sky-color': '#0a0a1a',
          'sky-horizon-blend': 0.5,
          'horizon-color': '#111827',
          'horizon-fog-blend': 0.5,
          'fog-color': '#0f1117',
          'fog-ground-blend': 0.5,
        }
      },
      center: [91.893, 25.578], // Shillong
      zoom: 11,
      pitch: 60,
      bearing: -15,
    });

    const m = map.current;

    m.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    m.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    m.on('load', () => {
      // ── 3D Terrain ──────────────────────────────────────────
      m.addSource('terrain-dem', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 15,
        encoding: 'terrarium'
      });
      m.setTerrain({ source: 'terrain-dem', exaggeration: 2.0 });

      // ── Historical Landslide Points ──────────────────────────
      m.addSource('historical-events', {
        type: 'geojson',
        data: HISTORICAL_EVENTS
      });

      m.addLayer({
        id: 'historical-glow',
        type: 'circle',
        source: 'historical-events',
        paint: {
          'circle-radius': 14,
          'circle-color': '#f59e0b',
          'circle-opacity': 0.15,
          'circle-blur': 1,
        }
      });
      m.addLayer({
        id: 'historical-points',
        type: 'circle',
        source: 'historical-events',
        paint: {
          'circle-radius': 6,
          'circle-color': '#f59e0b',
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.95,
        }
      });
      m.addLayer({
        id: 'historical-labels',
        type: 'symbol',
        source: 'historical-events',
        layout: {
          'text-field': '⚠',
          'text-size': 12,
          'text-offset': [0, -1.5],
          'text-anchor': 'bottom',
        },
        paint: { 'text-color': '#f59e0b' }
      });

      // ── Risk Zone Polygons ────────────────────────────────────
      m.addSource('risk-zones', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Fill with data-driven color
      m.addLayer({
        id: 'risk-zones-fill',
        type: 'fill',
        source: 'risk-zones',
        paint: {
          'fill-color': [
            'match', ['get', 'severity'],
            'RED', '#ef4444',
            'ORANGE', '#f97316',
            'YELLOW', '#eab308',
            'GREEN', '#22c55e',
            '#22c55e'
          ],
          'fill-opacity': 0.55,
        }
      });

      // Outline
      m.addLayer({
        id: 'risk-zones-outline',
        type: 'line',
        source: 'risk-zones',
        paint: {
          'line-color': [
            'match', ['get', 'severity'],
            'RED', '#ef4444',
            'ORANGE', '#f97316',
            'YELLOW', '#eab308',
            'GREEN', '#22c55e',
            '#fff'
          ],
          'line-width': 2,
          'line-opacity': 0.9,
        }
      });

      // Label sectors
      m.addLayer({
        id: 'risk-zones-label',
        type: 'symbol',
        source: 'risk-zones',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-anchor': 'center',
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1.5,
        }
      });

      // ── Click: historical marker popup ────────────────────────
      m.on('click', 'historical-points', (e) => {
        if (!e.features || !e.features[0]) return;
        const p = e.features[0].properties;
        new maplibregl.Popup({ offset: 12 })
          .setLngLat((e.features[0].geometry as any).coordinates)
          .setHTML(`
            <div>
              <div style="color:#f59e0b;font-weight:700;font-size:14px;margin-bottom:6px">📍 Historical Event</div>
              <div style="color:#d1d5db;font-size:12px">Date: <strong style="color:#fff">${p.date}</strong></div>
              <div style="color:#d1d5db;font-size:12px">Severity: <strong style="color:#fff">${p.severity}</strong></div>
              <div style="color:#d1d5db;font-size:12px">Casualties: <strong style="color:${p.deaths > 0 ? '#f87171' : '#4ade80'}">${p.deaths}</strong></div>
            </div>`)
          .addTo(m);
      });

      // ── Click: risk polygon popup ──────────────────────────────
      m.on('click', 'risk-zones-fill', (e) => {
        if (!e.features || !e.features[0]) return;
        const f = e.features[0];
        const p = f.properties;

        const severityColor = p.severity === 'RED' ? '#ef4444' : p.severity === 'ORANGE' ? '#f97316' : p.severity === 'YELLOW' ? '#eab308' : '#22c55e';

        new maplibregl.Popup({ offset: 12 })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div>
              <div style="color:${severityColor};font-weight:700;font-size:14px;margin-bottom:8px">🔺 ${p.name}</div>
              <div style="color:#d1d5db;font-size:12px;margin-bottom:4px">Current Rainfall: <strong style="color:#93c5fd">${p.rainfall_mm} mm</strong></div>
              <div style="color:#d1d5db;font-size:12px;margin-bottom:4px">Historical Incidents: <strong style="color:#fbbf24">${p.historical_incidents}</strong></div>
              <div style="color:#d1d5db;font-size:12px;margin-bottom:4px">Factor of Safety: <strong style="color:${p.fos < 1.0 ? '#f87171' : '#4ade80'}">${parseFloat(p.fos).toFixed(2)}</strong></div>
              <div style="color:#d1d5db;font-size:12px;margin-bottom:4px">Slope: <strong style="color:#fff">${p.slope_deg}°</strong></div>
              <div style="background:${severityColor}22;border:1px solid ${severityColor}44;border-radius:6px;padding:6px;margin-top:8px;font-size:11px;color:${severityColor};font-weight:600">
                Predicted Risk: ${p.severity}<br/>
                <span style="font-weight:400;color:#d1d5db">${p.recommended_action}</span>
              </div>
            </div>`)
          .addTo(m);

        m.flyTo({ center: e.lngLat, zoom: 14, pitch: 60, duration: 1200 });

        // Set selected sector in store
        setSelectedSector(e.features![0] as unknown as RiskFeature);
      });

      // ── Click on map to place a monitoring pin ─────────────────
      m.on('click', (e) => {
        const layers = m.queryRenderedFeatures(e.point, { layers: ['risk-zones-fill', 'historical-points'] });
        if (layers.length > 0) return; // handled above

        // Place a "monitored village" pin
        if (markerRef.current) markerRef.current.remove();
        const el = document.createElement('div');
        el.style.cssText = `
          width: 20px; height: 20px; border-radius: 50%;
          background: #3b82f6; border: 3px solid #fff;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.4);
          animation: pulse-red 1.4s infinite;
        `;
        markerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .addTo(m);

        setUserLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });

      // Cursor changes
      m.on('mouseenter', 'risk-zones-fill', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'risk-zones-fill', () => { m.getCanvas().style.cursor = ''; });
      m.on('mouseenter', 'historical-points', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'historical-points', () => { m.getCanvas().style.cursor = ''; });
    });
  }, [setUserLocation, setSelectedSector]);

  useEffect(() => { initMap(); }, [initMap]);

  // Update risk polygon data when store changes
  useEffect(() => {
    if (!map.current || !riskZones) return;
    const update = () => {
      const src = map.current?.getSource('risk-zones') as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(riskZones as any);
    };
    if (map.current.isStyleLoaded()) {
      update();
    } else {
      map.current.once('idle', update);
    }
  }, [riskZones]);

  return <div ref={mapContainer} className="w-full h-full" />;
};
