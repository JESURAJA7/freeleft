import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPinIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
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

interface MapLocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: Location) => void;
  title: string;
  initialLocation?: Location;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    postcode?: string;
    state?: string;
    state_district?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
  };
}

// Enhanced custom marker icons with modern styling
const createAdvancedIcon = (color: string, isLoading = false) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="46" viewBox="0 0 32 46" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.25)"/>
        </filter>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${isLoading ? '#10B981' : '#EF4444'};stop-opacity:0.8" />
        </linearGradient>
      </defs>
      <path d="M16 0C7.163 0 0 7.163 0 16c0 16 16 30 16 30s16-14 16-30C32 7.163 24.837 0 16 0z" 
            fill="url(#gradient)" filter="url(#shadow)" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="8" fill="white" stroke="${color}" stroke-width="2"/>
      <circle cx="16" cy="16" r="4" fill="${color}"/>
    </svg>
  `)}`,
  iconSize: [32, 46],
  iconAnchor: [16, 46],
  popupAnchor: [0, -46],
});

const loadingIcon = createAdvancedIcon('#3B82F6', true);
const unloadingIcon = createAdvancedIcon('#EF4444', false);

// Map click handler component
const MapClickHandler: React.FC<{
  onLocationClick: (lat: number, lng: number) => void;
}> = ({ onLocationClick }) => {
  useMapEvents({
    click: (e) => {
      onLocationClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Modern Button Component
const ModernButton: React.FC<{
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ onClick, variant = 'primary', children, icon, className = '' }) => {
  const baseClasses = "px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105";

  const variantClasses = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700",
    secondary: "bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800",
    outline: "bg-white/10 backdrop-blur-sm border-2 border-white/20 text-slate-700 hover:bg-white/20 hover:border-white/30"
  };

  return (
    <motion.button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
};

export const MapLocationSelector: React.FC<MapLocationSelectorProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  title,
  initialLocation
}) => {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(
    initialLocation?.coordinates.latitude && initialLocation?.coordinates.longitude
      ? [initialLocation.coordinates.latitude, initialLocation.coordinates.longitude]
      : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locationDetails, setLocationDetails] = useState<Location | null>(
    initialLocation || null
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialLocation?.coordinates.latitude && initialLocation?.coordinates.longitude) {
      setMapCenter([initialLocation.coordinates.latitude, initialLocation.coordinates.longitude]);
    }
  }, [initialLocation]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 500);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5&addressdetails=1`
      );
      const results: SearchResult[] = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const result = await response.json();

      if (result.address) {
        const location: Location = {
          pincode: result.address.postcode || '',
          state: result.address.state || '',
          district: result.address.state_district || result.address.county || '',
          place: result.address.city || result.address.town || result.address.village || result.address.suburb || '',
          coordinates: { latitude: lat, longitude: lng }
        };
        setLocationDetails(location);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedPosition([lat, lng]);
    setMapCenter([lat, lng]);
    reverseGeocode(lat, lng);
  };

  const handleSearchResultClick = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setSelectedPosition([lat, lng]);
    setMapCenter([lat, lng]);

    const location: Location = {
      pincode: result.address.postcode || '',
      state: result.address.state || '',
      district: result.address.state_district || '',
      place: result.address.city || result.address.town || result.address.village || result.address.suburb || '',
      coordinates: { latitude: lat, longitude: lng }
    };
    setLocationDetails(location);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleConfirmLocation = () => {
    if (locationDetails) {
      onLocationSelect(locationDetails);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedPosition(null);
    setLocationDetails(null);
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col border border-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Enhanced Header with Gradient */}
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 p-6 rounded-t-3xl">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <MapPinIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{title}</h3>
                  <p className="text-white/80 text-sm mt-1">Select your preferred location</p>
                </div>
              </div>
              <motion.button
                onClick={handleClose}
                className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-300 backdrop-blur-sm"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </motion.button>
            </div>
            {/* Decorative Elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-t-3xl"></div>
            <div className="absolute -bottom-1 left-0 w-full h-4 bg-gradient-to-b from-transparent to-white/10 rounded-t-3xl"></div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="p-6 bg-gradient-to-b from-slate-50 to-white relative" ref={searchContainerRef}>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-6 w-6 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300" />
              </div>
              <input
                type="text"
                placeholder="Search for a location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-4 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 text-lg placeholder-slate-400 bg-white/80 backdrop-blur-sm shadow-lg"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200"></div>
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-600 absolute inset-0"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Search Results */}
            {/* Enhanced Search Results - Overlay on Map */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-[1000] w-[calc(100%-48px)] left-6 top-24 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl max-h-80 overflow-hidden"
                >
                  <div className="overflow-y-auto max-h-80">
                    {searchResults.map((result, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full px-6 py-4 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-b border-slate-100 last:border-b-0 transition-all duration-300 group"
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex items-center space-x-3">
                          <GlobeAltIcon className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-900 truncate text-base">
                              {result.display_name.split(',')[0]}
                            </div>
                            <div className="text-sm text-slate-500 group-hover:text-slate-600 truncate mt-1">
                              {result.display_name}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Enlarged Map Container */}
          <div className="flex-1 relative bg-slate-100 rounded-2xl m-6 mt-2 overflow-hidden shadow-inner border border-slate-200">
            <MapContainer
              center={mapCenter}
              zoom={selectedPosition ? 15 : 6}
              style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
              key={`${mapCenter[0]}-${mapCenter[1]}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapClickHandler onLocationClick={handleMapClick} />

              {selectedPosition && (
                <Marker
                  position={selectedPosition}
                  icon={title.toLowerCase().includes('loading') ? loadingIcon : unloadingIcon}
                >
                  <Popup className="custom-popup">
                    <div className="text-center p-2">
                      <div className="font-bold text-slate-900 text-base">📍 Selected Location</div>
                      {locationDetails && (
                        <div className="text-sm text-slate-600 mt-2 space-y-1">
                          <div className="font-medium">{locationDetails.place}</div>
                          <div>{locationDetails.district}, {locationDetails.state}</div>
                          <div className="font-mono text-blue-600">{locationDetails.pincode}</div>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {/* Enhanced Instructions Overlay */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute top-6 left-6 bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/20 max-w-xs"
            >
              <div className="text-sm text-slate-700">
                <div className="flex items-center space-x-2 font-semibold mb-3 text-slate-900">
                  <MapPinIcon className="h-4 w-4 text-blue-600" />
                  <span>How to select location</span>
                </div>
                <div className="space-y-2 text-slate-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Search for a place above</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span>Click anywhere on the map</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Map Type Toggle */}
            <div className="absolute top-6 right-6 flex flex-col space-y-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 text-slate-700 hover:text-blue-600 transition-colors"
                title="Satellite View"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Enhanced Location Details & Actions */}
          <AnimatePresence>
            {locationDetails && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="p-6 bg-gradient-to-b from-slate-50 to-white border-t border-slate-200 rounded-b-3xl"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  {[
                    { label: 'Place', value: locationDetails.place, icon: '🏙️' },
                    { label: 'District', value: locationDetails.district, icon: '🗺️' },
                    { label: 'State', value: locationDetails.state, icon: '🌍' },
                    { label: 'Pincode', value: locationDetails.pincode, icon: '📮' }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{item.icon}</span>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</div>
                      </div>
                      <div className="text-base font-bold text-slate-900">{item.value || 'N/A'}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-end space-x-4">
                  <ModernButton
                    onClick={handleClose}
                    variant="outline"
                  >
                    Cancel
                  </ModernButton>
                  <ModernButton
                    onClick={handleConfirmLocation}
                    icon={<CheckIcon className="h-5 w-5" />}
                  >
                    Confirm Location
                  </ModernButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};