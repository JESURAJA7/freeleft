import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import { motion } from 'framer-motion';
import { MapPinIcon, TruckIcon } from '@heroicons/react/24/outline';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  pincode: string;
  state: string;
  district: string;
  place: string;
  coordinates: { latitude: number; longitude: number };
}

interface RouteMapPreviewProps {
  loadingLocation: Location;
  unloadingLocation: Location;
  className?: string;
}

// Custom marker icons
const createCustomIcon = (color: string, symbol: string) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="30" height="45" viewBox="0 0 30 45" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 15 15 30 15 30s15-15 15-30C30 6.7 23.3 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="15" r="8" fill="white"/>
      <text x="15" y="20" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="${color}">${symbol}</text>
    </svg>
  `)}`,
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [0, -45],
});

const loadingIcon = createCustomIcon('#10B981', 'L');
const unloadingIcon = createCustomIcon('#EF4444', 'U');

export const RouteMapPreview: React.FC<RouteMapPreviewProps> = ({
  loadingLocation,
  unloadingLocation,
  className = ''
}) => {
  const loadingCoords: [number, number] = [
    loadingLocation.coordinates.latitude,
    loadingLocation.coordinates.longitude
  ];
  const unloadingCoords: [number, number] = [
    unloadingLocation.coordinates.latitude,
    unloadingLocation.coordinates.longitude
  ];

  // Calculate center point and zoom level
  const centerLat = (loadingCoords[0] + unloadingCoords[0]) / 2;
  const centerLng = (loadingCoords[1] + unloadingCoords[1]) / 2;
  const center: [number, number] = [centerLat, centerLng];

  // Calculate distance for zoom level
  const latDiff = Math.abs(loadingCoords[0] - unloadingCoords[0]);
  const lngDiff = Math.abs(loadingCoords[1] - unloadingCoords[1]);
  const maxDiff = Math.max(latDiff, lngDiff);
  
  let zoom = 10;
  if (maxDiff > 10) zoom = 6;
  else if (maxDiff > 5) zoom = 7;
  else if (maxDiff > 2) zoom = 8;
  else if (maxDiff > 1) zoom = 9;

  // Route line positions
  const routePositions: [number, number][] = [loadingCoords, unloadingCoords];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}
    >
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <TruckIcon className="h-5 w-5 text-blue-600" />
          <h4 className="font-semibold text-slate-900">Route Preview</h4>
        </div>
      </div>
      
      <div className="h-64 relative">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          dragging={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Route line */}
          <Polyline
            positions={routePositions}
            color="#3B82F6"
            weight={3}
            opacity={0.8}
            dashArray="10, 10"
          />
          
          {/* Loading location marker */}
          <Marker position={loadingCoords} icon={loadingIcon}>
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-green-700 mb-1">Loading Point</div>
                <div className="text-sm text-slate-600">
                  {loadingLocation.place}, {loadingLocation.district}
                  <br />
                  {loadingLocation.state} - {loadingLocation.pincode}
                </div>
              </div>
            </Popup>
          </Marker>
          
          {/* Unloading location marker */}
          <Marker position={unloadingCoords} icon={unloadingIcon}>
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-red-700 mb-1">Unloading Point</div>
                <div className="text-sm text-slate-600">
                  {unloadingLocation.place}, {unloadingLocation.district}
                  <br />
                  {unloadingLocation.state} - {unloadingLocation.pincode}
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      
      {/* Location details */}
      <div className="p-4 bg-slate-50">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-slate-700">Loading</span>
            </div>
            <div className="text-slate-600 ml-5">
              {loadingLocation.place}, {loadingLocation.district}
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="font-medium text-slate-700">Unloading</span>
            </div>
            <div className="text-slate-600 ml-5">
              {unloadingLocation.place}, {unloadingLocation.district}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};