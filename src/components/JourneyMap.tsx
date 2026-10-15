import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LatLng, SafeSpot, TripStatus } from '../types/safetrip';
import { Shield, Navigation, Crosshair } from 'lucide-react';

interface JourneyMapProps {
  currentPosition: LatLng;
  plannedPolyline: LatLng[];
  safeRoutePolyline?: LatLng[];
  startPoint: LatLng;
  destinationPoint: LatLng;
  safeSpots: SafeSpot[];
  tripStatus: TripStatus;
  routeDeviationMeters: number;
  showSafeRoute: boolean;
  onSelectSafeSpot?: (spot: SafeSpot) => void;
  vehicleType?: string;
  driverName?: string;
}

export const JourneyMap: React.FC<JourneyMapProps> = ({
  currentPosition,
  plannedPolyline,
  safeRoutePolyline,
  startPoint,
  destinationPoint,
  safeSpots,
  tripStatus,
  routeDeviationMeters,
  showSafeRoute,
  onSelectSafeSpot,
  vehicleType = 'cab',
  driverName
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const plannedPolylineRef = useRef<L.Polyline | null>(null);
  const safePolylineRef = useRef<L.Polyline | null>(null);
  const deviationLineRef = useRef<L.Polyline | null>(null);
  const safeSpotsLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentPosition.lat, currentPosition.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // Dark cartographic tiles (CartoDB DarkMatter or OSM with dark filter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Planned & Safe Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Planned Route
    if (plannedPolylineRef.current) {
      plannedPolylineRef.current.remove();
    }
    if (plannedPolyline && plannedPolyline.length > 0) {
      const latlngs = plannedPolyline.map((p) => [p.lat, p.lng] as [number, number]);
      plannedPolylineRef.current = L.polyline(latlngs, {
        color: '#10b981', // emerald
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
    }

    // Safe Route (Alternative high-safety corridor)
    if (safePolylineRef.current) {
      safePolylineRef.current.remove();
    }
    if (showSafeRoute && safeRoutePolyline && safeRoutePolyline.length > 0) {
      const safeLatLngs = safeRoutePolyline.map((p) => [p.lat, p.lng] as [number, number]);
      safePolylineRef.current = L.polyline(safeLatLngs, {
        color: '#3b82f6', // blue
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.9
      }).addTo(map);
    }
  }, [plannedPolyline, safeRoutePolyline, showSafeRoute]);

  // Update Start & Destination Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Start Pin Icon
    const startIcon = L.divIcon({
      className: 'start-marker',
      html: `
        <div style="background-color: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-weight: bold; font-size: 11px;">
          A
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const destIcon = L.divIcon({
      className: 'dest-marker',
      html: `
        <div style="background-color: #f43f5e; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-weight: bold; font-size: 11px;">
          B
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const startMarker = L.marker([startPoint.lat, startPoint.lng], { icon: startIcon }).addTo(map);
    const destMarker = L.marker([destinationPoint.lat, destinationPoint.lng], { icon: destIcon }).addTo(map);

    return () => {
      startMarker.remove();
      destMarker.remove();
    };
  }, [startPoint, destinationPoint]);

  // Update Vehicle Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const isAlertState = tripStatus === 'sos_active' || tripStatus === 'sos_staged' || tripStatus === 'warning';
    const markerColor = isAlertState ? '#ef4444' : '#0ea5e9';
    const pulseClass = isAlertState ? 'animate-urgent' : 'animate-radar';

    const vehicleIcon = L.divIcon({
      className: 'vehicle-marker-wrapper',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background-color: ${markerColor}; opacity: 0.25;" class="${pulseClass}"></div>
          <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background-color: ${markerColor}; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setLatLng([currentPosition.lat, currentPosition.lng]);
      vehicleMarkerRef.current.setIcon(vehicleIcon);
    } else {
      vehicleMarkerRef.current = L.marker([currentPosition.lat, currentPosition.lng], {
        icon: vehicleIcon,
        zIndexOffset: 1000
      }).addTo(map);
    }

    // Connect deviation dotted line if straying
    if (deviationLineRef.current) {
      deviationLineRef.current.remove();
      deviationLineRef.current = null;
    }

    if (routeDeviationMeters > 150 && plannedPolyline && plannedPolyline.length > 0) {
      // Find nearest planned point
      const nearest = plannedPolyline[0];
      deviationLineRef.current = L.polyline(
        [
          [currentPosition.lat, currentPosition.lng],
          [nearest.lat, nearest.lng]
        ],
        {
          color: '#f97316',
          weight: 2,
          dashArray: '4, 4',
          opacity: 0.8
        }
      ).addTo(map);
    }
  }, [currentPosition, tripStatus, routeDeviationMeters, plannedPolyline]);

  // Update Safe Spots
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (safeSpotsLayerRef.current) {
      safeSpotsLayerRef.current.clearLayers();
    } else {
      safeSpotsLayerRef.current = L.layerGroup().addTo(map);
    }

    safeSpots.forEach((spot) => {
      let iconBg = '#3b82f6';
      let iconSymbol = 'POL';
      if (spot.category === 'hospital') {
        iconBg = '#ef4444';
        iconSymbol = '+';
      } else if (spot.category === 'pharmacy') {
        iconBg = '#10b981';
        iconSymbol = 'Rx';
      } else if (spot.category === 'safe_haven' || spot.category === 'fuel_cctv') {
        iconBg = '#f59e0b';
        iconSymbol = 'CCTV';
      }

      const spotIcon = L.divIcon({
        className: 'spot-icon',
        html: `
          <div style="background-color: ${iconBg}; color: white; min-width: 26px; height: 26px; padding: 0 4px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 1.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
            ${iconSymbol}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([spot.lat, spot.lng], { icon: spotIcon });
      
      const popupHtml = `
        <div style="padding: 4px; font-family: sans-serif; min-width: 180px;">
          <div style="font-weight: 600; font-size: 13px; color: #f8fafc; margin-bottom: 2px;">${spot.name}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">${spot.address}</div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #38bdf8; font-weight: 500; border-top: 1px solid #334155; padding-top: 4px;">
            <span>${spot.distanceMeters}m · ${spot.walkingMinutes} min walk</span>
            <span>${spot.is24x7 ? '24/7 Active' : 'Open'}</span>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectSafeSpot) {
          onSelectSafeSpot(spot);
        }
      });

      safeSpotsLayerRef.current?.addLayer(marker);
    });
  }, [safeSpots, onSelectSafeSpot]);

  const recenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentPosition.lat, currentPosition.lng], 15, {
        animate: true
      });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[340px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Quick Map Controls Overlay */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
        <button
          onClick={recenter}
          className="p-2.5 rounded-lg bg-slate-900/90 text-slate-200 border border-slate-700 hover:bg-slate-800 shadow-md transition-colors"
          title="Center on my vehicle"
        >
          <Crosshair className="w-4 h-4 text-emerald-400" />
        </button>
      </div>

      {/* Floating Status Pill on Map */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs shadow-lg">
        <span
          className={`w-2 h-2 rounded-full ${
            tripStatus === 'sos_active' || tripStatus === 'sos_staged'
              ? 'bg-rose-500 animate-ping'
              : tripStatus === 'warning'
              ? 'bg-amber-400 animate-pulse'
              : 'bg-emerald-400'
          }`}
        />
        <span className="font-medium text-slate-200">
          {tripStatus === 'sos_active'
            ? 'SOS ACTIVE — GPS BEACON STREAMING'
            : tripStatus === 'warning'
            ? 'DEVIATION DETECTED'
            : 'CORRIDOR MONITORED'}
        </span>
        {routeDeviationMeters > 80 && (
          <span className="text-amber-400 font-mono">+{routeDeviationMeters}m off</span>
        )}
      </div>

      {/* Safe Corridor Legend */}
      {showSafeRoute && (
        <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded text-[11px] text-slate-300 border border-slate-800 flex items-center gap-2">
          <div className="w-3 h-0.5 border-t-2 border-dashed border-blue-400" />
          <span>Safe Route (CCTV & Lit Arteries)</span>
        </div>
      )}
    </div>
  );
};
