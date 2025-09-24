import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../common/LoadingSpinner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapModalProps {
    loadingLocation: {
        pincode: string;
        state: string;
        district: string;
        place: string;
        coordinates: { latitude: number; longitude: number };
    };
    unloadingLocation: {
        pincode: string;
        state: string;
        district: string;
        place: string;
        coordinates: { latitude: number; longitude: number };
    };
    onConfirm: (loadingCoords: { lat: number; lng: number }, unloadingCoords: { lat: number; lng: number }) => void;
    onClose: () => void;
}

export const MapModal: React.FC<MapModalProps> = ({ loadingLocation, unloadingLocation, onConfirm, onClose }) => {
    const [map, setMap] = useState<L.Map | null>(null);
    const [loadingCoords, setLoadingCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [unloadingCoords, setUnloadingCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [route, setRoute] = useState<L.Polyline | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const initMap = async () => {
                try {
                    // Initialize the map
                    const mapInstance = L.map('map').setView([20.5937, 78.9629], 5);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    }).addTo(mapInstance);

                    setMap(mapInstance);

                    // Try to geocode the locations
                    try {
                        const loadingResponse = await fetch(
                            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                                `${loadingLocation.place}, ${loadingLocation.district}, ${loadingLocation.state}, ${loadingLocation.pincode}`
                            )}`
                        );
                        const loadingData = await loadingResponse.json();

                        const unloadingResponse = await fetch(
                            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                                `${unloadingLocation.place}, ${unloadingLocation.district}, ${unloadingLocation.state}, ${unloadingLocation.pincode}`
                            )}`
                        );
                        const unloadingData = await unloadingResponse.json();

                        if (loadingData.length > 0 && unloadingData.length > 0) {
                            const loadingLatLng = {
                                lat: parseFloat(loadingData[0].lat),
                                lng: parseFloat(loadingData[0].lon)
                            };
                            const unloadingLatLng = {
                                lat: parseFloat(unloadingData[0].lat),
                                lng: parseFloat(unloadingData[0].lon)
                            };

                            setLoadingCoords(loadingLatLng);
                            setUnloadingCoords(unloadingLatLng);

                            // Add markers
                            L.marker(loadingLatLng, {
                                icon: L.divIcon({
                                    className: 'bg-blue-500 rounded-full w-4 h-4 border-2 border-white',
                                    iconSize: [16, 16]
                                })
                            })
                                .addTo(mapInstance)
                                .bindPopup('Loading Point');

                            L.marker(unloadingLatLng, {
                                icon: L.divIcon({
                                    className: 'bg-red-500 rounded-full w-4 h-4 border-2 border-white',
                                    iconSize: [16, 16]
                                })
                            })
                                .addTo(mapInstance)
                                .bindPopup('Unloading Point');

                            // Add route line
                            const routeLine = L.polyline([loadingLatLng, unloadingLatLng], {
                                color: '#3b82f6',
                                weight: 3,
                                dashArray: '5, 5'
                            }).addTo(mapInstance);
                            setRoute(routeLine);

                            // Fit bounds to show both points
                            mapInstance.fitBounds(L.latLngBounds(loadingLatLng, unloadingLatLng));
                        } else {
                            setError('Could not find coordinates for one or both locations');
                        }
                    } catch (err) {
                        console.error('Geocoding error:', err);
                        setError('Error while finding locations on map');
                    }
                } catch (err) {
                    console.error('Map initialization error:', err);
                    setError('Failed to initialize map');
                } finally {
                    setLoading(false);
                }
            };

            initMap();

            return () => {
                if (map) {
                    map.remove();
                }
            };
        }
    }, []);

    const handleConfirm = () => {
        if (loadingCoords && unloadingCoords) {
            onConfirm(loadingCoords, unloadingCoords);
        }
    };

    return (
        <Dialog open={true} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <Dialog.Title className="text-xl font-semibold text-slate-900">
                            Confirm Route on Map
                        </Dialog.Title>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
                            {error} - Please check the addresses and try again
                        </div>
                    )}

                    {loading ? (
                        <div className="h-96 flex items-center justify-center">
                            <LoadingSpinner size="xl" />
                        </div>
                    ) : (
                        <>
                            <div id="map" className="h-96 rounded-lg border border-slate-200" />
                            <div className="mt-4 flex justify-end space-x-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={!loadingCoords || !unloadingCoords}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm Route
                                </button>
                            </div>
                        </>
                    )}
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};