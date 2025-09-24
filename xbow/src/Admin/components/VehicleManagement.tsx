import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PhotoIcon,
  DocumentTextIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal, ImageGalleryModal, ConfirmationModal } from '../../components/common/Modal';
import { adminAPI } from '../services/adminApi';
import toast from 'react-hot-toast';
import type{ Vehicle } from '../../types';

// interface Vehicle {
//   _id: string;
//   ownerId: any;
//   ownerName: string;
//   vehicleType: string;
//   vehicleSize: number;
//   vehicleWeight: number;
//   dimensions: { length: number; breadth: number };
//   vehicleNumber: string;
//   passingLimit: number;
//   availability: string;
//   isOpen: boolean;
//   tarpaulin: string;
//   trailerType: string;
//   operatingAreas: Array<{
//     state: string;
//     district: string;
//     place: string;
//   }>;
//   photos: Array<{
//     type: string;
//     url: string;
//     publicId: string;
//   }>;
//   status: string;
//   isApproved: boolean;
//   createdAt: string;
// }

export const VehicleManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; vehicleId: string } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    approval: 'all',
    vehicleType: 'all'
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, filters]);

  const fetchVehicles = async () => {
    try {
      const response = await adminAPI.getVehicles();
      if (response.data.success) {
        setVehicles(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    let filtered = [...vehicles];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(vehicle =>
        vehicle.ownerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        vehicle.vehicleNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        vehicle.preferredOperatingArea.place.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === filters.status);
    }

    // Approval filter
    if (filters.approval !== 'all') {
      filtered = filtered.filter(vehicle => 
        filters.approval === 'approved' ? vehicle.isApproved : !vehicle.isApproved
      );
    }

    // Vehicle type filter
    if (filters.vehicleType !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.vehicleType === filters.vehicleType);
    }

    setFilteredVehicles(filtered);
  };

  const handleApproveVehicle = async (vehicleId: string) => {
    setActionLoading(vehicleId);
    try {
      const response = await adminAPI.approveVehicle(vehicleId);
      if (response.data.success) {
        toast.success('Vehicle approved successfully');
        fetchVehicles();
      }
    } catch (error) {
      toast.error('Failed to approve vehicle');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectVehicle = async (vehicleId: string) => {
    setActionLoading(vehicleId);
    try {
      const response = await adminAPI.rejectVehicle(vehicleId, { reason: 'Documents not verified' });
      if (response.data.success) {
        toast.success('Vehicle rejected successfully');
        fetchVehicles();
      }
    } catch (error) {
      toast.error('Failed to reject vehicle');
    } finally {
      setActionLoading(null);
    }
  };

  const openImageGallery = (vehicle: Vehicle, startIndex: number = 0) => {
    setSelectedVehicle(vehicle);
    setCurrentImageIndex(startIndex);
    setIsImageModalOpen(true);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedVehicle) return;
    
    const totalImages = selectedVehicle.photos.length;
    if (direction === 'prev') {
      setCurrentImageIndex(prev => prev > 0 ? prev - 1 : totalImages - 1);
    } else {
      setCurrentImageIndex(prev => prev < totalImages - 1 ? prev + 1 : 0);
    }
  };

  const openConfirmModal = (type: string, vehicleId: string) => {
    setConfirmAction({ type, vehicleId });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    const { type, vehicleId } = confirmAction;
    
    switch (type) {
      case 'approve':
        handleApproveVehicle(vehicleId);
        break;
      case 'reject':
        handleRejectVehicle(vehicleId);
        break;
    }
    
    setConfirmAction(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700 border-green-200';
      case 'assigned': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'in_transit': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Vehicle Management</h1>
          <p className="text-slate-600">Review and approve vehicle registrations</p>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[
            { label: 'Total Vehicles', value: vehicles.length, color: 'blue', icon: TruckIcon },
            { label: 'Approved', value: vehicles.filter(v => v.isApproved).length, color: 'green', icon: CheckCircleIcon },
            { label: 'Pending', value: vehicles.filter(v => !v.isApproved).length, color: 'orange', icon: DocumentTextIcon },
            { label: 'Available', value: vehicles.filter(v => v.status === 'available').length, color: 'emerald', icon: TruckIcon }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search vehicles..."
                value={filters.search}
                onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                className="pl-10"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="in_transit">In Transit</option>
            </select>

            <select
              value={filters.approval}
              onChange={(e) => setFilters(prev => ({ ...prev, approval: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Approvals</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>

            <select
              value={filters.vehicleType}
              onChange={(e) => setFilters(prev => ({ ...prev, vehicleType: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="2-wheel">2-wheel</option>
              <option value="4-wheel">4-wheel</option>
              <option value="6-wheel">6-wheel</option>
              <option value="10-wheel">10-wheel</option>
              <option value="14-wheel">14-wheel</option>
              <option value="18-wheel">18-wheel</option>
              <option value="20-wheel">20-wheel</option>
            </select>
          </div>
        </motion.div>

        {/* Vehicles Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredVehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Vehicle Photo */}
                <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                  {vehicle.photos.length > 0 ? (
                    <img
                      src={vehicle.photos[0].url}
                      alt={vehicle.vehicleNumber}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => openImageGallery(vehicle, 0)}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <TruckIcon className="h-16 w-16 text-slate-400" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border backdrop-blur-sm ${getStatusColor(vehicle.status)}`}>
                      <span className="text-sm font-medium capitalize">{vehicle.status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Approval Badge */}
                  <div className="absolute top-4 right-4">
                    {vehicle.isApproved ? (
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200 backdrop-blur-sm">
                        <span className="text-xs font-medium">Approved</span>
                      </div>
                    ) : (
                      <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full border border-orange-200 backdrop-blur-sm">
                        <span className="text-xs font-medium">Pending</span>
                      </div>
                    )}
                  </div>

                  {/* Photo Count */}
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded-full flex items-center space-x-1">
                      <PhotoIcon className="h-3 w-3" />
                      <span className="text-xs">{vehicle.photos.length}/6</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Vehicle Header */}
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{vehicle.vehicleNumber}</h3>
                    <p className="text-slate-600">{vehicle.ownerName}</p>
                  </div>

                  {/* Specifications */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-slate-600 text-xs mb-1">Type</p>
                      <p className="font-semibold text-slate-900 text-sm">{vehicle.vehicleType}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-slate-600 text-xs mb-1">Size</p>
                      <p className="font-semibold text-slate-900 text-sm">{vehicle.vehicleSize} ft</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-slate-600 text-xs mb-1">Weight</p>
                      <p className="font-semibold text-slate-900 text-sm">{vehicle.vehicleWeight}T</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-slate-600 text-xs mb-1">Limit</p>
                      <p className="font-semibold text-slate-900 text-sm">{vehicle.passingLimit}T</p>
                    </div>
                  </div>

                  {/* Operating Area */}
                  <div className="mb-6">
                    <p className="text-slate-600 text-sm mb-2 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      Operating Area
                    </p>
                    <div className="bg-slate-50 rounded-lg p-3">
                      {/* <p className="font-medium text-slate-900 text-sm">{vehicle.preferredOperatingArea.place}</p> */}
                      {/* <p className="text-slate-600 text-xs">{vehicle.preferredOperatingArea.district}, {vehicle.preferredOperatingArea.state}</p> */}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setIsModalOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      icon={<EyeIcon className="h-4 w-4" />}
                    >
                      View Details
                    </Button>

                    {!vehicle.isApproved && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => openConfirmModal('approve', vehicle._id)}
                          loading={actionLoading === vehicle._id}
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          icon={<CheckCircleIcon className="h-4 w-4" />}
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => openConfirmModal('reject', vehicle._id)}
                          loading={actionLoading === vehicle._id}
                          variant="danger"
                          size="sm"
                          className="flex-1"
                          icon={<XCircleIcon className="h-4 w-4" />}
                        >
                          Reject
                        </Button>
                      </div>
                    )}

                    {vehicle.photos.length > 0 && (
                      <Button
                        onClick={() => openImageGallery(vehicle)}
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        icon={<PhotoIcon className="h-4 w-4" />}
                      >
                        View Photos ({vehicle.photos.length})
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Vehicle Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Vehicle Details"
          size="xl"
        >
          {selectedVehicle && (
            <div className="space-y-6">
              {/* Owner Information */}
              {/* <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Vehicle Owner</h3>
                <div className="text-blue-700 text-sm space-y-1">
                  <p className="font-medium">{selectedVehicle.ownerName}</p>
                  <p>Email: {selectedVehicle.ownerId}</p>
                  <p>Phone: {selectedVehicle.ownerId.phone}</p>
                  <p>WhatsApp: {selectedVehicle.ownerId.whatsappNumber}</p>
                </div>
              </div> */}

              {/* Vehicle Specifications */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Vehicle Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Vehicle Number</p>
                    <p className="font-semibold text-slate-900">{selectedVehicle.vehicleNumber}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Type</p>
                    <p className="font-semibold text-slate-900">{selectedVehicle.vehicleType}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Size</p>
                    <p className="font-semibold text-slate-900">{selectedVehicle.vehicleSize} ft</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Weight</p>
                    <p className="font-semibold text-slate-900">{selectedVehicle.vehicleWeight} Tons</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Passing Limit</p>
                    <p className="font-semibold text-slate-900">{selectedVehicle.passingLimit} Tons</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Dimensions</p>
                    <p className="font-semibold text-slate-900">{selectedVehicle.dimensions.length} × {selectedVehicle.dimensions.height} ft</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Body Type</p>
                    <p className="font-semibold text-slate-900">{selectedVehicle.isOpen ? 'Open' : 'Closed'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Tarpaulin</p>
                    <p className="font-semibold text-slate-900 capitalize">{selectedVehicle.tarpaulin}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Trailer Type</p>
                    <p className="font-semibold text-slate-900">{selectedVehicle.trailerType || 'None'}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Photos */}
              {selectedVehicle.photos.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Vehicle Photos ({selectedVehicle.photos.length}/6)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {selectedVehicle.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.url}
                          alt={photo.type}
                          className="w-full h-24 object-cover rounded-lg border border-slate-200 group-hover:opacity-80 transition-opacity cursor-pointer"
                          onClick={() => openImageGallery(selectedVehicle, index)}
                        />
                        <div className="absolute bottom-1 left-1 right-1">
                          <span className="text-xs bg-black bg-opacity-70 text-white px-1 py-0.5 rounded text-center block capitalize">
                            {photo.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval Actions */}
              {!selectedVehicle.isApproved && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                  <h3 className="font-semibold text-orange-800 mb-4">Vehicle Approval</h3>
                  <p className="text-orange-700 text-sm mb-4">
                    Review all vehicle details and photos before approving. Ensure all documents are valid and vehicle information is accurate.
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => {
                        handleApproveVehicle(selectedVehicle._id);
                        setIsModalOpen(false);
                      }}
                      loading={actionLoading === selectedVehicle._id}
                      variant="secondary"
                      className="flex-1"
                      icon={<CheckCircleIcon className="h-4 w-4" />}
                    >
                      Approve Vehicle
                    </Button>
                    <Button
                      onClick={() => {
                        handleRejectVehicle(selectedVehicle._id);
                        setIsModalOpen(false);
                      }}
                      loading={actionLoading === selectedVehicle._id}
                      variant="danger"
                      className="flex-1"
                      icon={<XCircleIcon className="h-4 w-4" />}
                    >
                      Reject Vehicle
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Image Gallery Modal */}
        <ImageGalleryModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          images={selectedVehicle?.photos || []}
          currentIndex={currentImageIndex}
          onNavigate={navigateImage}
        />

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmAction}
          title={confirmAction?.type === 'approve' ? 'Approve Vehicle' : 'Reject Vehicle'}
          message={
            confirmAction?.type === 'approve' 
              ? 'Are you sure you want to approve this vehicle? The owner will be notified.'
              : 'Are you sure you want to reject this vehicle? The owner will be notified.'
          }
          confirmText={confirmAction?.type === 'approve' ? 'Approve' : 'Reject'}
          type={confirmAction?.type === 'reject' ? 'danger' : 'info'}
        />
      </div>
    </div>
  );
};