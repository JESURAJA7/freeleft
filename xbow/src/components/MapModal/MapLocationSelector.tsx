import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPinIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import { Button } from '../common/CustomButton';
import { Input } from '../common/CustomInput';
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

// Custom marker icons
const createCustomIcon = (color: string) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${color}"/>
      <circle cx="12.5" cy="12.5" r="6" fill="white"/>
    </svg>
  `)}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const loadingIcon = createCustomIcon('#10B981');
const unloadingIcon = createCustomIcon('#EF4444');

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
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // India center
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
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <MapPinIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-slate-200 relative" ref={searchContainerRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search for a location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Search Results - Positioned below the search bar */}
            {searchResults.length > 0 && (
              <div className="absolute z-50 w-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                  >
                    <div className="font-medium text-slate-900 truncate">
                      {result.display_name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="flex-1 relative top-20 left-0 w-full h-full">
            <MapContainer
              center={mapCenter}
              zoom={selectedPosition ? 15 : 6}
              style={{ height: '100%', width: '100%' }}
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
                  <Popup>
                    <div className="text-center">
                      <div className="font-semibold text-slate-900">Selected Location</div>
                      {locationDetails && (
                        <div className="text-sm text-slate-600 mt-1">
                          {locationDetails.place}, {locationDetails.district}
                          <br />
                          {locationDetails.state} - {locationDetails.pincode}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {/* Instructions Overlay */}
            <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <div className="text-sm text-slate-700">
                <div className="font-medium mb-1">How to select location:</div>
                <div>• Search for a place above</div>
                <div>• Or click anywhere on the map</div>
              </div>
            </div>
          </div>

          {/* Location Details & Actions */}
          {locationDetails && (
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Place</div>
                  <div className="text-sm font-medium text-slate-900">{locationDetails.place || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">District</div>
                  <div className="text-sm font-medium text-slate-900">{locationDetails.district || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">State</div>
                  <div className="text-sm font-medium text-slate-900">{locationDetails.state || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pincode</div>
                  <div className="text-sm font-medium text-slate-900">{locationDetails.pincode || 'N/A'}</div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmLocation}
                  icon={<CheckIcon className="h-4 w-4" />}
                >
                  Confirm Location
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};