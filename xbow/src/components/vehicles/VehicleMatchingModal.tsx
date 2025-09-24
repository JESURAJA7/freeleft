import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TruckIcon,
    MapPinIcon,
    ScaleIcon,
    CalendarIcon,
    StarIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    XMarkIcon,
    CurrencyRupeeIcon,
    UserIcon,
    PhoneIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { Modal } from '../common/Modal';
import { Button } from '../common/CustomButton';
import { Input } from '../common/CustomInput';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { vehicleMatchingAPI } from '../../services/api';
import type { Load, Vehicle, VehicleApplication } from '../../types/index';
import toast from 'react-hot-toast';

interface VehicleMatchingModalProps {
    isOpen: boolean;
    onClose: () => void;
    load: Load | null;
    onSelectVehicle: (vehicleId: string, agreedPrice: number) => void;
    onSendMessage: (vehicleId: string, message: string) => void;
}

export const VehicleMatchingModal: React.FC<VehicleMatchingModalProps> = ({
    isOpen,
    onClose,
    load,
    onSelectVehicle,
    onSendMessage
}) => {
    const [applications, setApplications] = useState<VehicleApplication[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [loading, setLoading] = useState(false);
    const [responding, setResponding] = useState<string | null>(null);
    const [messageModal, setMessageModal] = useState<{ isOpen: boolean; vehicleId: string; ownerName: string }>({
        isOpen: false,
        vehicleId: '',
        ownerName: ''
    });
    const [message, setMessage] = useState('');
    const [agreedPrice, setAgreedPrice] = useState<number>(0);
    const [showPriceInput, setShowPriceInput] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && load) {
            fetchApplications();
        }
    }, [isOpen, load]);

    const fetchApplications = async () => {
        if (!load) return;

        try {
            setLoading(true);
            const response = await vehicleMatchingAPI.getLoadApplications(load._id);
            if (response.data.success) {
                setApplications(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Failed to fetch vehicle applications');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptApplication = async (applicationId: string, vehicleId: string) => {
        if (agreedPrice <= 0) {
            toast.error('Please enter a valid agreed price');
            return;
        }

        try {
            setResponding(applicationId);
            await vehicleMatchingAPI.respondToApplication(applicationId, 'accepted', agreedPrice);
            toast.success('Vehicle application accepted!');
            onSelectVehicle(vehicleId, agreedPrice);
            onClose();
        } catch (error: any) {
            console.error('Error accepting application:', error);
            toast.error(error.response?.data?.message || 'Failed to accept application');
        } finally {
            setResponding(null);
            setShowPriceInput(null);
        }
    };

    const handleRejectApplication = async (applicationId: string) => {
        try {
            setResponding(applicationId);
            await vehicleMatchingAPI.respondToApplication(applicationId, 'rejected');
            toast.success('Vehicle application rejected');
            fetchApplications(); // Refresh the list
        } catch (error: any) {
            console.error('Error rejecting application:', error);
            toast.error(error.response?.data?.message || 'Failed to reject application');
        } finally {
            setResponding(null);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !messageModal.vehicleId) return;

        try {
            await onSendMessage(messageModal.vehicleId, message);
            setMessage('');
            setMessageModal({ isOpen: false, vehicleId: '', ownerName: '' });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const calculateCompatibilityScore = (vehicle: Vehicle) => {
        if (!load) return 0;

        let score = 0;
        const totalWeight = load.materials?.reduce((sum, material) => sum + material.totalWeight, 0) || 0;

        // Vehicle type match
        if (vehicle.vehicleType === load.vehicleRequirement.vehicleType) score += 30;

        // Size compatibility
        if (vehicle.vehicleSize >= load.vehicleRequirement.size) score += 25;

        // Weight capacity
        if (vehicle.passingLimit >= totalWeight / 1000) score += 25;

        // Trailer type match
        if (vehicle.trailerType === load.vehicleRequirement.trailerType) score += 20;

        return Math.min(score, 100);
    };

    const getCompatibilityColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
        if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
        return 'text-red-600 bg-red-100 border-red-200';
    };

    if (!load) return null;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title=""
                size="xl"
                fullScreen={true}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Vehicle Applications</h2>
                                <p className="text-emerald-100">
                                    {load.loadingLocation.place || 'N/A'} → {load.unloadingLocation.place || 'N/A'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-emerald-100 text-sm">Load #{load._id.slice(-6).toUpperCase()}</p>
                                <p className="text-white font-semibold">{applications.length} Applications</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <LoadingSpinner size="xl" />
                            </div>
                        ) : applications.length === 0 ? (
                            <div className="text-center py-16">
                                <TruckIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Applications Yet</h3>
                                <p className="text-slate-600">Vehicle owners haven't applied for this load yet. Check back later.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <AnimatePresence>
                                    {applications.map((application, index) => {
                                        const compatibilityScore = calculateCompatibilityScore(application.vehicle);

                                        return (
                                            <motion.div
                                                key={application._id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                                            >
                                                {/* Application Header */}
                                                <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 border-b border-slate-100">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <UserIcon className="h-5 w-5 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold text-slate-900">{application.vehicleOwnerName}</h3>
                                                                <p className="text-sm text-slate-600">Vehicle Owner</p>
                                                            </div>
                                                        </div>
                                                        <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getCompatibilityColor(compatibilityScore)}`}>
                                                            {compatibilityScore}% Match
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-sm text-slate-600">
                                                        <span>Applied: {new Date(application.appliedAt).toLocaleDateString()}</span>
                                                        {application.bidPrice && (
                                                            <span className="font-semibold text-emerald-600">
                                                                Bid: ₹{application.bidPrice.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Vehicle Details */}
                                                <div className="p-4">
                                                    <div className="mb-4">
                                                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                                                            <TruckIcon className="h-4 w-4 mr-2 text-slate-600" />
                                                            {application.vehicle.vehicleNumber}
                                                        </h4>

                                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                                            <div>
                                                                <span className="text-slate-600">Type:</span>
                                                                <p className="font-medium text-slate-900">{application.vehicle.vehicleType}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-600">Size:</span>
                                                                <p className="font-medium text-slate-900">{application.vehicle.vehicleSize} ft</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-600">Capacity:</span>
                                                                <p className="font-medium text-slate-900">{application.vehicle.passingLimit} tons</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-600">Body:</span>
                                                                <p className="font-medium text-slate-900 capitalize">{application.vehicle.trailerType}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Availability */}
                                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-slate-600">Available from:</span>
                                                            <span className="text-sm font-medium text-slate-900">
                                                                {new Date(application.vehicle.availability).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Operating Areas */}
                                                    <div className="mb-4">
                                                        <h5 className="text-sm font-medium text-slate-700 mb-2">Operating Areas</h5>
                                                        <div className="flex flex-wrap gap-1">
                                                            {application.vehicle.preferredOperatingArea ? (
                                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                                                                    {application.vehicle.preferredOperatingArea.place || "N/A"},{" "}
                                                                    {application.vehicle.preferredOperatingArea.state || "N/A"}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-slate-500 italic">No operating area specified</span>
                                                            )}
                                                        </div>
                                                    </div>



                                                    {/* Application Message */}
                                                    {application.message && (
                                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                                                            <p className="text-sm text-blue-800">"{application.message}"</p>
                                                        </div>
                                                    )}

                                                    {/* Actions */}
                                                    {application.status === 'pending' && (
                                                        <div className="space-y-3">
                                                            {showPriceInput === application._id ? (
                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                                                            Agreed Price (₹)
                                                                        </label>
                                                                        <Input
                                                                            type="number"
                                                                            placeholder="Enter agreed price"
                                                                            value={agreedPrice.toString()}
                                                                            onChange={(value) => setAgreedPrice(Number(value))}
                                                                        />
                                                                    </div>
                                                                    <div className="flex space-x-2">
                                                                        <Button
                                                                            onClick={() => handleAcceptApplication(application._id, application.vehicleId)}
                                                                            loading={responding === application._id}
                                                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                                                            icon={<CheckCircleIcon className="h-4 w-4" />}
                                                                        >
                                                                            Confirm Accept
                                                                        </Button>
                                                                        <Button
                                                                            onClick={() => setShowPriceInput(null)}
                                                                            variant="outline"
                                                                            className="flex-1"
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex space-x-2">
                                                                    <Button
                                                                        onClick={() => {
                                                                            setAgreedPrice(application.bidPrice || 0);
                                                                            setShowPriceInput(application._id);
                                                                        }}
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        className="flex-1"
                                                                        icon={<CheckCircleIcon className="h-4 w-4" />}
                                                                    >
                                                                        Accept
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => handleRejectApplication(application._id)}
                                                                        loading={responding === application._id}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                                                        icon={<XMarkIcon className="h-4 w-4" />}
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => setMessageModal({
                                                                            isOpen: true,
                                                                            vehicleId: application.vehicleId,
                                                                            ownerName: application.vehicleOwnerName
                                                                        })}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
                                                                    >
                                                                        Message
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {application.status === 'accepted' && (
                                                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                                            <div className="flex items-center space-x-2">
                                                                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                                                <span className="text-sm font-medium text-green-800">Application Accepted</span>
                                                            </div>
                                                            {application.respondedAt && (
                                                                <p className="text-xs text-green-600 mt-1">
                                                                    Accepted on {new Date(application.respondedAt).toLocaleDateString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {application.status === 'rejected' && (
                                                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                                            <div className="flex items-center space-x-2">
                                                                <XMarkIcon className="h-5 w-5 text-red-600" />
                                                                <span className="text-sm font-medium text-red-800">Application Rejected</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Message Modal */}
            <Modal
                isOpen={messageModal.isOpen}
                onClose={() => setMessageModal({ isOpen: false, vehicleId: '', ownerName: '' })}
                title={`Message ${messageModal.ownerName}`}
                size="md"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Your Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                            rows={4}
                            className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none resize-none"
                        />
                    </div>

                    <div className="flex space-x-3">
                        <Button
                            onClick={handleSendMessage}
                            disabled={!message.trim()}
                            className="flex-1"
                            icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
                        >
                            Send Message
                        </Button>
                        <Button
                            onClick={() => setMessageModal({ isOpen: false, vehicleId: '', ownerName: '' })}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};