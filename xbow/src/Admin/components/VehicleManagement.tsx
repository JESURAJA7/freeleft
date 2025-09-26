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
  MapPinIcon,
  CogIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { adminAPI } from '../services/adminApi';
import toast from 'react-hot-toast';
import type { Vehicle } from '../../types';

export const VehicleManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isLimitsModalOpen, setIsLimitsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    approval: 'all',
    vehicleType: 'all'
  });

  const [approvalSettings, setApprovalSettings] = useState({
    maxLoadsAllowed: 10
  });

  const [limitsForm, setLimitsForm] = useState({
    maxLoadsAllowed: 10
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, filters]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
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

    if (filters.search) {
      filtered = filtered.filter(vehicle =>
        vehicle.ownerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        vehicle.vehicleNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        (Array.isArray(vehicle.operatingAreas) &&
          vehicle.operatingAreas.some(area =>
            area.place.toLowerCase().includes(filters.search.toLowerCase())
          ))
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === filters.status);
    }

    if (filters.approval !== 'all') {
      filtered = filtered.filter(vehicle =>
        filters.approval === 'approved' ? vehicle.isApproved : !vehicle.isApproved
      );
    }

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
        toast.success(`Vehicle approved with ${approvalSettings.maxLoadsAllowed} load limit`);
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

  const handleUpdateVehicleLimits = async () => {
    if (!selectedVehicle) return;

    try {
      setActionLoading(selectedVehicle._id);
      await adminAPI.updateVehicleLimits(selectedVehicle._id, limitsForm);
      toast.success('Vehicle limits updated successfully');
      setIsLimitsModalOpen(false);
      fetchVehicles();
    } catch (error) {
      toast.error('Failed to update vehicle limits');
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
          <p className="text-slate-600">Review vehicles, approve registrations, and set load limits</p>
        </motion.div>

        {/* Approval Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Default Vehicle Approval Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Max Loads Allowed per Vehicle
              </label>
              <input
                type="number"
                value={approvalSettings.maxLoadsAllowed}
                onChange={(e) => setApprovalSettings(prev => ({ ...prev, maxLoadsAllowed: Number(e.target.value) }))}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                min="1"
                max="50"
              />
              <p className="text-xs text-slate-500 mt-1">Applied to newly approved vehicles</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
                transition={{ delay: 0.3 + index * 0.1 }}
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
          transition={{ delay: 0.4 }}
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
          transition={{ delay: 0.5 }}
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
                {/* Vehicle Photo Carousel */}
                <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                  {vehicle.photos.length > 0 ? (
                    <div className="relative h-full">
                      <img
                        src={vehicle.photos[0].url}
                        alt={vehicle.vehicleNumber}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => openImageGallery(vehicle, 0)}
                      />

                      {/* Image Navigation */}
                      {vehicle.photos.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 hover:opacity-100 transition-opacity">
                          <button className="bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70">
                            <ChevronLeftIcon className="h-4 w-4" />
                          </button>
                          <button className="bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70">
                            <ChevronRightIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
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

                  {/* Load Limits for Approved Vehicles */}
                  {vehicle.isApproved && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DocumentTextIcon className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-800">Load Limit</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">
                            {vehicle.loadsCompleted || 0} / {vehicle.maxLoadsAllowed || 0}
                          </p>
                          <p className="text-xs text-emerald-500">Completed / Allowed</p>
                        </div>
                      </div>
                    </div>
                  )}

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

                  {/* Operating Areas */}
                  <div className="mb-6">
                    <p className="text-slate-600 text-sm mb-2 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      Operating Areas
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(vehicle.operatingAreas) && vehicle.operatingAreas.length > 0 ? (
                        <>
                          {vehicle.operatingAreas.slice(0, 2).map((area, idx) => (
                            <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                              {area.place}, {area.state}
                            </span>
                          ))}
                          {vehicle.operatingAreas.length > 2 && (
                            <span className="text-xs text-slate-500">
                              +{vehicle.operatingAreas.length - 2} more
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No operating areas specified</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setIsModalOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        icon={<EyeIcon className="h-4 w-4" />}
                      >
                        View Details
                      </Button>

                      {vehicle.photos.length > 0 && (
                        <Button
                          onClick={() => openImageGallery(vehicle)}
                          variant="ghost"
                          size="sm"
                          icon={<PhotoIcon className="h-4 w-4" />}
                        >
                          Photos ({vehicle.photos.length})
                        </Button>
                      )}
                    </div>

                    {vehicle.isApproved && (
                      <Button
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setLimitsForm({
                            maxLoadsAllowed: vehicle.maxLoadsAllowed || 10
                          });
                          setIsLimitsModalOpen(true);
                        }}
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        icon={<CogIcon className="h-4 w-4" />}
                      >
                        Manage Load Limits
                      </Button>
                    )}

                    {!vehicle.isApproved && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleApproveVehicle(vehicle._id)}
                          loading={actionLoading === vehicle._id}
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          icon={<CheckCircleIcon className="h-4 w-4" />}
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRejectVehicle(vehicle._id)}
                          loading={actionLoading === vehicle._id}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          icon={<XCircleIcon className="h-4 w-4" />}
                        >
                          Reject
                        </Button>
                      </div>
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
          {selectedVehicle ? (
            <div className="space-y-6">
              {/* Owner Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Vehicle Owner</h3>
                <div className="text-blue-700 text-sm space-y-1">
                  <p className="font-medium">{selectedVehicle.ownerName}</p>
                  <p>Vehicle Number: {selectedVehicle.vehicleNumber}</p>
                </div>
              </div>

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
                    <p className="font-semibold text-slate-900">{selectedVehicle.dimensions?.length || 'N/A'} × {selectedVehicle.dimensions?.height || 'N/A'} ft</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Body Type</p>
                    <p className="font-semibold text-slate-900 capitalize">{selectedVehicle.vehicleType}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Tarpaulin</p>
                    <p className="font-semibold text-slate-900 capitalize">{selectedVehicle.tarpaulin || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Trailer Type</p>
                    <p className="font-semibold text-slate-900">{selectedVehicle.trailerType || 'None'}</p>
                  </div>
                </div>
              </div>

              {/* Operating Areas */}

              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Operating Areas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.isArray(selectedVehicle.operatingAreas) && selectedVehicle.operatingAreas.length > 0 ? (
                    selectedVehicle.operatingAreas.map((area, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <MapPinIcon className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-900">
                            {area.place}, {area.district}, {area.state}
                          </span>
                        </div>
                        {area.coordinates && (
                          <div className="text-xs text-slate-500 mt-2">
                            Coordinates: {area.coordinates.latitude}, {area.coordinates.longitude}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="text-sm text-slate-500 italic">No operating areas specified</div>
                    </div>
                  )}
                </div>
              </div>
             {/* Vehicle Photos Gallery */}
{selectedVehicle.photos.length > 0 && (
  <div>
    <h3 className="font-semibold text-slate-900 mb-4">
      Vehicle Photos ({selectedVehicle.photos.length}/6)
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {selectedVehicle.photos.map((photo, index) => (
        <div key={index} className="relative group">
          <img
            src={photo.url}
            alt={photo.type || 'Vehicle photo'}
            className="w-full h-24 object-cover rounded-lg border border-slate-200 group-hover:opacity-80 transition-opacity cursor-pointer"
            onClick={() => openImageGallery(selectedVehicle, index)}
          />
          <div className="absolute bottom-1 left-1 right-1">
            <span className="text-xs bg-black bg-opacity-70 text-white px-1 py-0.5 rounded text-center block capitalize">
              {photo.type ? photo.type.replace('_', ' ') : 'Photo'}
            </span>
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
            <EyeIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5" />
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
                    Review all vehicle details and photos before approving. Vehicle will be assigned {approvalSettings.maxLoadsAllowed} load limit.
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
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                      icon={<XCircleIcon className="h-4 w-4" />}
                    >
                      Reject Vehicle
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">No vehicle data available</p>
            </div>
          )}
        </Modal>

        {/* Image Gallery Modal */}
        <Modal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          title=""
          size="xl"
          fullScreen={true}
        >
          {selectedVehicle && selectedVehicle.photos.length > 0 && (
            <div className="h-full flex flex-col bg-black">
              {/* Header */}
              <div className="bg-black text-white p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedVehicle.vehicleNumber}</h2>
                  <p className="text-gray-300">
                    Photo {currentImageIndex + 1} of {selectedVehicle.photos.length}
                  </p>
                </div>
                <Button
                  onClick={() => setIsImageModalOpen(false)}
                  variant="ghost"
                  className="text-white hover:bg-gray-800"
                >
                  <XCircleIcon className="h-6 w-6" />
                </Button>
              </div>

              {/* Image Display */}
              <div className="flex-1 flex items-center justify-center relative">
                <img
                  src={selectedVehicle.photos[currentImageIndex].url}
                  alt={selectedVehicle.photos[currentImageIndex].type}
                  className="max-h-full max-w-full object-contain"
                />

                {/* Navigation Buttons */}
                {selectedVehicle.photos.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateImage('prev')}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => navigateImage('next')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <ChevronRightIcon className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Image Info */}
              <div className="bg-black text-white p-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    {/* <p className="font-medium capitalize">
                      {selectedVehicle.photos[currentImageIndex].type.replace('_', ' ')}
                    </p> */}
                  </div>
                  <div className="flex space-x-2">
                    {selectedVehicle.photos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex ? 'bg-white' : 'bg-gray-600'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Vehicle Limits Modal */}
        <Modal
          isOpen={isLimitsModalOpen}
          onClose={() => setIsLimitsModalOpen(false)}
          title="Manage Vehicle Load Limits"
          size="md"
        >
          {selectedVehicle ? (
            <div className="space-y-6">
              {/* Vehicle Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-slate-900 mb-2">{selectedVehicle.vehicleNumber}</h3>
                <p className="text-slate-600">{selectedVehicle.ownerName}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedVehicle.vehicleType} • {selectedVehicle.vehicleSize}ft
                </p>
              </div>

              {/* Current Stats */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h4 className="font-medium text-emerald-800 mb-3">Current Performance</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-emerald-600">Loads Completed:</span>
                    <p className="font-semibold text-emerald-800">{selectedVehicle.loadsCompleted || 0}</p>
                  </div>
                  <div>
                    <span className="text-emerald-600">Current Limit:</span>
                    <p className="font-semibold text-emerald-800">{selectedVehicle.maxLoadsAllowed || 0}</p>
                  </div>
                </div>
              </div>

              {/* Limits Form */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Maximum Loads Allowed
                </label>
                <input
                  type="number"
                  value={limitsForm.maxLoadsAllowed}
                  onChange={(e) => setLimitsForm(prev => ({ ...prev, maxLoadsAllowed: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                  min="1"
                  max="50"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Set how many loads this vehicle can handle
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <Button
                  onClick={() => setIsLimitsModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateVehicleLimits}
                  loading={actionLoading === selectedVehicle._id}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  icon={<CogIcon className="h-4 w-4" />}
                >
                  Update Limits
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">No vehicle selected</p>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};