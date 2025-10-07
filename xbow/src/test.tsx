import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY';

interface LocationData {
  pincode: string;
  state: string;
  district: string;
  place: string;
  coordinates: { latitude: number; longitude: number };
}

interface FormData {
  loadingLocation: LocationData;
  unloadingLocation: LocationData;
}

export const PostLoadPage = () => {
  const [isGeocodingLoading, setIsGeocodingLoading] = useState<{
    loading: boolean;
    unloading: boolean;
  }>({ loading: false, unloading: false });

  const [formData, setFormData] = useState<FormData>({
    loadingLocation: {
      pincode: '',
      state: '',
      district: '',
      place: '',
      coordinates: { latitude: 0, longitude: 0 }
    },
    unloadingLocation: {
      pincode: '',
      state: '',
      district: '',
      place: '',
      coordinates: { latitude: 0, longitude: 0 }
    }
  });

  const geocodePincode = async (pincode: string, locationType: 'loading' | 'unloading') => {
    if (pincode.length < 6) return;

    setIsGeocodingLoading(prev => ({ ...prev, [locationType]: true }));

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${pincode},India&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results[0]) {
        const result = data.results[0];
        const addressComponents = result.address_components;
        const location = result.geometry.location;

        let place = '';
        let district = '';
        let state = '';

        addressComponents.forEach((component: any) => {
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

        const locationKey = locationType === 'loading' ? 'loadingLocation' : 'unloadingLocation';
        setFormData(prev => ({
          ...prev,
          [locationKey]: {
            pincode,
            place: place || result.formatted_address.split(',')[0],
            district: district || state,
            state: state,
            coordinates: {
              latitude: location.lat,
              longitude: location.lng
            }
          }
        }));
      } else {
        console.log('Geocode failed:', data.status);
      }
    } catch (error) {
      console.error('Error geocoding pincode:', error);
    } finally {
      setIsGeocodingLoading(prev => ({ ...prev, [locationType]: false }));
    }
  };

  const handlePincodeChange = (locationType: 'loading' | 'unloading', value: string) => {
    const locationKey = locationType === 'loading' ? 'loadingLocation' : 'unloadingLocation';

    setFormData(prev => ({
      ...prev,
      [locationKey]: {
        ...prev[locationKey],
        pincode: value
      }
    }));

    if (value.length === 6) {
      geocodePincode(value, locationType);
    }
  };

  const handleLocationChange = (locationType: 'loadingLocation' | 'unloadingLocation', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [locationType]: {
        ...prev[locationType],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Form data logged to console');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Pincode Location Finder</h1>
          <p className="text-slate-600">Enter a pincode to automatically fill location details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
            <div className="flex items-center space-x-3 mb-6">
              <MapPin className="h-6 w-6 text-blue-600" />
              <h3 className="text-2xl font-bold text-slate-900">Loading Location</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Pincode *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.loadingLocation.pincode}
                    onChange={(e) => handlePincodeChange('loading', e.target.value)}
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                  />
                  {isGeocodingLoading.loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Place *
                </label>
                <input
                  type="text"
                  value={formData.loadingLocation.place}
                  onChange={(e) => handleLocationChange('loadingLocation', 'place', e.target.value)}
                  placeholder="Place/City"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  District *
                </label>
                <input
                  type="text"
                  value={formData.loadingLocation.district}
                  onChange={(e) => handleLocationChange('loadingLocation', 'district', e.target.value)}
                  placeholder="District"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.loadingLocation.state}
                  onChange={(e) => handleLocationChange('loadingLocation', 'state', e.target.value)}
                  placeholder="State"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
            <div className="flex items-center space-x-3 mb-6">
              <MapPin className="h-6 w-6 text-green-600" />
              <h3 className="text-2xl font-bold text-slate-900">Unloading Location</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Pincode *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.unloadingLocation.pincode}
                    onChange={(e) => handlePincodeChange('unloading', e.target.value)}
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                  />
                  {isGeocodingLoading.unloading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Place *
                </label>
                <input
                  type="text"
                  value={formData.unloadingLocation.place}
                  onChange={(e) => handleLocationChange('unloadingLocation', 'place', e.target.value)}
                  placeholder="Place/City"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  District *
                </label>
                <input
                  type="text"
                  value={formData.unloadingLocation.district}
                  onChange={(e) => handleLocationChange('unloadingLocation', 'district', e.target.value)}
                  placeholder="District"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.unloadingLocation.state}
                  onChange={(e) => handleLocationChange('unloadingLocation', 'state', e.target.value)}
                  placeholder="State"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Submit Form
            </button>
          </div>
        </form>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
          <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
            <li>Enter a 6-digit Indian pincode in the Pincode field</li>
            <li>Place, District, and State will be automatically filled</li>
            <li>You can manually edit any auto-filled field if needed</li>
            <li>Replace 'YOUR_API_KEY' in the code with your Google Maps API key</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PostLoadPage;
