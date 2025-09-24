import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TruckIcon,
  MapPinIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { vehicleAPI } from '../../services/api';
import type { Vehicle } from '../../types/index';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';

export const MyVehiclesPage: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, searchTerm, statusFilter, approvalFilter]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleAPI.getMyVehicles();

      // Transform backend data to match frontend types
      const transformedVehicles = response.data.data.map((vehicle: any) => ({
        id: vehicle._id,
        ownerId: vehicle.ownerId,
        ownerName: vehicle.ownerName,
        vehicleType: vehicle.vehicleType,
        vehicleSize: vehicle.vehicleSize,
        vehicleWeight: vehicle.vehicleWeight,
        dimensions: vehicle.dimensions,
        vehicleNumber: vehicle.vehicleNumber,
        passingLimit: vehicle.passingLimit,
        availability: vehicle.availability,
        bodyType: vehicle.bodyType,
        isOpen: vehicle.bodyType?.toLowerCase() === 'open',
        tarpaulin: vehicle.tarpaulin,
        trailerType: vehicle.trailerType,
        preferredOperatingArea: vehicle.operatingAreas?.[0] || {
          state: '',
          district: '',
          place: ''
        },
        operatingAreas: vehicle.operatingAreas || [],
        photos: vehicle.photos || [],
        status: vehicle.status || 'available',
        isApproved: vehicle.isApproved,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt
      }));

      setVehicles(transformedVehicles);
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    let filtered = [...vehicles];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(vehicle =>
        vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vehicleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.preferredOperatingArea.place.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }

    // Approval filter
    if (approvalFilter !== 'all') {
      filtered = filtered.filter(vehicle =>
        approvalFilter === 'approved' ? vehicle.isApproved : !vehicle.isApproved
      );
    }

    setFilteredVehicles(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700 border-green-200';
      case 'assigned': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'in_transit': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return CheckCircleIcon;
      case 'assigned': return ClockIcon;
      case 'in_transit': return TruckIcon;
      default: return ClockIcon;
    }
  };

  const updateVehicleStatus = async (vehicleId: string, newStatus: string) => {
    try {
      await vehicleAPI.updateVehicleStatus(vehicleId, newStatus);
      toast.success('Vehicle status updated successfully');

      // Update local state
      setVehicles(prevVehicles =>
        prevVehicles.map(vehicle =>
          vehicle.id === vehicleId
            ? { ...vehicle, status: newStatus }
            : vehicle
        )
      );

      // Update selected vehicle if it's the one being modified
      if (selectedVehicle && selectedVehicle.id === vehicleId) {
        setSelectedVehicle({ ...selectedVehicle, status: newStatus });
      }
    } catch (error: any) {
      console.error('Error updating vehicle status:', error);
      toast.error(error.response?.data?.message || 'Failed to update vehicle status');
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
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Vehicles</h1>
            <p className="text-slate-600">Manage your vehicle fleet and track performance</p>
          </div>
          <Link to="/add-vehicle">
            <Button
              variant="secondary"
              icon={<PlusIcon className="h-5 w-5" />}
            >
              Add Vehicle
            </Button>
          </Link>
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
            { label: 'Available', value: vehicles.filter(v => v.status === 'available').length, color: 'green', icon: CheckCircleIcon },
            { label: 'Assigned', value: vehicles.filter(v => v.status === 'assigned').length, color: 'yellow', icon: ClockIcon },
            { label: 'Pending Approval', value: vehicles.filter(v => !v.isApproved).length, color: 'orange', icon: DocumentTextIcon }
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
                value={searchTerm}
                onChange={setSearchTerm}
                className="pl-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="in_transit">In Transit</option>
            </select>

            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Approvals</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>

            <Button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setApprovalFilter('all');
              }}
              variant="outline"
              icon={<XCircleIcon className="h-4 w-4" />}
            >
              Clear
            </Button>
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
            {filteredVehicles.map((vehicle, index) => {
              const StatusIcon = getStatusIcon(vehicle.status);
              return (
                <motion.div
                  key={vehicle.id}
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
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <TruckIcon className="h-16 w-16 text-slate-400" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border backdrop-blur-sm ${getStatusColor(vehicle.status)}`}>
                        <StatusIcon className="h-4 w-4" />
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
                        <CameraIcon className="h-3 w-3" />
                        <span className="text-xs">{vehicle.photos.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Vehicle Header */}
                    <div className="mb-4">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">{vehicle.vehicleNumber}</h3>
                      <p className="text-slate-600">{vehicle.vehicleType} • {vehicle.vehicleSize} ft</p>
                    </div>

                    {/* Specifications */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-600 text-xs mb-1">Weight Capacity</p>
                        <p className="font-semibold text-slate-900">{vehicle.vehicleWeight} Tons</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-600 text-xs mb-1">Passing Limit</p>
                        <p className="font-semibold text-slate-900">{vehicle.passingLimit} Tons</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-600 text-xs mb-1">Body Type</p>
                        <p className="font-semibold text-slate-900 capitalize">{vehicle.vehicleType}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-600 text-xs mb-1">Tarpaulin</p>
                        <p className="font-semibold text-slate-900 capitalize">{vehicle.tarpaulin}</p>
                      </div>
                    </div>

                    {/* Availability */}
                    <div className="bg-slate-50 rounded-lg p-3 mb-4">
                      <p className="text-slate-600 text-xs mb-1">Availability</p>
                      <p className="font-semibold text-slate-900">
                        {new Date(vehicle.availability).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Operating Area */}
                    <div className="mb-6">
                      <p className="text-slate-600 text-sm mb-2 flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        Operating Area
                      </p>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="font-medium text-slate-900">{vehicle.preferredOperatingArea.place}</p>
                        <p className="text-slate-600 text-sm">{vehicle.preferredOperatingArea.district}, {vehicle.preferredOperatingArea.state}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
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

                      {vehicle.isApproved && (
                        <div className="relative">
                          <select
                            value={vehicle.status}
                            onChange={(e) => updateVehicleStatus(vehicle.id, e.target.value)}
                            className="px-3 py-2 border-2 border-emerald-300 rounded-lg text-sm focus:border-emerald-500 focus:outline-none"
                          >
                            <option value="available">Available</option>
                            <option value="assigned">Assigned</option>
                            <option value="in_transit">In Transit</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredVehicles.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <TruckIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {vehicles.length === 0 ? 'No vehicles registered yet' : 'No vehicles match your filters'}
            </h3>
            <p className="text-slate-600 mb-6">
              {vehicles.length === 0
                ? 'Add your first vehicle to start receiving load assignments'
                : 'Try adjusting your search criteria or filters'
              }
            </p>
            {vehicles.length === 0 && (
              <Link to="/add-vehicle">
                <Button icon={<PlusIcon className="h-4 w-4" />}>
                  Add Your First Vehicle
                </Button>
              </Link>
            )}
          </motion.div>
        )}

        {/* Vehicle Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Vehicle Details"
          size="xl"
        >
          {selectedVehicle && (
            <div className="space-y-6">
              {/* Vehicle Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedVehicle.vehicleNumber}</h2>
                  <p className="text-slate-600">{selectedVehicle.vehicleType} • {selectedVehicle.vehicleSize} ft</p>
                </div>
                <div className="flex space-x-2">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(selectedVehicle.status)}`}>
                    <span className="text-sm font-medium capitalize">{selectedVehicle.status.replace('_', ' ')}</span>
                  </div>
                  {selectedVehicle.isApproved ? (
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200">
                      <span className="text-sm font-medium">Approved</span>
                    </div>
                  ) : (
                    <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full border border-orange-200">
                      <span className="text-sm font-medium">Pending Approval</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Specifications Grid */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Vehicle Weight</p>
                    <p className="font-semibold text-slate-900">{selectedVehicle.vehicleWeight} Tons</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Passing Limit</p>
                    <p className="font-semibold text-slate-900">{selectedVehicle.passingLimit} Tons</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Body Type</p>
                    <p className="font-semibold text-slate-900 capitalize">{selectedVehicle.vehicleType}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Tarpaulin</p>
                    <p className="font-semibold text-slate-900 capitalize">{selectedVehicle.tarpaulin}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-1">Availability</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(selectedVehicle.availability).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trailer Information */}
              {selectedVehicle.trailerType && selectedVehicle.trailerType !== 'none' && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Trailer Information</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="font-medium text-blue-800 capitalize">{selectedVehicle.trailerType.replace(/-/g, ' ')}</p>
                    <p className="text-blue-600 text-sm">Specialized trailer equipment available</p>
                  </div>
                </div>
              )}

              {/* Operating Area */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Preferred Operating Area</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPinIcon className="h-4 w-4 text-slate-600" />
                    <span className="font-medium text-slate-900">{selectedVehicle.preferredOperatingArea.place}</span>
                  </div>
                  <p className="text-slate-600 text-sm ml-6">
                    {selectedVehicle.preferredOperatingArea.district}, {selectedVehicle.preferredOperatingArea.state}
                  </p>
                </div>

                {/* Show all operating areas if available */}
                {selectedVehicle.preferredOperatingArea && (
                  <div className="mt-4">
                    <h4 className="font-medium text-slate-900 mb-2">Operating Area:</h4>
                    <div className="bg-slate-100 rounded-lg p-2 mb-2">
                      <p className="text-sm text-slate-700">
                        {selectedVehicle.preferredOperatingArea.place},{" "}
                        {selectedVehicle.preferredOperatingArea.district},{" "}
                        {selectedVehicle.preferredOperatingArea.state}
                      </p>
                    </div>
                  </div>

                )}
              </div>

              {/* Vehicle Photos */}
              {selectedVehicle.photos.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Vehicle Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {selectedVehicle.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.url}
                          alt={`Vehicle photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-slate-200 group-hover:opacity-80 transition-opacity cursor-pointer"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                          <EyeIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Management */}
              {selectedVehicle.isApproved && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h3 className="font-semibold text-emerald-800 mb-3">Update Vehicle Status</h3>
                  <div className="flex space-x-3">
                    {['available', 'assigned', 'in_transit'].map((status) => (
                      <Button
                        key={status}
                        onClick={() => updateVehicleStatus(selectedVehicle.id, status)}
                        variant={selectedVehicle.status === status ? "secondary" : "outline"}
                        size="sm"
                      >
                        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                      </Button>
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