import React, { useRef, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore } from '../store/useStore';

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
  ],
};

export const MapComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const { riskGeoJSON, setUserLocation } = useStore();

  const initMap = useCallback(() => {
    if (map.current || !mapContainer.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: 'LEWS Dark',
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap',
            maxzoom: 19,
          },
        },
        layers: [{
          id: 'osm-bg',
          type: 'raster',
          source: 'osm',
          paint: {
            'raster-brightness-min': 0,
            'raster-brightness-max': 0.3,
            'raster-saturation': -0.8,
            'raster-contrast': 0.25,
          },
        }],
      },
      center: [91.0, 26.0],
      zoom: 7.5,
      pitch: 60,
      bearing: -10,
    });

    const m = map.current;
    m.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    m.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    m.on('load', () => {
      // 3D Terrain — AWS Terrarium (free)
      m.addSource('terrain-dem', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 15,
        encoding: 'terrarium',
      });
      m.setTerrain({ source: 'terrain-dem', exaggeration: 2.2 });

      // Historical events layer
      m.addSource('hist', { type: 'geojson', data: HISTORICAL_EVENTS });
      m.addLayer({ id: 'hist-glow', type: 'circle', source: 'hist',
        paint: { 'circle-radius': 16, 'circle-color': '#f59e0b', 'circle-opacity': 0.12, 'circle-blur': 1 }
      });
      m.addLayer({ id: 'hist-dot', type: 'circle', source: 'hist',
        paint: { 'circle-radius': 6, 'circle-color': '#f59e0b', 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5, 'circle-opacity': 0.95 }
      });

      // Risk zones — colors fully driven by live ML inference
      m.addSource('risk', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      m.addLayer({
        id: 'risk-fill',
        type: 'fill',
        source: 'risk',
        paint: {
          'fill-color': ['match', ['get', 'severity'],
            'RED', '#ef4444', 'ORANGE', '#f97316', 'YELLOW', '#eab308', 'GREEN', '#22c55e', '#22c55e'],
          'fill-opacity': 0.55,
        },
      });
      m.addLayer({
        id: 'risk-outline',
        type: 'line',
        source: 'risk',
        paint: {
          'line-color': ['match', ['get', 'severity'],
            'RED', '#ef4444', 'ORANGE', '#f97316', 'YELLOW', '#eab308', 'GREEN', '#22c55e', '#fff'],
          'line-width': 2, 'line-opacity': 0.9,
        },
      });
      m.addLayer({
        id: 'risk-label',
        type: 'symbol',
        source: 'risk',
        layout: { 'text-field': ['get', 'name'], 'text-size': 11 },
        paint: { 'text-color': '#fff', 'text-halo-color': '#000', 'text-halo-width': 1.5 },
      });

      // Click: historical popup
      m.on('click', 'hist-dot', (e) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties;
        new maplibregl.Popup({ offset: 12 })
          .setLngLat((e.features[0].geometry as GeoJSON.Point).coordinates as [number, number])
          .setHTML(`<div><div style="color:#f59e0b;font-weight:700;font-size:14px;margin-bottom:6px">📍 Historical Event</div>
            <div style="color:#d1d5db;font-size:12px">Date: <strong style="color:#fff">${p.date}</strong></div>
            <div style="color:#d1d5db;font-size:12px">Severity: <strong style="color:#fff">${p.severity}</strong></div>
            <div style="color:#d1d5db;font-size:12px">Casualties: <strong style="color:#f87171">${p.deaths}</strong></div></div>`)
          .addTo(m);
      });

      // Click: risk zone popup with live ML data
      m.on('click', 'risk-fill', (e) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties as any;
        const sc = p.severity === 'RED' ? '#ef4444' : p.severity === 'ORANGE' ? '#f97316' : p.severity === 'YELLOW' ? '#eab308' : '#22c55e';
        new maplibregl.Popup({ offset: 12, maxWidth: '300px' })
          .setLngLat(e.lngLat)
          .setHTML(`<div>
            <div style="color:${sc};font-weight:700;font-size:14px;margin-bottom:8px">🔺 ${p.name}</div>
            <div style="color:#d1d5db;font-size:12px;margin-bottom:3px">Current Rainfall: <strong style="color:#93c5fd">${Number(p.current_precipitation_mm ?? 0).toFixed(1)} mm/hr</strong></div>
            <div style="color:#d1d5db;font-size:12px;margin-bottom:3px">24h Rainfall: <strong style="color:#93c5fd">${Number(p.rainfall_24h ?? 0).toFixed(1)} mm</strong></div>
            <div style="color:#d1d5db;font-size:12px;margin-bottom:3px">Soil Moisture: <strong style="color:#86efac">${Number(p.soil_moisture ?? 0).toFixed(4)}</strong></div>
            <div style="color:#d1d5db;font-size:12px;margin-bottom:3px">Historical Incidents: <strong style="color:#fbbf24">${p.historical_incidents}</strong></div>
            <div style="color:#d1d5db;font-size:12px;margin-bottom:3px">FoS (Geotechnical): <strong style="color:${p.fos < 1.0 ? '#f87171' : '#4ade80'}">${Number(p.fos ?? 0).toFixed(2)}</strong></div>
            <div style="color:#d1d5db;font-size:12px;margin-bottom:3px">Risk Score: <strong style="color:#fff">${Number(p.risk_score ?? 0).toFixed(3)}</strong></div>
            <div style="color:#9ca3af;font-size:10px;font-style:italic;margin-top:6px;padding:4px;background:#ffffff10;border-radius:4px">${p.triggered_rules ?? ''}</div>
            <div style="background:${sc}22;border:1px solid ${sc}44;border-radius:6px;padding:6px;margin-top:8px;font-size:11px;color:${sc};font-weight:600">
              Predicted Risk: ${p.severity}<br/><span style="font-weight:400;color:#d1d5db">${p.recommended_action}</span>
            </div></div>`)
          .addTo(m);
        m.flyTo({ center: e.lngLat, zoom: 13, pitch: 60, duration: 1000 });
      });

      // Click empty area — place monitoring pin
      m.on('click', (e) => {
        const hits = m.queryRenderedFeatures(e.point, { layers: ['risk-fill', 'hist-dot'] });
        if (hits.length > 0) return;
        if (markerRef.current) markerRef.current.remove();
        const el = document.createElement('div');
        el.style.cssText = 'width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 5px rgba(59,130,246,0.35)';
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

  return <div ref={mapContainer} className="w-full h-full" />;
};
