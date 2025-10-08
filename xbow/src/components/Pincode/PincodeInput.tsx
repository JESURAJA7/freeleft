// components/PincodeInput.tsx
import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface PincodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onLocationData: (data: {
    pincode: string;
    place: string;
    district: string;
    state: string;
    coordinates: { latitude: number; longitude: number };
  }) => void;
  placeholder?: string;
  required?: boolean;
  loading?: boolean;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyAV3LUIYVzQ2LVGdrOOEgfiwzvRtZ7edSw';

export const PincodeInput: React.FC<PincodeInputProps> = ({
  value,
  onChange,
  onLocationData,
  placeholder = "Enter 6-digit pincode",
  required = false,
  loading = false
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const searchPincode = async (pincode: string) => {
    if (pincode.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${pincode},India&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        const formattedSuggestions = data.results.map((result: any) => {
          const addressComponents = result.address_components;
          const location = result.geometry.location;

          let place = '';
          let district = '';
          let state = '';
          let postalCode = '';

          addressComponents.forEach((component: any) => {
            if (component.types.includes('postal_code')) {
              postalCode = component.long_name;
            }
            if (component.types.includes('locality') || component.types.includes('sublocality')) {
              place = component.long_name;
            }
            if (component.types.includes('administrative_area_level_3')) {
              if (!district) district = component.long_name;
            }
            if (component.types.includes('administrative_area_level_2')) {
              district = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              state = component.long_name;
            }
          });

          return {
            formatted_address: result.formatted_address,
            place: place || result.formatted_address.split(',')[0],
            district: district || state,
            state: state,
            pincode: postalCode,
            coordinates: {
              latitude: location.lat,
              longitude: location.lng
            }
          };
        });

        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching pincode:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, 6);
    onChange(newValue);
    
    if (newValue.length >= 3) {
      searchPincode(newValue);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    onChange(suggestion.pincode || value);
    onLocationData({
      pincode: suggestion.pincode || value,
      place: suggestion.place,
      district: suggestion.district,
      state: suggestion.state,
      coordinates: suggestion.coordinates
    });
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => value.length >= 3 && setShowSuggestions(true)}
          placeholder={placeholder}
          maxLength={6}
          className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
          required={required}
        />
        {(loading || isSearching) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-3 cursor-pointer hover:bg-slate-100 border-b border-slate-200 last:border-b-0 transition-colors"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="font-medium text-slate-900">
                {suggestion.pincode ? `Pincode: ${suggestion.pincode}` : 'Pincode not found'}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                {suggestion.place}, {suggestion.district}, {suggestion.state}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {suggestion.formatted_address}
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && isSearching && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-center text-slate-600">
            <LoadingSpinner size="sm" />
            <span className="ml-2">Searching pincodes...</span>
          </div>
        </div>
      )}
    </div>
  );
};