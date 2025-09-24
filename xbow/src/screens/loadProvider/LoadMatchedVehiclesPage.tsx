import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TruckIcon,
    MapPinIcon,
    ScaleIcon,
    CalendarIcon,
    StarIcon,
    ChatBubbleLeftRightIcon,
    HandRaisedIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    UserIcon,
    PhoneIcon,
    CurrencyRupeeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { vehicleMatchingAPI } from '../../services/api';
import type { Load, MatchedVehicle } from '../../types/index';
import { Button } from '../../components/common/CustomButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/CustomInput';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';

export const LoadMatchedVehiclesPage: React.FC = () => {
    const { loadId } = useParams<{ loadId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [load, setLoad] = useState<Load | null>(null);
    const [vehicles, setVehicles] = useState<MatchedVehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<MatchedVehicle | null>(null);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [sortBy, setSortBy] = useState<'compatibility' | 'distance' | 'rating'>('compatibility');

    useEffect(() => {
        if (loadId) {
            fetchMatchedVehicles();
        }
    }, [loadId]);

    const fetchMatchedVehicles = async () => {
        if (!loadId) return;

        try {
            setLoading(true);
            const response = await vehicleMatchingAPI.getMatchingVehicles(loadId);
            if (response.data.success) {
                console.log('Matched vehicles response:', response.data);
                setLoad(response.data.data.load);          // <-- inside data
                setVehicles(response.data.data.vehicles);
            }
        } catch (error) {
            console.error('Error fetching matched vehicles:', error);
            toast.error('Failed to fetch matched vehicles');
        } finally {
            setLoading(false);
        }
    };

    const calculateCompatibilityScore = (vehicle: MatchedVehicle, load: Load) => {
        let score = 0;
        const totalWeight = load.materials?.reduce((sum, material) => sum + material.totalWeight, 0) || 0;

        // Vehicle type match (30 points)
        if (vehicle.vehicleType === load.vehicleRequirement.vehicleType) score += 30;

        // Size compatibility (25 points)
        if (vehicle.vehicleSize >= load.vehicleRequirement.size) score += 25;

        // Weight capacity (25 points)
        if (vehicle.passingLimit >= totalWeight / 1000) score += 25;

        // Trailer type match (20 points)
        if (vehicle.trailerType === load.vehicleRequirement.trailerType) score += 20;

        return Math.min(score, 100);
    };

    const getCompatibilityColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
        if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
        return 'text-red-600 bg-red-100 border-red-200';
    };

    const handleSendRequest = async () => {
        if (!selectedVehicle || !loadId) return;

        try {
            setRequesting(selectedVehicle._id);
            await vehicleMatchingAPI.sendVehicleRequest(loadId, selectedVehicle._id, message.trim() || undefined);
            toast.success('Vehicle request sent successfully!');

            // Update vehicle status in local state
            setVehicles(prev => prev.map(v =>
                v._id === selectedVehicle._id
                    ? { ...v, isRequested: true, requestStatus: 'pending' }
                    : v
            ));

            setIsRequestModalOpen(false);
            setMessage('');
        } catch (error: any) {
            console.error('Error sending vehicle request:', error);
            toast.error(error.response?.data?.message || 'Failed to send vehicle request');
        } finally {
            setRequesting(null);
        }
    };

    const sortedVehicles = [...vehicles].sort((a, b) => {
        switch (sortBy) {
            case 'compatibility':
                return (b.compatibilityScore || 0) - (a.compatibilityScore || 0);
            case 'distance':
                return (a.distance || 0) - (b.distance || 0);
            case 'rating':
                return 5 - 4; // Placeholder - would use actual ratings
            default:
                return 0;
        }
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="xl" />
            </div>
        );
    }

    if (!load) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Load Not Found</h2>
                    <p className="text-slate-600 mb-4">The requested load could not be found.</p>
                    <Button onClick={() => navigate('/my-loads')}>
                        Back to My Loads
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Matched Vehicles</h1>
                            <p className="text-slate-600">
                                {load.loadingLocation.place} → {load.unloadingLocation.place}
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate('/my-loads')}
                            variant="outline"
                        >
                            Back to My Loads
                        </Button>
                    </div>
                </motion.div>

                {/* Load Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
                >
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Load Requirements</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <TruckIcon className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Vehicle Type</span>
                            </div>
                            <p className="text-sm text-blue-700">{load.vehicleRequirement.vehicleType}</p>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <ScaleIcon className="h-4 w-4 text-emerald-600" />
                                <span className="text-sm font-medium text-emerald-800">Size Required</span>
                            </div>
                            <p className="text-sm text-emerald-700">{load.vehicleRequirement.size} ft</p>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <CalendarIcon className="h-4 w-4 text-orange-600" />
                                <span className="text-sm font-medium text-orange-800">Loading Date</span>
                            </div>
                            <p className="text-sm text-orange-700">{new Date(load.loadingDate).toLocaleDateString()}</p>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <CurrencyRupeeIcon className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-800">Total Weight</span>
                            </div>
                            <p className="text-sm text-purple-700">
                                {(load.materials?.reduce((sum, material) => sum + material.totalWeight, 0) || 0).toLocaleString()} kg
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Filters and Sort */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-2">Sort by:</h3>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-4 py-2 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="compatibility">Compatibility Score</option>
                                <option value="distance">Distance</option>
                                <option value="rating">Rating</option>
                            </select>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-600">Found {vehicles.length} matching vehicles</p>
                            <p className="text-xs text-slate-500">
                                {vehicles.filter(v => v.isRequested).length} requests sent
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Vehicles Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                    <AnimatePresence>
                        {sortedVehicles.map((vehicle, index) => {
                            const compatibilityScore = vehicle.compatibilityScore || calculateCompatibilityScore(vehicle, load);

                            return (
                                <motion.div
                                    key={vehicle._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                                >
                                    {/* Vehicle Header */}
                                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 border-b border-slate-100">
                                        <div className="flex items-center justify-between mb-3">
                                            {/* Vehicle photos - FIXED ALIGNMENT */}
                                            <div className="flex items-center space-x-3">
                                                <div className="flex items-center -space-x-2">
                                                    {vehicle.photos && vehicle.photos.length > 0 ? (
                                                        vehicle.photos.slice(0, 3).map((photo, idx) => (
                                                            <img
                                                                key={idx}
                                                                src={photo.url}
                                                                alt={`Vehicle ${vehicle.vehicleNumber} photo ${idx + 1}`}
                                                                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                                                            />
                                                        ))
                                                    ) : (
                                                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <TruckIcon className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <h3 className="font-semibold text-slate-900">{vehicle.vehicleNumber}</h3>
                                                    <p className="text-sm text-slate-600">{vehicle.ownerName}</p>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getCompatibilityColor(compatibilityScore)}`}>
                                                {compatibilityScore}% Match
                                            </div>
                                        </div>

                                        {vehicle.isRequested && (
                                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${vehicle.requestStatus === 'pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                vehicle.requestStatus === 'accepted' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                    'bg-red-100 text-red-700 border border-red-200'
                                                }`}>
                                                {vehicle.requestStatus === 'pending' && <ClockIcon className="h-3 w-3" />}
                                                {vehicle.requestStatus === 'accepted' && <CheckCircleIcon className="h-3 w-3" />}
                                                {vehicle.requestStatus === 'rejected' && <XCircleIcon className="h-3 w-3" />}
                                                <span className="capitalize">Request {vehicle.requestStatus}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        {/* Vehicle Details */}
                                        <div className="mb-4">
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className="text-slate-600">Type:</span>
                                                    <p className="font-medium text-slate-900">{vehicle.vehicleType}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-600">Size:</span>
                                                    <p className="font-medium text-slate-900">{vehicle.vehicleSize} ft</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-600">Capacity:</span>
                                                    <p className="font-medium text-slate-900">{vehicle.passingLimit} tons</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-600">Body Type:</span>
                                                    <p className="font-medium text-slate-900 capitalize">{vehicle.trailerType}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Availability */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">Available from:</span>
                                                <span className="text-sm font-medium text-slate-900">
                                                    {new Date(vehicle.availability).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Operating Areas */}
                                        {/* <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
              {vehicle.preferredOperatingArea.place}, {vehicle.preferredOperatingArea.state}
            </span> */}

                                        {/* Actions */}
                                        <div className="space-y-3">
                                            <div className="flex space-x-2">
                                                <Button
                                                    onClick={() => {
                                                        setSelectedVehicle(vehicle);
                                                        setIsVehicleModalOpen(true);
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    icon={<UserIcon className="h-4 w-4" />}
                                                >
                                                    View Details
                                                </Button>

                                                {!vehicle.isRequested ? (
                                                    <Button
                                                        onClick={() => {
                                                            setSelectedVehicle(vehicle);
                                                            setIsRequestModalOpen(true);
                                                        }}
                                                        loading={requesting === vehicle._id}
                                                        variant="secondary"
                                                        size="sm"
                                                        className="flex-1"
                                                        icon={<HandRaisedIcon className="h-4 w-4" />}
                                                    >
                                                        Send Request
                                                    </Button>
                                                ) : vehicle.requestStatus === 'accepted' ? (
                                                    <Button
                                                        onClick={() => {
                                                            // Handle direct assignment
                                                            toast.success('Vehicle assigned successfully!');
                                                        }}
                                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                                        size="sm"
                                                        icon={<CheckCircleIcon className="h-4 w-4" />}
                                                    >
                                                        Assign Vehicle
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        disabled
                                                        variant="ghost"
                                                        size="sm"
                                                        className="flex-1"
                                                    >
                                                        {vehicle.requestStatus === 'pending' ? 'Request Sent' : 'Request Rejected'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>

                {/* Empty State */}
                {vehicles.length === 0 && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <TruckIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">No Matching Vehicles Found</h3>
                        <p className="text-slate-600 mb-6">
                            No vehicles match your load requirements at this time.
                        </p>
                        <Button onClick={() => navigate('/my-loads')}>
                            Back to My Loads
                        </Button>
                    </motion.div>
                )}

                {/* Vehicle Request Modal */}
                <Modal
                    isOpen={isRequestModalOpen}
                    onClose={() => setIsRequestModalOpen(false)}
                    title="Send Vehicle Request"
                    size="md"
                >
                    {selectedVehicle && (
                        <div className="space-y-6">
                            {/* Vehicle Summary */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                    <TruckIcon className="h-8 w-8 text-blue-600" />
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{selectedVehicle.vehicleNumber}</h3>
                                        <p className="text-sm text-slate-600">{selectedVehicle.ownerName}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-slate-600">Type:</span>
                                        <p className="font-medium">{selectedVehicle.vehicleType}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600">Size:</span>
                                        <p className="font-medium">{selectedVehicle.vehicleSize} ft</p>
                                    </div>
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Message to Vehicle Owner (Optional)
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Add any specific requirements or questions..."
                                    rows={4}
                                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-4">
                                <Button
                                    onClick={() => setIsRequestModalOpen(false)}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSendRequest}
                                    loading={requesting === selectedVehicle._id}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                    icon={<HandRaisedIcon className="h-4 w-4" />}
                                >
                                    Send Request
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Vehicle Details Modal */}
                <Modal
                    isOpen={isVehicleModalOpen}
                    onClose={() => setIsVehicleModalOpen(false)}
                    title="Vehicle Details"
                    size="lg"
                >
                    {selectedVehicle && (
                        <div className="space-y-6">
                            {/* Owner Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-center space-x-3">
                                    <UserIcon className="h-8 w-8 text-blue-600" />
                                    <div>
                                        <h3 className="font-semibold text-blue-800">{selectedVehicle.ownerName}</h3>
                                        <p className="text-blue-600 text-sm">Vehicle Owner</p>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Specifications */}
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-4">Vehicle Specifications</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                        <h4 className="font-medium text-slate-700 mb-2">Basic Info</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Number:</span>
                                                <span className="font-medium">{selectedVehicle.vehicleNumber}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Type:</span>
                                                <span className="font-medium">{selectedVehicle.vehicleType}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Size:</span>
                                                <span className="font-medium">{selectedVehicle.vehicleSize} ft</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                        <h4 className="font-medium text-slate-700 mb-2">Capacity</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Weight:</span>
                                                <span className="font-medium">{selectedVehicle.vehicleWeight} tons</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Passing Limit:</span>
                                                <span className="font-medium">{selectedVehicle.passingLimit} tons</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Body Type:</span>
                                                <span className="font-medium capitalize">{selectedVehicle.trailerType}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Operating Areas */}
                            {/* <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                                {selectedVehicle.preferredOperatingArea.place}, {selectedVehicle.preferredOperatingArea.state}
                            </span> */}


                            {/* Vehicle Photos */}
                            {selectedVehicle.photos && selectedVehicle.photos.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-4">Vehicle Photos</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {selectedVehicle.photos.map((photo, idx) => (
                                            <div key={idx} className="relative group">
                                                <img
                                                    src={photo.url}
                                                    alt={`Vehicle ${idx + 1}`}
                                                    className="w-full h-24 object-cover rounded-lg border border-slate-200 group-hover:opacity-80 transition-opacity cursor-pointer"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
};