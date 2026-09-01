import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ZoomIn, ZoomOut, Compass, Navigation, Maximize2, Layers } from 'lucide-react';

interface InteractiveMapPreviewProps {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  onLocationChange: (lat: number, lng: number) => void;
  onRadiusChange?: (radius: number) => void;
}

export const InteractiveMapPreview: React.FC<InteractiveMapPreviewProps> = ({
  latitude,
  longitude,
  radiusMeters,
  onLocationChange,
  onRadiusChange,
}) => {
  const [zoom, setZoom] = useState<number>(17);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [mapMode, setMapMode] = useState<'street' | 'satellite'>('street');
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert lat/lng to tile coordinates
  const latLngToTile = (lat: number, lng: number, zoomLevel: number) => {
    const latRad = (lat * Math.PI) / 180;
    const n = Math.pow(2, zoomLevel);
    const xtile = ((lng + 180) / 360) * n;
    const ytile = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
    return { x: xtile, y: ytile };
  };

  // Convert tile coordinates back to lat/lng
  const tileToLatLng = (x: number, y: number, zoomLevel: number) => {
    const n = Math.pow(2, zoomLevel);
    const lng = (x / n) * 360 - 180;
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
    const lat = (latRad * 180) / Math.PI;
    return { lat, lng };
  };

  // Calculate pixel radius on screen corresponding to radiusMeters at current latitude and zoom
  const calculatePixelRadius = (radiusM: number, lat: number, zoomLevel: number) => {
    // Meters per pixel = 156543.03392 * Math.cos(latRad) / Math.pow(2, zoomLevel)
    const latRad = (lat * Math.PI) / 180;
    const metersPerPixel = (156543.03392 * Math.cos(latRad)) / Math.pow(2, zoomLevel);
    return Math.max(10, radiusM / metersPerPixel);
  };

  const pixelRadius = calculatePixelRadius(radiusMeters, latitude, zoom);

  // Handle map click to re-center location
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = clickX - centerX;
    const deltaY = clickY - centerY;

    // Convert pixel delta to lat/lng shift
    const centerTile = latLngToTile(latitude, longitude, zoom);
    const tileSize = 256; // OSM standard tile pixel size
    const newTileX = centerTile.x + deltaX / tileSize;
    const newTileY = centerTile.y + deltaY / tileSize;

    const newCoords = tileToLatLng(newTileX, newTileY, zoom);
    onLocationChange(
      parseFloat(newCoords.lat.toFixed(6)),
      parseFloat(newCoords.lng.toFixed(6))
    );
  };

  const centerTile = latLngToTile(latitude, longitude, zoom);
  const tileX = Math.floor(centerTile.x);
  const tileY = Math.floor(centerTile.y);
  const offsetX = (centerTile.x - tileX) * 256;
  const offsetY = (centerTile.y - tileY) * 256;

  // Generate 3x3 tile grid around center tile
  const tiles = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const tx = tileX + dx;
      const ty = tileY + dy;
      // OpenStreetMap standard tile URL or Esri Satellite tile URL
      const tileUrl = mapMode === 'satellite'
        ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`
        : `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;

      tiles.push({
        key: `${tx}-${ty}-${zoom}-${mapMode}`,
        url: tileUrl,
        left: (dx + 1) * 256 - offsetX + 128, // Adjusted offset for centering in 3x3 grid inside container
        top: (dy + 1) * 256 - offsetY + 128,
      });
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Visualisasi Peta Radius Pesantren</span>
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          Klik pada peta untuk menggeser titik pusat
        </span>
      </div>

      <div
        ref={containerRef}
        onClick={handleMapClick}
        className="relative w-full h-64 rounded-xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-slate-900 select-none shadow-inner cursor-crosshair group"
      >
        {/* Map Tile Layer */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          {tiles.map((tile) => (
            <img
              key={tile.key}
              src={tile.url}
              alt="Map Tile"
              className="absolute w-64 h-64 object-cover opacity-90 transition-opacity duration-200"
              style={{
                left: `calc(50% + ${tile.left - 256}px)`,
                top: `calc(50% + ${tile.top - 256}px)`,
              }}
              onError={(e) => {
                // Fallback style if tile fails to load
                (e.target as HTMLElement).style.backgroundColor = '#1e293b';
              }}
            />
          ))}
        </div>

        {/* Dark overlay in satellite or street for high contrast */}
        <div className="absolute inset-0 bg-slate-950/10 pointer-events-none" />

        {/* Radius Circle Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-full border-2 border-emerald-500/80 bg-emerald-500/20 backdrop-blur-[1px] transition-all duration-300 flex items-center justify-center animate-pulse"
            style={{
              width: `${pixelRadius * 2}px`,
              height: `${pixelRadius * 2}px`,
            }}
          >
            <div className="w-full h-full rounded-full border border-dashed border-emerald-400/50" />
          </div>
        </div>

        {/* Center Marker Pin */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="relative flex flex-col items-center -translate-y-1/2">
            <div className="bg-emerald-700 text-white p-2 rounded-full shadow-lg border-2 border-white ring-4 ring-emerald-500/30">
              <MapPin className="w-5 h-5 fill-white text-emerald-700" />
            </div>
            <div className="mt-1 bg-slate-900/90 text-white text-[10px] font-medium font-mono px-2 py-0.5 rounded-full border border-slate-700/80 shadow-md backdrop-blur-xs whitespace-nowrap">
              Pusat ({radiusMeters}m)
            </div>
          </div>
        </div>

        {/* Controls Overlay (Top Right) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.min(19, z + 1));
            }}
            className="w-7 h-7 bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            title="Perbesar Peta"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.max(14, z - 1));
            }}
            className="w-7 h-7 bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            title="Perkecil Peta"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMapMode((m) => (m === 'street' ? 'satellite' : 'street'));
            }}
            className="w-7 h-7 bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            title="Ganti Mode Peta (Peta / Satelit)"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Coordinate Display Overlay (Bottom Left) */}
        <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1 rounded-lg border border-slate-800/80 shadow-md flex items-center gap-2 z-20">
          <span>Lat: {latitude}</span>
          <span>•</span>
          <span>Lng: {longitude}</span>
          <span className="text-emerald-400 font-semibold">• R: {radiusMeters}m</span>
        </div>
      </div>
    </div>
  );
};
