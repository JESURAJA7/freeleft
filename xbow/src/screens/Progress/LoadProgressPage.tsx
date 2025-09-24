import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    MapPin,
    Truck,
    Calendar,
    Clock,
    Package,
    Scale,
    User,
    MessageSquare,
    Phone,
    Mail,
    CheckCircle,
    AlertCircle,
    FileText,
    Camera,
    Navigation,
    DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadTimeline } from '../../components/LoadTimeline';
import { Button } from '../../components/common/CustomButton';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { loadAPI, vehicleAPI, loadAssignmentAPI } from '../../services/api';
import type { Load, Vehicle } from '../../types';
import toast from 'react-hot-toast';

interface LoadAssignment {
  _id: string;
  loadId: Load;
  vehicleId: Vehicle;
  loadProviderId: string;
  vehicleOwnerId: string;
  applicationId?: string;
  agreedPrice: number;
  status: 'assigned' | 'enroute' | 'delivered' | 'completed';
  startedAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const LoadProgressPage: React.FC = () => {
    const { loadId } = useParams<{ loadId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [currentLoad, setCurrentLoad] = useState<Load | null>(null);
    const [currentAssignment, setCurrentAssignment] = useState<LoadAssignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');

    useEffect(() => {
        if (loadId) {
            if (user?.role === 'vehicle_owner') {
                fetchAssignmentByLoad();
            } else {
                fetchLoadData();
            }
        }
    }, [loadId, user?.role]);

    // Fetch assignment data for vehicle owners
    const fetchAssignmentByLoad = async () => {
        try {
            setLoading(true);
            const response = await loadAssignmentAPI.getAssignmentByLoad(loadId!);
            if (response.data.success) {
                const assignment = response.data.data;
                setCurrentAssignment(assignment);
                setCurrentLoad(assignment.loadId);
            } else {
                toast.error('Assignment not found');
                navigate('/load-progress');
            }
        } catch (error) {
            console.error('Error fetching assignment:', error);
            toast.error('Failed to load assignment data');
            navigate('/load-progress');
        } finally {
            setLoading(false);
        }
    };

    // Fetch load data for load providers
    const fetchLoadData = async () => {
        try {
            setLoading(true);
            const response = await loadAPI.getLoad(loadId!);
            if (response.data.success) {
                setCurrentLoad(response.data.data);
            } else {
                toast.error('Load not found');
                navigate('/load-progress');
            }
        } catch (error) {
            console.error('Error fetching load:', error);
            toast.error('Failed to load data');
            navigate('/load-progress');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (status: string) => {
        if (!currentLoad) return;

        // For vehicle owners, check assignment status
        if (user?.role === 'vehicle_owner' && !currentAssignment) {
            toast.error('Assignment not found');
            return;
        }

        setNewStatus(status);
        setIsStatusUpdateModalOpen(true);
    };

    const confirmStatusUpdate = async () => {
        if (!currentLoad || !newStatus) return;

        try {
            setUpdating(true);

            if (user?.role === 'vehicle_owner' && currentAssignment) {
                // Update assignment status (this will update both load and vehicle)
                const response = await loadAssignmentAPI.updateAssignmentStatus(
                    currentAssignment._id,
                    newStatus,
                    statusNote
                );

                if (response.data.success) {
                    toast.success(`Status updated to ${newStatus}`);
                    // Refresh assignment data
                    await fetchAssignmentByLoad();
                } else {
                    toast.error('Failed to update status');
                }
            } else {
                // Load provider updates load status
                const response = await loadAPI.updateLoadStatus(currentLoad._id, newStatus);
                if (response.data.success) {
                    toast.success(`Load status updated to ${newStatus}`);
                    setCurrentLoad(prev => prev ? { ...prev, status: newStatus as any } : null);
                } else {
                    toast.error('Failed to update status');
                }
            }

            setIsStatusUpdateModalOpen(false);
            setStatusNote('');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) {
            toast.error('Please enter a message');
            return;
        }

        try {
            // Send message API call
            await loadAPI.sendMessage(currentLoad?._id || '', message);

            toast.success('Message sent successfully');
            setIsMessageModalOpen(false);
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'posted': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'enroute': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'delivered': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'posted': return <FileText className="h-4 w-4" />;
            case 'assigned': return <Truck className="h-4 w-4" />;
            case 'enroute': return <Navigation className="h-4 w-4" />;
            case 'delivered': return <CheckCircle className="h-4 w-4" />;
            case 'completed': return <CheckCircle className="h-4 w-4" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };

    const canUpdateStatus = () => {
        if (user?.role === 'vehicle_owner') {
            return currentAssignment && ['assigned', 'enroute', 'delivered'].includes(currentAssignment.status);
        }
        // Load providers can update status
        return user?.role === 'load_provider' && currentLoad?.status !== 'completed';
    };

    const getCurrentStatus = () => {
        if (user?.role === 'vehicle_owner' && currentAssignment) {
            return currentAssignment.status;
        }
        return currentLoad?.status || 'posted';
    };

    const totalWeight = currentLoad?.materials?.reduce((sum, material) => sum + material.totalWeight, 0) || 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="xl" />
            </div>
        );
    }

    if (!currentLoad) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Load Not Found</h2>
                    <p className="text-slate-600 mb-4">The requested load could not be found.</p>
                    <Button onClick={() => navigate('/load-progress')}>
                        Back to Load Progress
                    </Button>
                </div>
            </div>
        );
    }

    const currentStatus = getCurrentStatus();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                onClick={() => navigate('/load-progress-list')}
                                variant="outline"
                                icon={<ArrowLeft className="h-4 w-4" />}
                            >
                                Back
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Load Progress</h1>
                                <p className="text-slate-600">
                                    {currentLoad.loadingLocation.place} → {currentLoad.unloadingLocation.place}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Assignment Price for Vehicle Owners */}
                            {user?.role === 'vehicle_owner' && currentAssignment && (
                                <div className="bg-green-100 border-2 border-green-200 px-4 py-2 rounded-xl">
                                    <div className="flex items-center space-x-2">
                                        <DollarSign className="h-4 w-4 text-green-700" />
                                        <span className="font-medium text-green-800">
                                            ₹{currentAssignment.agreedPrice.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className={`px-4 py-2 rounded-xl border-2 font-medium flex items-center space-x-2 ${getStatusColor(currentStatus)}`}>
                                {getStatusIcon(currentStatus)}
                                <span className="capitalize">{currentStatus}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Load Details */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-1 space-y-6"
                    >
                        {/* Basic Info */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Load Details</h3>

                            {/* Route */}
                            <div className="mb-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <MapPin className="h-4 w-4 text-blue-600" />
                                            <span className="font-semibold text-slate-900">From</span>
                                        </div>
                                        <p className="text-slate-700 ml-6">{currentLoad.loadingLocation.place}</p>
                                        <p className="text-sm text-slate-500 ml-6">
                                            {currentLoad.loadingLocation.district}, {currentLoad.loadingLocation.state}
                                        </p>
                                        <p className="text-xs text-slate-400 ml-6">PIN: {currentLoad.loadingLocation.pincode}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <MapPin className="h-4 w-4 text-emerald-600" />
                                            <span className="font-semibold text-slate-900">To</span>
                                        </div>
                                        <p className="text-slate-700 ml-6">{currentLoad.unloadingLocation.place}</p>
                                        <p className="text-sm text-slate-500 ml-6">
                                            {currentLoad.unloadingLocation.district}, {currentLoad.unloadingLocation.state}
                                        </p>
                                        <p className="text-xs text-slate-400 ml-6">PIN: {currentLoad.unloadingLocation.pincode}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Key Details */}
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Truck className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">Vehicle Required</span>
                                    </div>
                                    <p className="text-blue-700">
                                        {currentLoad.vehicleRequirement.size}ft {currentLoad.vehicleRequirement.vehicleType}
                                    </p>
                                    {currentLoad.vehicleRequirement.trailerType !== 'none' && (
                                        <p className="text-xs text-blue-600 mt-1">
                                            Trailer: {currentLoad.vehicleRequirement.trailerType}
                                        </p>
                                    )}
                                </div>

                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Scale className="h-4 w-4 text-emerald-600" />
                                        <span className="text-sm font-medium text-emerald-800">Total Weight</span>
                                    </div>
                                    <p className="text-emerald-700">{totalWeight.toLocaleString()} kg</p>
                                </div>

                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Calendar className="h-4 w-4 text-orange-600" />
                                        <span className="text-sm font-medium text-orange-800">Loading Schedule</span>
                                    </div>
                                    <p className="text-orange-700">
                                        {new Date(currentLoad.loadingDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-orange-600 mt-1">Time: {currentLoad.loadingTime}</p>
                                </div>

                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <DollarSign className="h-4 w-4 text-purple-600" />
                                        <span className="text-sm font-medium text-purple-800">Payment Terms</span>
                                    </div>
                                    <p className="text-purple-700 uppercase">{currentLoad.paymentTerms}</p>
                                    {currentLoad.withXBowSupport && (
                                        <p className="text-xs text-purple-600 mt-1">With XBOW Support</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Materials */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Materials</h3>
                            <div className="space-y-3">
                                {currentLoad.materials?.map((material, index) => (
                                    <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Package className="h-4 w-4 text-slate-600" />
                                            <span className="font-medium text-slate-900">{material.name}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                                            <div>
                                                <span>Dimensions:</span>
                                                <p className="font-medium">
                                                    {material.dimensions.length} × {material.dimensions.width} × {material.dimensions.height}
                                                </p>
                                            </div>
                                            <div>
                                                <span>Count:</span>
                                                <p className="font-medium">{material.totalCount} ({material.packType})</p>
                                            </div>
                                            <div>
                                                <span>Weight:</span>
                                                <p className="font-medium">{material.totalWeight} kg</p>
                                            </div>
                                            <div>
                                                <span>Per Unit:</span>
                                                <p className="font-medium">{material.singleWeight} kg</p>
                                            </div>
                                        </div>
                                        {material.photos && material.photos.length > 0 && (
                                            <div className="mt-3">
                                                <img
                                                    src={material.photos[0]?.url}
                                                    alt={material.name}
                                                    className="w-full h-32 object-cover rounded-lg"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">
                                {user?.role === 'load_provider' ? 'Vehicle Owner' : 'Load Provider'}
                            </h3>
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900">
                                        {user?.role === 'load_provider' 
                                            ? (currentAssignment?.vehicleId?.ownerName || 'Vehicle Owner')
                                            : currentLoad.loadProviderName
                                        }
                                    </h4>
                                    <p className="text-sm text-slate-600">
                                        {user?.role === 'load_provider' ? 'Vehicle Owner' : 'Load Provider'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex space-x-2">
                                <Button
                                    onClick={() => setIsMessageModalOpen(true)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    icon={<MessageSquare className="h-4 w-4" />}
                                >
                                    Message
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    icon={<Phone className="h-4 w-4" />}
                                >
                                    Call
                                </Button>
                            </div>
                        </div>

                        {/* Vehicle Info (for load providers) */}
                        {user?.role === 'load_provider' && currentLoad.assignedVehicleId && (
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Assigned Vehicle</h3>
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Truck className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900">Vehicle Details</h4>
                                        <p className="text-sm text-slate-600">Assigned Vehicle</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Assignment Vehicle Info (for vehicle owners) */}
                        {user?.role === 'vehicle_owner' && currentAssignment?.vehicleId && (
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Assigned Vehicle</h3>
                                <div className="flex items-center space-x-3 mb-4">
                                    {currentAssignment.vehicleId.photos && currentAssignment.vehicleId.photos.length > 0 ? (
                                        <img
                                            src={currentAssignment.vehicleId.photos[0]?.url}
                                            alt={`Vehicle ${currentAssignment.vehicleId.vehicleNumber}`}
                                            className="h-12 w-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Truck className="h-6 w-6 text-blue-600" />
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-semibold text-slate-900">
                                            {currentAssignment.vehicleId.vehicleNumber}
                                        </h4>
                                        <p className="text-sm text-slate-600">
                                            {currentAssignment.vehicleId.vehicleSize}ft {currentAssignment.vehicleId.vehicleType}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Timeline */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <LoadTimeline
                            currentStatus={currentStatus}
                            loadingDate={currentLoad.loadingDate}
                            onStatusChange={handleStatusChange}
                            onSendMessage={() => setIsMessageModalOpen(true)}
                            canUpdateStatus={!!canUpdateStatus()}
                            userRole={user?.role || 'load_provider'}
                        />
                    </motion.div>
                </div>

                {/* Message Modal */}
                <Modal
                    isOpen={isMessageModalOpen}
                    onClose={() => setIsMessageModalOpen(false)}
                    title="Send Message"
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Message to {user?.role === 'load_provider' ? 'Vehicle Owner' : 'Load Provider'}
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message here..."
                                rows={4}
                                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                            />
                        </div>

                        <div className="flex space-x-4">
                            <Button
                                onClick={() => setIsMessageModalOpen(false)}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSendMessage}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                icon={<MessageSquare className="h-4 w-4" />}
                            >
                                Send Message
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Status Update Modal */}
                <Modal
                    isOpen={isStatusUpdateModalOpen}
                    onClose={() => setIsStatusUpdateModalOpen(false)}
                    title="Update Status"
                    size="md"
                >
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h4 className="font-medium text-blue-800 mb-2">Status Update</h4>
                            <p className="text-blue-700">
                                You are about to update the status to: <strong className="capitalize">{newStatus}</strong>
                            </p>
                            {user?.role === 'vehicle_owner' && (
                                <p className="text-xs text-blue-600 mt-2">
                                    This will update both the load and vehicle status.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Add Note (Optional)
                            </label>
                            <textarea
                                value={statusNote}
                                onChange={(e) => setStatusNote(e.target.value)}
                                placeholder="Add any additional information about this status update..."
                                rows={3}
                                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                            />
                        </div>

                        <div className="flex space-x-4">
                            <Button
                                onClick={() => setIsStatusUpdateModalOpen(false)}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmStatusUpdate}
                                loading={updating}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                icon={<CheckCircle className="h-4 w-4" />}
                            >
                                Confirm Update
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};