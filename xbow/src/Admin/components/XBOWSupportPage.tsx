import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  MapPinIcon,
  TruckIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  PhotoIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  StarIcon,
  ScaleIcon,
  HandRaisedIcon,
  ShieldCheckIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import type { Load, Vehicle, User } from '../../types/index';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { adminAPI } from '../services/adminApi';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from './common/Pagination'; // Add this import
import toast from 'react-hot-toast';

export const XBOWSupportPage: React.FC = () => {
  const { user } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [filteredLoads, setFilteredLoads] = useState<Load[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [matchedVehicles, setMatchedVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isLoadDetailsModalOpen, setIsLoadDetailsModalOpen] = useState(false);
  const [isVehicleMatchingModalOpen, setIsVehicleMatchingModalOpen] = useState(false);
  const [isAssignVehicleModalOpen, setIsAssignVehicleModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignmentMessage, setAssignmentMessage] = useState('');

  // Add pagination hook
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems,
    handlePageChange,
    handleItemsPerPageChange,
    resetPagination,
    totalItems,
  } = usePagination({ items: filteredLoads, initialItemsPerPage: 10 });

  useEffect(() => {
    fetchXBOWLoads();
  }, []);

  useEffect(() => {
    filterLoads();
    resetPagination();
  }, [loads, searchTerm, statusFilter, priorityFilter]);

  const fetchXBOWLoads = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getXBOWLoads();
      if (response.data.success) {
        setLoads(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching XBOW loads:', error);
      toast.error('Failed to fetch XBOW support loads');
      setLoads([]);
    } finally {
      setLoading(false);
    }
  };

  const filterLoads = () => {
    let filtered = [...loads];

    if (searchTerm) {
      filtered = filtered.filter(load =>
        load.loadingLocation.place.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.unloadingLocation.place.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.loadProviderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (load.materials && load.materials.some(material =>
          material.name.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(load => load.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      const now = new Date();
      const loadingDate = new Date();

      switch (priorityFilter) {
        case 'urgent':
          loadingDate.setDate(now.getDate() + 1);
          filtered = filtered.filter(load => new Date(load.loadingDate) <= loadingDate);
          break;
        case 'high':
          loadingDate.setDate(now.getDate() + 3);
          filtered = filtered.filter(load => {
            const date = new Date(load.loadingDate);
            return date > new Date(now.getTime() + 86400000) && date <= loadingDate;
          });
          break;
        case 'normal':
          loadingDate.setDate(now.getDate() + 7);
          filtered = filtered.filter(load => {
            const date = new Date(load.loadingDate);
            return date > new Date(now.getTime() + 3 * 86400000) && date <= loadingDate;
          });
          break;
      }
    }

    setFilteredLoads(filtered);
  };

  const findMatchedVehicles = async (load: Load) => {
    try {
      setMatchingLoading(true);
      setSelectedLoad(load);

      const response = await adminAPI.findMatchedVehicles(load._id);
      if (response.data.success) {
        setMatchedVehicles(response.data.data);
        setIsVehicleMatchingModalOpen(true);
      }
    } catch (error: any) {
      console.error('Error finding matched vehicles:', error);
      toast.error('Failed to find matched vehicles');
    } finally {
      setMatchingLoading(false);
    }
  };

  const assignVehicleToLoad = async () => {
    if (!selectedLoad || !selectedVehicle) return;

    try {
      setAssigningLoading(true);

      // Prepare the required data
      const assignmentData = {
        loadId: selectedLoad._id,
        vehicleId: selectedVehicle._id,
        agreedPrice: selectedVehicle.bidPrice || 0, // Use bidPrice or fallback
        // Ensure we pass a string id for vehicleOwnerId (owner object may be present)
        vehicleOwnerId: typeof selectedVehicle.ownerId === 'string'
          ? selectedVehicle.ownerId
          : (selectedVehicle.ownerId as any)?._id,
        // Ensure loadProviderId is a string id (handle object or string)
        loadProviderId: typeof selectedLoad.loadProviderId === 'string'
          ? selectedLoad.loadProviderId
          : (selectedLoad.loadProviderId as any)?._id,
        message: assignmentMessage,
      };

      const response = await adminAPI.assignVehicleToLoad(assignmentData);

      if (response.data.success) {
        toast.success('Vehicle assigned successfully!');
        setLoads(prevLoads =>
          prevLoads.map(load =>
            load._id === selectedLoad._id
              ? {
                ...load,
                status: 'assigned',
                assignedVehicleId: selectedVehicle._id,
                agreedPrice: assignmentData.agreedPrice
              }
              : load
          )
        );
        setIsAssignVehicleModalOpen(false);
        setIsVehicleMatchingModalOpen(false);
        setAssignmentMessage('');
        setSelectedVehicle(null);
      }
    } catch (error: any) {
      console.error('Error assigning vehicle:', error);
      toast.error('Failed to assign vehicle');
    } finally {
      setAssigningLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'assigned': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'enroute': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (loadingDate: string) => {
    const now = new Date();
    const loading = new Date(loadingDate);
    const diffDays = Math.ceil((loading.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'bg-red-100 text-red-700 border-red-200';
    if (diffDays <= 3) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (diffDays <= 7) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getPriorityLabel = (loadingDate: string) => {
    const now = new Date();
    const loading = new Date(loadingDate);
    const diffDays = Math.ceil((loading.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'Urgent';
    if (diffDays <= 3) return 'High';
    if (diffDays <= 7) return 'Normal';
    return 'Low';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'posted': return DocumentTextIcon;
      case 'assigned': return CheckCircleIcon;
      case 'enroute': return TruckIcon;
      case 'delivered': return CheckCircleIcon;
      case 'completed': return CheckCircleIcon;
      default: return ClockIcon;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">XBOW Support Dashboard</h1>
              <p className="text-slate-600">Manage loads with XBOW support and assign vehicles</p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search loads, locations, providers..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="pl-10"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="posted">Posted</option>
                <option value="assigned">Assigned</option>
                <option value="enroute">En Route</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent (≤1 day)</option>
                <option value="high">High (2-3 days)</option>
                <option value="normal">Normal (4-7 days)</option>
              </select>
            </div>

            <Button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
              variant="outline"
              icon={<XCircleIcon className="h-4 w-4" />}
            >
              Clear Filters
            </Button>
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
            {
              label: 'Total XBOW Loads',
              value: loads.length,
              color: 'purple',
              icon: ShieldCheckIcon
            },
            {
              label: 'Pending Assignment',
              value: loads.filter(l => l.status === 'posted').length,
              color: 'blue',
              icon: ClockIcon
            },
            {
              label: 'Active Loads',
              value: loads.filter(l => ['assigned', 'enroute'].includes(l.status)).length,
              color: 'orange',
              icon: TruckIcon
            },
            {
              label: 'Completed',
              value: loads.filter(l => l.status === 'completed').length,
              color: 'green',
              icon: CheckCircleIcon
            }
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

        {/* Loads Grid - Use paginatedItems instead of filteredLoads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
        >
          <AnimatePresence>
            {paginatedItems.map((load, index) => {
              const StatusIcon = getStatusIcon(load.status);
              const totalWeight = load.materials?.reduce((sum, material) => sum + material.totalWeight, 0) || 0;
              const priorityLabel = getPriorityLabel(load.loadingDate);

              return (
                <motion.div
                  key={load._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Load Header */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(load.status)}`}>
                          <StatusIcon className="h-4 w-4" />
                          <span className="text-sm font-medium capitalize">{load.status}</span>
                        </div>
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getPriorityColor(load.loadingDate)}`}>
                          <ExclamationTriangleIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">{priorityLabel}</span>
                        </div>
                      </div>
                      <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
                        <span className="text-xs font-medium flex items-center">
                          <ShieldCheckIcon className="h-3 w-3 mr-1" />
                          XBOW Support
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Load #{load._id.slice(-6).toUpperCase()}</span>
                      <span>{new Date(load.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Load Provider Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Load Provider</span>
                      </div>
                      <p className="font-semibold text-slate-900">{load.loadProviderName}</p>
                    </div>

                    {/* Route */}
                    <div className="mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPinIcon className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-slate-900">{load.loadingLocation.place}</span>
                          </div>
                          <p className="text-sm text-slate-600">{load.loadingLocation.district}, {load.loadingLocation.state}</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-0.5 bg-slate-300 mb-1"></div>
                          <TruckIcon className="h-4 w-4 text-slate-400" />
                          <div className="w-8 h-0.5 bg-slate-300 mt-1"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPinIcon className="h-4 w-4 text-emerald-600" />
                            <span className="font-semibold text-slate-900">{load.unloadingLocation.place}</span>
                          </div>
                          <p className="text-sm text-slate-600">{load.unloadingLocation.district}, {load.unloadingLocation.state}</p>
                        </div>
                      </div>
                    </div>

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <TruckIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Vehicle</span>
                        </div>
                        <p className="text-sm text-blue-700">{load.vehicleRequirement.size}ft {load.vehicleRequirement.vehicleType}</p>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <ScaleIcon className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-800">Weight</span>
                        </div>
                        <p className="text-sm text-emerald-700">{totalWeight.toLocaleString()} kg</p>
                      </div>

                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CalendarIcon className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-800">Loading</span>
                        </div>
                        <p className="text-sm text-orange-700">{new Date(load.loadingDate).toLocaleDateString()}</p>
                      </div>

                      {/* <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CurrencyRupeeIcon className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">Commission</span>
                        </div>
                        <p className="text-sm text-purple-700">₹{load.commissionAmount?.toLocaleString() || '2,500'}</p>
                      </div> */}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => {
                            setSelectedLoad(load);
                            setIsLoadDetailsModalOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                          icon={<EyeIcon className="h-4 w-4" />}
                        >
                          View Details
                        </Button>
                        <Button
                          onClick={() => findMatchedVehicles(load)}
                          loading={matchingLoading && selectedLoad?._id === load._id}
                          disabled={load.status !== 'posted'}
                          className="bg-purple-600 hover:bg-purple-700"
                          size="sm"
                          icon={<TruckIcon className="h-4 w-4" />}
                        >
                          Find Vehicles
                        </Button>
                      </div>

                      {load.status === 'assigned' && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                          <div className="flex items-center space-x-2">
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Vehicle Assigned</span>
                          </div>
                          <p className="text-xs text-green-600 mt-1">Load is now being handled by assigned vehicle</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Add Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />

        {/* Empty State */}
        {filteredLoads.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <ShieldCheckIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {loads.length === 0 ? 'No XBOW Support Loads' : 'No loads match your filters'}
            </h3>
            <p className="text-slate-600">
              {loads.length === 0
                ? 'XBOW support loads will appear here when load providers request assistance'
                : 'Try adjusting your search criteria or filters'
              }
            </p>
          </motion.div>
        )}

        {/* Rest of your modals remain the same */}
        <Modal
          isOpen={isLoadDetailsModalOpen}
          onClose={() => setIsLoadDetailsModalOpen(false)}
          title="Load Details"
          size="xl"
        >
          {selectedLoad && (
            <div className="space-y-6">
              {/* Load Provider Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Load Provider Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-blue-700 font-medium">Load ID:</span>
                    <p className="text-slate-900 font-mono">#{selectedLoad._id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Company:</span>
                    <p className="text-slate-900">
                      {typeof selectedLoad.loadProviderId === 'object'
                        ? (selectedLoad.loadProviderId as User).companyName
                        : selectedLoad.loadProviderName}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Contact Name:</span>
                    <p className="text-slate-900">
                      {typeof selectedLoad.loadProviderId === 'object'
                        ? (selectedLoad.loadProviderId as User).name
                        : selectedLoad.loadProviderName}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Phone Number:</span>
                    <p className="text-slate-900">
                      {typeof selectedLoad.loadProviderId === 'object'
                        ? (selectedLoad.loadProviderId as User).phone
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">WhatsApp Number:</span>
                    <p className="text-slate-900">
                      {typeof selectedLoad.loadProviderId === 'object'
                        ? (selectedLoad.loadProviderId as User).whatsappNumber
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Email:</span>
                    <p className="text-slate-900">
                      {typeof selectedLoad.loadProviderId === 'object'
                        ? (selectedLoad.loadProviderId as User).email
                        : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <span className="text-blue-700 font-medium">Created:</span>
                    <p className="text-slate-900">
                      {new Date(selectedLoad.createdAt).toLocaleString()}
                    </p>

                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Status:</span>
                    <p className="text-slate-900 capitalize">{selectedLoad.status}</p>
                  </div>
                </div>
              </div>

              {/* Route Information */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Route Information</h3>
                <div className="flex items-center space-x-6">
                  <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPinIcon className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-800">Loading Point</span>
                    </div>
                    <p className="font-medium text-slate-900">{selectedLoad.loadingLocation.place}</p>
                    <p className="text-sm text-slate-600">{selectedLoad.loadingLocation.district}, {selectedLoad.loadingLocation.state}</p>
                    <p className="text-sm text-slate-500">PIN: {selectedLoad.loadingLocation.pincode}</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <TruckIcon className="h-6 w-6 text-slate-400" />
                  </div>

                  <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPinIcon className="h-4 w-4 text-emerald-600" />
                      <span className="font-semibold text-emerald-800">Delivery Point</span>
                    </div>
                    <p className="font-medium text-slate-900">{selectedLoad.unloadingLocation.place}</p>
                    <p className="text-sm text-slate-600">{selectedLoad.unloadingLocation.district}, {selectedLoad.unloadingLocation.state}</p>
                    <p className="text-sm text-slate-500">PIN: {selectedLoad.unloadingLocation.pincode}</p>
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Materials ({selectedLoad.materials?.length || 0})</h3>
                <div className="space-y-4">
                  {selectedLoad.materials?.map((material, index) => (
                    <div key={index} className="border border-slate-200 rounded-xl p-4 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{material.name}</h4>
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                          {material.totalWeight} kg
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Dimensions:</span>
                          <p className="font-medium">{material.dimensions.length}×{material.dimensions.width}×{material.dimensions.height} ft</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Pack Type:</span>
                          <p className="font-medium capitalize">{material.packType}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Count:</span>
                          <p className="font-medium">{material.totalCount}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Unit Weight:</span>
                          <p className="font-medium">{material.singleWeight} kg</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Vehicle Matching Modal */}
        <Modal
          isOpen={isVehicleMatchingModalOpen}
          onClose={() => setIsVehicleMatchingModalOpen(false)}
          title="Matched Vehicles"
          size="xl"
        >
          {selectedLoad && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <h3 className="font-semibold text-purple-800 mb-2">Finding vehicles for:</h3>
                <p className="text-purple-700">
                  {selectedLoad.loadingLocation.place} → {selectedLoad.unloadingLocation.place}
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  {selectedLoad.vehicleRequirement.size}ft {selectedLoad.vehicleRequirement.vehicleType}
                </p>
              </div>

              {matchedVehicles.length === 0 ? (
                <div className="text-center py-8">
                  <TruckIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No matching vehicles found</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {matchedVehicles.map((vehicle) => (
                    <div
                      key={vehicle._id}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedVehicle?._id === vehicle._id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-slate-300'
                        }`}
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <TruckIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{vehicle.vehicleNumber}</h4>
                            <p className="text-sm text-slate-600">
                              {vehicle.vehicleType} • {vehicle.vehicleSize}ft
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {/* Safe price display - uncomment if needed */}
                          {/* <p className="text-lg font-bold text-emerald-600">
                    {vehicle.estimatedPrice ? `₹${vehicle.estimatedPrice.toLocaleString()}` : 'N/A'}
                  </p> */}
                          {/* <p className="text-xs text-slate-500">{vehicle.distance || 0} km away</p> */}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-slate-600 text-sm">Owner:</span>
                          <p className="font-medium text-slate-900">{vehicle.ownerName}</p>
                        </div>
                        <div>
                          <span className="text-slate-600 text-sm">Location:</span>
                          {vehicle.operatingAreas?.map((area, index) => (
                            <div key={index} className="mb-1">
                              <p className="font-medium text-slate-900">{area.place}</p>
                              <p className="text-sm text-slate-600">
                                {area.district}, {area.state}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div>
                          <span className="text-slate-600 text-sm">Rating:</span>
                          <div className="flex items-center space-x-1">
                            <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                            <span className="font-medium text-slate-900">
                              {vehicle.rating || 'No rating'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-600 text-sm">Status:</span>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${vehicle.status === 'available'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                              }`}
                          >
                            {vehicle.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {vehicle.isApproved && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                              Verified
                            </span>
                          )}
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                            {(vehicle.passingLimit || 0)}T Capacity
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-slate-400 hover:text-blue-600">
                            <PhoneIcon className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-slate-400 hover:text-blue-600">
                            <EnvelopeIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedVehicle && (
                <div className="border-t pt-4">
                  <Button
                    onClick={() => setIsAssignVehicleModalOpen(true)}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    icon={<CheckCircleIcon className="h-4 w-4" />}
                  >
                    Assign Selected Vehicle
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Assign Vehicle Modal */}
        <Modal
          isOpen={isAssignVehicleModalOpen}
          onClose={() => setIsAssignVehicleModalOpen(false)}
          title="Assign Vehicle"
          size="md"
        >
          {selectedVehicle && selectedLoad && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-semibold text-green-800 mb-2">Assignment Confirmation</h3>
                <p className="text-green-700">
                  Assign <strong>{selectedVehicle.vehicleNumber}</strong> to load from{' '}
                  <strong>{selectedLoad.loadingLocation.place}</strong> to{' '}
                  <strong>{selectedLoad.unloadingLocation.place}</strong>
                </p>
                {/* FIXED LINE - Added safe handling for undefined bidPrice */}
                <p className="text-sm text-green-600 mt-2">
                  Estimated Price: ₹{(selectedVehicle.bidPrice || 0).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message to Vehicle Owner (Optional)
                </label>
                <textarea
                  value={assignmentMessage}
                  onChange={(e) => setAssignmentMessage(e.target.value)}
                  placeholder="Add any special instructions or information..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={() => setIsAssignVehicleModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={assignVehicleToLoad}
                  loading={assigningLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  icon={<CheckCircleIcon className="h-4 w-4" />}
                >
                  Confirm Assignment
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};