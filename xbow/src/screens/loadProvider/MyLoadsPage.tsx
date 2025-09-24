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

  HandRaisedIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import type { Load } from '../../types/index';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { LoadTimeline } from '../../components/LoadTimeline';
import { MessageModal } from '../../components/MessageModal';
import { VehicleMatchingModal } from '../../components/vehicles/VehicleMatchingModal';
import { RatingModal } from '../../components/Rating/RatingModal';
import { loadApplicationAPI } from '../../services/loadApplicationAPI';
import { vehicleMatchingAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { loadAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { CreateBiddingModal } from '../../components/Bidding/CreateBiddingModal';

export const MyLoadsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loads, setLoads] = useState<Load[]>([]);
  const [filteredLoads, setFilteredLoads] = useState<Load[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isVehicleMatchingModalOpen, setIsVehicleMatchingModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isCreateBiddingModalOpen, setIsCreateBiddingModalOpen] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [assignedVehicle, setAssignedVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchLoads();
  }, []);

  useEffect(() => {
    filterLoads();
  }, [loads, searchTerm, statusFilter, dateFilter]);

  const fetchLoads = async () => {
    try {
      setLoading(true);
      const response = await loadAPI.getMyLoads();

      if (response.data.success) {
        setLoads(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch loads');
      }
    } catch (error: any) {
      console.error('Error fetching loads:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch loads');

      // Fallback to empty array if API fails
      setLoads([]);
    } finally {
      setLoading(false);
    }
  };

  const filterLoads = () => {
    let filtered = [...loads];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(load =>
        load.loadingLocation.place.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.unloadingLocation.place.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (load.materials && load.materials.some(material =>
          material.name.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(load => load.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(load =>
            new Date(load.createdAt) >= filterDate
          );
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(load =>
            new Date(load.createdAt) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(load =>
            new Date(load.createdAt) >= filterDate
          );
          break;
      }
    }

    setFilteredLoads(filtered);
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

  const viewLoadDetails = (load: Load) => {
    setSelectedLoad(load);
    setIsModalOpen(true);
  };

  const updateLoadStatus = async (loadId: string, newStatus: string) => {
    try {
      const response = await loadApplicationAPI.updateLoadStatus(loadId, newStatus);

      if (response.data.success) {
        toast.success('Load status updated successfully');
        // Update the local state to reflect the change
        setLoads(prevLoads =>
          prevLoads.map(load =>
            load._id === loadId ? { ...load, status: newStatus } : load
          )
        );

        // Update selected load if it's the same
        if (selectedLoad?._id === loadId) {
          setSelectedLoad(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        throw new Error(response.data.message || 'Failed to update load status');
      }
    } catch (error: any) {
      console.error('Error updating load status:', error);
      toast.error(error.response?.data?.message || 'Failed to update load status');
    }
  };

  const fetchLoadApplications = async (loadId: string) => {
    try {
      const response = await loadApplicationAPI.getLoadApplications(loadId);
      if (response.data.success) {
        setApplications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const viewLoadTimeline = (load: Load) => {
    setSelectedLoad(load);
    fetchLoadApplications(load._id);
    setIsTimelineModalOpen(true);
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedLoad) return;

    try {
      await loadApplicationAPI.sendMessage(selectedLoad._id, message);
      toast.success('Message sent successfully!');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const deleteLoad = async (loadId: string) => {
    if (!window.confirm('Are you sure you want to delete this load?')) {
      return;
    }

    try {
      // This endpoint would need to be implemented in your backend
      const response = await loadAPI.deleteLoad(loadId);

      if (response.data.success) {
        toast.success('Load deleted successfully');
        // Remove the load from the local state
        setLoads(prevLoads => prevLoads.filter(load => load._id !== loadId));
      } else {
        throw new Error(response.data.message || 'Failed to delete load');
      }
    } catch (error: any) {
      console.error('Error deleting load:', error);
      toast.error(error.response?.data?.message || 'Failed to delete load');
    }
  };

  const handleSelectVehicle = async (vehicleId: string, bidPrice: number) => {
    if (!selectedLoad) return;

    try {
      const response = await vehicleMatchingAPI.selectVehicle(selectedLoad._id, vehicleId, bidPrice);
      if (response.data.success) {
        toast.success('Vehicle selected successfully!');
        // Update the load status in local state
        setLoads(prevLoads =>
          prevLoads.map(load =>
            load._id === selectedLoad._id
              ? { ...load, status: 'assigned', assignedVehicleId: vehicleId }
              : load
          )
        );
        setIsVehicleMatchingModalOpen(false);
      }
    } catch (error: any) {
      console.error('Error selecting vehicle:', error);
      toast.error('Failed to select vehicle');
    }
  };

  const handleSendMessageToVehicle = async (vehicleId: string, message: string) => {
    try {
      await vehicleMatchingAPI.sendMessage(vehicleId, message, selectedLoad?._id || '');
      toast.success('Message sent successfully!');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Loads</h1>
          <p className="text-slate-600">Manage and track all your load postings</p>
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
                placeholder="Search loads..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="pl-10"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
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
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <Button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
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
            { label: 'Total Loads', value: loads.length, color: 'blue', icon: DocumentTextIcon },
            { label: 'Active', value: loads.filter(l => ['posted', 'assigned', 'enroute'].includes(l.status)).length, color: 'orange', icon: TruckIcon },
            { label: 'Completed', value: loads.filter(l => l.status === 'completed').length, color: 'green', icon: CheckCircleIcon },
            { label: 'Commission', value: `₹${loads.filter(l => l.commissionApplicable).reduce((sum, l) => sum + (l.commissionAmount || 0), 0).toLocaleString()}`, color: 'emerald', icon: CurrencyRupeeIcon }
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

        {/* Loads Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <AnimatePresence>
            {filteredLoads.map((load, index) => {
              const StatusIcon = getStatusIcon(load.status);
              const totalWeight = load.materials?.reduce((sum, material) => sum + material.totalWeight, 0) || 0;

              return (
                <motion.div
                  key={load._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => viewLoadDetails(load)}
                >
                  {/* Load Header */}
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-b border-slate-100">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(load.status)}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-sm font-medium capitalize">{load.status}</span>
                      </div>
                      {load.commissionApplicable && (
                        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                          <span className="text-xs font-medium">5% Commission</span>
                        </div>
                      )}
                    </div>

                    {/* Load ID and Date */}
                    <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                      <span>Load #{load._id.slice(-6).toUpperCase()}</span>
                      <span>{new Date(load.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="p-6">
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

                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CurrencyRupeeIcon className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">Payment</span>
                        </div>
                        <p className="text-sm text-purple-700 uppercase">{load.paymentTerms}</p>
                      </div>
                    </div>

                    {/* Materials Summary */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                      {/* Photo Preview in Main Card */}
                      {load.photos && load.photos.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700 flex items-center">
                              <PhotoIcon className="h-4 w-4 mr-1" />
                              Photos ({load.photos.length})
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {load.photos.slice(0, 3).map((photo, index) => (
                              <div key={index} className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                <img
                                  src={photo.url}
                                  alt={`Load photo ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {index === 2 && load.photos.length > 3 && (
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">
                                      +{load.photos.length - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Materials</span>
                        <span className="text-sm text-slate-600">{load.materials?.length || 0} items</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {load.materials?.slice(0, 3).map((material, idx) => (
                          <span key={idx} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-lg">
                            {material.name}
                          </span>
                        ))}
                        {(load.materials?.length || 0) > 3 && (
                          <span className="text-xs text-slate-500">+{(load.materials?.length || 0) - 3} more</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      {load.status === 'posted' && (
                        <>
                          <div className="space-y-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLoad(load);
                                setIsCreateBiddingModalOpen(true);
                              }}
                              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                              icon={<CurrencyRupeeIcon className="h-4 w-4" />}
                            >
                              Start Bidding
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/load-matched-vehicles/${load._id}`);
                              }}
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                              icon={<TruckIcon className="h-4 w-4" />}
                            >
                              Find Matching Vehicles
                            </Button>
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLoad(load);
                              setIsVehicleMatchingModalOpen(true);
                            }}
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                            icon={<HandRaisedIcon className="h-4 w-4" />}
                          >
                            View Applications
                          </Button>
                        </>

                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewLoadDetails(load);
                          }}
                          variant="outline"
                          size="sm"
                          icon={<EyeIcon className="h-4 w-4" />}
                        >
                          Details
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewLoadTimeline(load);
                          }}
                          variant="secondary"
                          size="sm"
                          icon={<ClockIcon className="h-4 w-4" />}
                        >
                          Timeline
                        </Button>
                        {load.status === 'posted' && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLoad(load._id);
                            }}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            icon={<XCircleIcon className="h-4 w-4" />}
                          >
                            Delete
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
        {filteredLoads.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <DocumentTextIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {loads.length === 0 ? 'No loads posted yet' : 'No loads match your filters'}
            </h3>
            <p className="text-slate-600 mb-6">
              {loads.length === 0
                ? 'Start by posting your first load to connect with vehicle owners'
                : 'Try adjusting your search criteria or filters'
              }
            </p>
            {loads.length === 0 && (
              <Button onClick={() => window.location.href = '/post-load'}>
                Post Your First Load
              </Button>
            )}
          </motion.div>
        )}

        {/* Enhanced Load Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title=""
          fullScreen={true}
        >
          {selectedLoad && (
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Load Details</h2>
                    <p className="text-blue-100">Load #{selectedLoad._id.slice(-6).toUpperCase()}</p>
                  </div>
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-full bg-white bg-opacity-20`}>
                    <StarIcon className="h-5 w-5" />
                    <span className="font-medium capitalize">{selectedLoad.status}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column - Route & Basic Info */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Route Information */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-6">Route Information</h3>
                      <div className="space-y-6">
                        <div className="flex items-center space-x-6">
                          <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-center space-x-2 mb-3">
                              <MapPinIcon className="h-5 w-5 text-blue-600" />
                              <span className="font-semibold text-blue-800">Loading Point</span>
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium text-slate-900">{selectedLoad.loadingLocation.place}</p>
                              <p className="text-sm text-slate-600">{selectedLoad.loadingLocation.district}, {selectedLoad.loadingLocation.state}</p>
                              <p className="text-sm text-slate-500">PIN: {selectedLoad.loadingLocation.pincode}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-center">
                            <div className="w-12 h-0.5 bg-slate-300 mb-2"></div>
                            <TruckIcon className="h-6 w-6 text-slate-400" />
                            <div className="w-12 h-0.5 bg-slate-300 mt-2"></div>
                          </div>

                          <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <div className="flex items-center space-x-2 mb-3">
                              <MapPinIcon className="h-5 w-5 text-emerald-600" />
                              <span className="font-semibold text-emerald-800">Delivery Point</span>
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium text-slate-900">{selectedLoad.unloadingLocation.place}</p>
                              <p className="text-sm text-slate-600">{selectedLoad.unloadingLocation.district}, {selectedLoad.unloadingLocation.state}</p>
                              <p className="text-sm text-slate-500">PIN: {selectedLoad.unloadingLocation.pincode}</p>
                            </div>
                          </div>
                        </div>

                        {/* Schedule */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <CalendarIcon className="h-4 w-4 text-orange-600" />
                              <span className="font-medium text-orange-800">Loading Date</span>
                            </div>
                            <p className="text-lg font-semibold text-slate-900">{new Date(selectedLoad.loadingDate).toLocaleDateString()}</p>
                            <p className="text-sm text-slate-600">{selectedLoad.loadingTime}</p>
                          </div>

                          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <CurrencyRupeeIcon className="h-4 w-4 text-purple-600" />
                              <span className="font-medium text-purple-800">Payment Terms</span>
                            </div>
                            <p className="text-lg font-semibold text-slate-900 uppercase">{selectedLoad.paymentTerms}</p>
                            {selectedLoad.commissionApplicable && (
                              <p className="text-sm text-emerald-600">Commission: ₹{selectedLoad.commissionAmount?.toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Materials Details */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-6">Materials ({selectedLoad.materials?.length || 0})</h3>
                      <div className="space-y-4">
                        {selectedLoad.materials?.map((material, index) => (
                          <div key={material.id || index} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between mb-4">
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

                            {/* Material Photos */}
                            {material.photos && material.photos.length > 0 && (
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-slate-700 flex items-center">
                                    <PhotoIcon className="h-4 w-4 mr-1" />
                                    Photos ({material.photos.length})
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  {material.photos.slice(0, 3).map((photo, index) => (
                                    <div key={index} className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                      <img
                                        src={photo.url}
                                        alt={`Material photo ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                      {index === 2 && material.photos.length > 3 && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                          <span className="text-white text-xs font-medium">
                                            +{material.photos.length - 3}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Vehicle Requirements & Actions */}
                  <div className="space-y-6">
                    {/* Vehicle Requirements */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Vehicle Requirements</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Type:</span>
                          <span className="font-medium text-slate-900 capitalize">{selectedLoad.vehicleRequirement.vehicleType}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Size:</span>
                          <span className="font-medium text-slate-900">{selectedLoad.vehicleRequirement.size} ft</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Trailer:</span>
                          <span className="font-medium text-slate-900 capitalize">{selectedLoad.vehicleRequirement.trailerType || 'None'}</span>
                        </div>
                        {/* <div className="flex items-center justify-between">
                          <span className="text-slate-600">Total Weight:</span>
                          <span className="font-medium text-slate-900">{totalWeight.toLocaleString()} kg</span>
                        </div> */}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        {selectedLoad.status === 'posted' && (
                          <Button
                            onClick={() => {
                              setIsModalOpen(false);
                              navigate(`/load-matched-vehicles/${selectedLoad._id}`);
                            }}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
                            icon={<TruckIcon className="h-4 w-4" />}
                          >
                            Find Matching Vehicles
                          </Button>
                        )}
                        <Button
                          onClick={() => {
                            setIsModalOpen(false);
                            setIsVehicleMatchingModalOpen(true);
                          }}
                          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700"
                          icon={<HandRaisedIcon className="h-4 w-4" />}
                        >
                          View Applications
                        </Button>
                        <Button
                          onClick={() => {
                            setIsModalOpen(false);
                            setIsTimelineModalOpen(true);
                          }}
                          variant="outline"
                          className="w-full"
                          icon={<ClockIcon className="h-4 w-4" />}
                        >
                          View Timeline
                        </Button>
                        <Button
                          onClick={() => {
                            setIsModalOpen(false);
                            setIsMessageModalOpen(true);
                          }}
                          variant="outline"
                          className="w-full"
                          icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
                        >
                          Message Vehicle Owner
                        </Button>
                        <Button
                          onClick={() => updateLoadStatus(selectedLoad._id, 'completed')}
                          variant="outline"
                          className="w-full"
                          disabled={selectedLoad.status === 'completed'}
                        >
                          Mark as Completed
                        </Button>

                        {selectedLoad.status === 'completed' && (
                          <Button
                            onClick={() => {
                              setIsModalOpen(false);
                              setIsRatingModalOpen(true);
                            }}
                            variant="outline"
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                            icon={<StarIcon className="h-4 w-4" />}
                          >
                            Rate Vehicle Owner
                          </Button>
                        )}

                        {selectedLoad.status === 'completed' && (
                          <Button
                            onClick={() => {
                              setIsModalOpen(false);
                              setIsRatingModalOpen(true);
                            }}
                            variant="outline"
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                            icon={<StarIcon className="h-4 w-4" />}
                          >
                            Rate Vehicle Owner
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Load Statistics */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Load Statistics</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Created:</span>
                          <span className="font-medium text-slate-900">{new Date(selectedLoad.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Materials:</span>
                          <span className="font-medium text-slate-900">{selectedLoad.materials?.length || 0} items</span>
                        </div>
                        {/* <div className="flex items-center justify-between">
                          <span className="text-slate-600">Total Weight:</span>
                          <span className="font-medium text-slate-900">{totalWeight.toLocaleString()} kg</span>
                        </div> */}
                        {selectedLoad.commissionApplicable && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Commission:</span>
                            <span className="font-medium text-emerald-600">₹{selectedLoad.commissionAmount?.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Timeline Modal */}
        <Modal
          isOpen={isTimelineModalOpen}
          onClose={() => setIsTimelineModalOpen(false)}
          title=""
          size="lg"
        >
          {selectedLoad && (
            <LoadTimeline
              currentStatus={selectedLoad.status}
              loadingDate={selectedLoad.loadingDate}
              onStatusChange={(status) => updateLoadStatus(selectedLoad._id, status)}
              onSendMessage={() => {
                setIsTimelineModalOpen(false);
                setIsMessageModalOpen(true);
              }}
            />
          )}
        </Modal>

        {/* Message Modal */}
        <MessageModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          loadProviderName={selectedLoad?.loadProviderName || 'Vehicle Owner'}
          loadId={selectedLoad?._id || ''}
          onSendMessage={handleSendMessage}
        />

        {/* Vehicle Matching Modal */}
        <VehicleMatchingModal
          isOpen={isVehicleMatchingModalOpen}
          onClose={() => setIsVehicleMatchingModalOpen(false)}
          load={selectedLoad}
          onSelectVehicle={handleSelectVehicle}
          onSendMessage={handleSendMessageToVehicle}
        />

        {/* Rating Modal */}
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          load={selectedLoad}
          vehicle={assignedVehicle}
          userType="load_provider"
          onRatingSubmitted={() => {
            setIsRatingModalOpen(false);
            fetchLoads();
          }}
        />

        {/* Rating Modal */}
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          load={selectedLoad}
          vehicle={assignedVehicle}
          userType="load_provider"
          onRatingSubmitted={() => {
            setIsRatingModalOpen(false);
            fetchLoads();
          }}
        />

        {/* Create Bidding Modal */}
        <CreateBiddingModal
          isOpen={isCreateBiddingModalOpen}
          onClose={() => setIsCreateBiddingModalOpen(false)}
          load={selectedLoad}
          onBiddingCreated={() => {
            setIsCreateBiddingModalOpen(false);
            fetchLoads();
            toast.success('Bidding session created! Vehicle owners can now place bids.');
          }}
        />
      </div>
    </div>
  );
};