import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useStore } from '../store/useStore';

// Note: Ensure you set a real token here or via environment variables
mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN'; // Replace with your actual token

export const MapComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { riskZones } = useStore();

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [91.893, 25.578], // Shillong center
      zoom: 12,
      pitch: 55, // For 3D terrain
      bearing: -20,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Add 3D Terrain
      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });
      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      // Add Risk Zones Source
      map.current.addSource('risk-zones', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // Add Risk Zones Layer (Polygons)
      map.current.addLayer({
        id: 'risk-zones-fill',
        type: 'fill',
        source: 'risk-zones',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.6
        }
      });

      // Add Outline
      map.current.addLayer({
        id: 'risk-zones-outline',
        type: 'line',
        source: 'risk-zones',
        paint: {
          'line-color': '#ffffff',
          'line-width': 1,
          'line-opacity': 0.8
        }
      });
      
      // Add Popup interaction
      map.current.on('click', 'risk-zones-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties;
        
        if (!props || !map.current) return;

        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-2 text-gray-800">
              <h3 class="font-bold text-lg">${props.name}</h3>
              <p>Severity: <strong>${props.severity}</strong></p>
              <p>Hazard Score: ${props.hazard_score.toFixed(2)}</p>
              <p>Action: ${props.recommended_action}</p>
            </div>
          `)
          .addTo(map.current);
          
        // Fly to
        map.current.flyTo({
          center: e.lngLat,
          zoom: 14,
          essential: true
        });
      });

      map.current.on('mouseenter', 'risk-zones-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'risk-zones-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

  }, []);

  // Update data source when riskZones changes
  useEffect(() => {
    if (!map.current || !riskZones) return;
    
    // Ensure map is loaded before trying to update source
    const updateSource = () => {
        const source = map.current?.getSource('risk-zones') as mapboxgl.GeoJSONSource;
        if (source) {
            source.setData(riskZones);
        }
    }
    
    if (map.current.isStyleLoaded()) {
        updateSource();
    } else {
        map.current.once('idle', updateSource);
    }
  }, [riskZones]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
};
