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
  CameraIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { vehicleAPI } from '../../services/api';
import type { Vehicle } from '../../types/index';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { Calendar } from '../../components/common/Calendar';
import toast from 'react-hot-toast';

interface ExtendedVehicle extends Vehicle {
  trialStartDate?: string;
  trialEndDate?: string;
  isPaid?: boolean;
  remainingTrialDays?: number;
}

export const MyVehiclesPage: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<ExtendedVehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<ExtendedVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<ExtendedVehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
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

  const calculateRemainingTrialDays = (trialEndDate: string): number => {
    const end = new Date(trialEndDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleAPI.getMyVehicles();

      // Transform backend data and add trial information
      const transformedVehicles = response.data.data.map((vehicle: any) => {
        // Calculate trial dates (assuming 7-day trial from creation)
        const trialStart = new Date(vehicle.createdAt);
        const trialEnd = new Date(trialStart);
        trialEnd.setDate(trialStart.getDate() + 7);

        const remainingDays = calculateRemainingTrialDays(trialEnd.toISOString());

        return {
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
          updatedAt: vehicle.updatedAt,
          trialStartDate: trialStart.toISOString(),
          trialEndDate: trialEnd.toISOString(),
          isPaid: vehicle.isPaid || false,
          remainingTrialDays: remainingDays
        };
      });

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
        vehicle.operatingAreas[0].place.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getTrialStatusColor = (remainingDays: number, isPaid: boolean) => {
    if (isPaid) return 'bg-green-100 text-green-700 border-green-200';
    if (remainingDays === 0) return 'bg-red-100 text-red-700 border-red-200';
    if (remainingDays <= 2) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getTrialStatusText = (remainingDays: number, isPaid: boolean) => {
    if (isPaid) return 'Paid Plan';
    if (remainingDays === 0) return 'Trial Expired';
    return `${remainingDays} days left`;
  };

  const updateAvailabilityDate = async (vehicleId: string, newDate: Date) => {
    try {
      // Here you would call your API to update the availability date
      await vehicleAPI.updateVehicleAvailability(vehicleId, { availability: newDate.toISOString() });
      
      // Update local state
      setVehicles(prevVehicles =>
        prevVehicles.map(vehicle =>
          vehicle.id === vehicleId
            ? { ...vehicle, availability: newDate.toISOString() }
            : vehicle
        )
      );

      toast.success('Availability date updated successfully');
      setIsCalendarOpen(false);
      setEditingVehicleId(null);
    } catch (error: any) {
      console.error('Error updating availability date:', error);
      toast.error(error.response?.data?.message || 'Failed to update availability date');
    }
  };

  const handlePayment = async (vehicleId: string) => {
    try {
      // Here you would integrate with your payment system
      // For now, we'll simulate a payment process
      toast.loading('Processing payment...', { id: 'payment' });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update vehicle to paid status
      setVehicles(prevVehicles =>
        prevVehicles.map(vehicle =>
          vehicle.id === vehicleId
            ? { ...vehicle, isPaid: true, remainingTrialDays: 0 }
            : vehicle
        )
      );

      toast.success('Payment successful! Your vehicle is now on the paid plan.', { id: 'payment' });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.', { id: 'payment' });
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
          className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8"
        >
          {[
            { label: 'Total Vehicles', value: vehicles.length, color: 'blue', icon: TruckIcon },
            { label: 'Available', value: vehicles.filter(v => v.status === 'available').length, color: 'green', icon: CheckCircleIcon },
            { label: 'Assigned', value: vehicles.filter(v => v.status === 'assigned').length, color: 'yellow', icon: ClockIcon },
            { label: 'Trial Active', value: vehicles.filter(v => !v.isPaid && v.remainingTrialDays! > 0).length, color: 'orange', icon: ExclamationTriangleIcon },
            { label: 'Paid Plans', value: vehicles.filter(v => v.isPaid).length, color: 'emerald', icon: CreditCardIcon }
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
            {filteredVehicles.map((vehicle, index) => (
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

                  {/* Trial Status Badge */}
                  <div className="absolute top-4 left-4">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border backdrop-blur-sm ${getTrialStatusColor(vehicle.remainingTrialDays!, vehicle.isPaid!)}`}>
                      <CreditCardIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">{getTrialStatusText(vehicle.remainingTrialDays!, vehicle.isPaid!)}</span>
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

                  {/* Trial Warning */}
                  {!vehicle.isPaid && vehicle.remainingTrialDays! <= 2 && vehicle.remainingTrialDays! > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
                        <p className="text-sm text-orange-700">
                          Trial expires in {vehicle.remainingTrialDays} day{vehicle.remainingTrialDays !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Trial Expired Warning */}
                  {!vehicle.isPaid && vehicle.remainingTrialDays === 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                        <p className="text-sm text-red-700">Trial period has expired</p>
                      </div>
                    </div>
                  )}

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
                  </div>

                  {/* Availability Date with Calendar */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600 text-xs mb-1">Availability Date</p>
                        <p className="font-semibold text-slate-900">
                          {new Date(vehicle.availability).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setEditingVehicleId(vehicle.id);
                          setIsCalendarOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        icon={<CalendarDaysIcon className="h-4 w-4" />}
                      >
                        Change
                      </Button>
                    </div>
                  </div>

                  {/* Operating Area */}
                  <div className="mb-6">
                    <p className="text-slate-600 text-sm mb-2 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      Operating Area
                    </p>
                    {vehicle.operatingAreas && vehicle.operatingAreas.length > 0 ? (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="font-medium text-slate-900">{vehicle.operatingAreas[0].place || "N/A"}</p>
                        <p className="text-slate-600 text-sm">
                          {vehicle.operatingAreas[0].district || "N/A"}, {vehicle.operatingAreas[0].state || "N/A"}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500 italic">No operating areas specified</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    {/* View Details */}
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

                    {/* Payment Button - only show if trial expired or about to expire */}
                    {!vehicle.isPaid && vehicle.remainingTrialDays! <= 0 && (
                      <Button
                        onClick={() => handlePayment(vehicle.id)}
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        icon={<CreditCardIcon className="h-4 w-4" />}
                      >
                        Upgrade to Paid Plan - ₹999/month
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
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

        {/* Calendar Modal */}
        <Modal
          isOpen={isCalendarOpen}
          onClose={() => {
            setIsCalendarOpen(false);
            setEditingVehicleId(null);
          }}
          title="Select Availability Date"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-slate-600">
              Choose when your vehicle will be available for new assignments.
            </p>
            <Calendar
              selectedDate={editingVehicleId ? new Date(vehicles.find(v => v.id === editingVehicleId)?.availability || '') : null}
              onDateSelect={(date) => {
                if (editingVehicleId) {
                  updateAvailabilityDate(editingVehicleId, date);
                }
              }}
              minDate={new Date()}
            />
          </div>
        </Modal>

        {/* Vehicle Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Vehicle Details"
          size="xl"
        >
          {selectedVehicle && (
            <div className="space-y-6">
              {/* Vehicle Header with Trial Status */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedVehicle.vehicleNumber}</h2>
                  <p className="text-slate-600">{selectedVehicle.vehicleType} • {selectedVehicle.vehicleSize} ft</p>
                </div>
                <div className="flex space-x-2">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getTrialStatusColor(selectedVehicle.remainingTrialDays!, selectedVehicle.isPaid!)}`}>
                    <CreditCardIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{getTrialStatusText(selectedVehicle.remainingTrialDays!, selectedVehicle.isPaid!)}</span>
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

              {/* Trial Information */}
              {!selectedVehicle.isPaid && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Trial Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-blue-600 text-sm">Trial Started</p>
                      <p className="font-medium text-blue-800">
                        {new Date(selectedVehicle.trialStartDate!).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-600 text-sm">Trial Ends</p>
                      <p className="font-medium text-blue-800">
                        {new Date(selectedVehicle.trialEndDate!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {selectedVehicle.remainingTrialDays! <= 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <Button
                        onClick={() => handlePayment(selectedVehicle.id)}
                        variant="secondary"
                        icon={<CreditCardIcon className="h-4 w-4" />}
                      >
                        Upgrade to Paid Plan - ₹999/month
                      </Button>
                    </div>
                  )}
                </div>
              )}

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

              {/* Operating Areas */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Operating Areas</h3>
                {selectedVehicle.operatingAreas && selectedVehicle.operatingAreas.length > 0 ? (
                  <div className="space-y-3">
                    {selectedVehicle.operatingAreas.map((area, index) => (
                      <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPinIcon className="h-4 w-4 text-slate-600" />
                          <span className="font-medium text-slate-900">{area.place || "N/A"}</span>
                        </div>
                        <p className="text-slate-600 text-sm ml-6">
                          {area.district || "N/A"}, {area.state || "N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="text-center text-slate-500 italic">
                      No operating areas specified
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
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};