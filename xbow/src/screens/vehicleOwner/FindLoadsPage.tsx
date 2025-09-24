import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  TruckIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  EyeIcon,
  HandRaisedIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

import { loadAPI, vehicleAPI } from '../../services/api';
import { loadApplicationAPI } from '../../services/loadApplicationAPI';
import { vehicleMatchingAPI } from '../../services/api';
import type { Load, Vehicle } from '../../types/index';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { VehicleApplicationModal } from '../../components/vehicles/VehicleApplicationModal';
import { MessageModal } from '../../components/MessageModal';

import { VehicleRequestModal } from '../../components/loads/VehicleRequestModal';
import { LoadProgressModal } from '../../components/loads/LoadProgressModal';
import { LoadHistoryModal } from '../../components/loads/LoadHistoryModal';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import type { VehicleRequest } from '../../types/index';

export const FindLoadsPage: React.FC = () => {
  const { user } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  const [filteredLoads, setFilteredLoads] = useState<Load[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVehicleApplicationModalOpen, setIsVehicleApplicationModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isVehicleRequestModalOpen, setIsVehicleRequestModalOpen] = useState(false);
  const [isLoadProgressModalOpen, setIsLoadProgressModalOpen] = useState(false);
  const [isLoadHistoryModalOpen, setIsLoadHistoryModalOpen] = useState(false);
  const [vehicleRequests, setVehicleRequests] = useState<VehicleRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VehicleRequest | null>(null);
  const [requestsCount, setRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  console.log('selectedLoad', selectedLoad);

  const [filters, setFilters] = useState({
    search: '',
    state: '',
    district: '',
    vehicleType: '',
    vehicleSize: '',
    trailerType: '',
    paymentTerms: '',
    withCommission: false
  });

  useEffect(() => {
    fetchData();
    fetchVehicleRequests();
  }, []);

  useEffect(() => {
    filterLoads();
  }, [loads, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch available loads from backend
      const loadsResponse = await loadAPI.getAvailableLoads();
      if (loadsResponse.data.success) {
        setLoads(loadsResponse.data.data);
      } else {
        throw new Error(loadsResponse.data.message || 'Failed to fetch loads');
      }

      // Fetch user's vehicles
      const vehiclesResponse = await vehicleAPI.getMyVehicles();
      if (vehiclesResponse.data.success) {
        setMyVehicles(vehiclesResponse.data.data);
      } else {
        throw new Error(vehiclesResponse.data.message || 'Failed to fetch vehicles');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch available loads');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleRequests = async () => {
    try {
      const response = await vehicleMatchingAPI.getVehicleRequests();
      if (response.data.success) {
        setVehicleRequests(response.data.data);
        setRequestsCount(response.data.data.filter((req: VehicleRequest) => req.status === 'pending').length);
      }
    } catch (error) {
      console.error('Error fetching vehicle requests:', error);
    }
  };
  const filterLoads = () => {
    let filtered = [...loads];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(load =>
        load.loadingLocation.place.toLowerCase().includes(filters.search.toLowerCase()) ||
        load.unloadingLocation.place.toLowerCase().includes(filters.search.toLowerCase()) ||
        load.loadProviderName.toLowerCase().includes(filters.search.toLowerCase()) ||
        Array.isArray(load.materials) && load.materials.some(material =>
          material.name.toLowerCase().includes(filters.search.toLowerCase())
        )
      );
    }

    // Location filters
    if (filters.state) {
      filtered = filtered.filter(load =>
        load.loadingLocation.state.toLowerCase().includes(filters.state.toLowerCase())
      );
    }

    if (filters.district) {
      filtered = filtered.filter(load =>
        load.loadingLocation.district.toLowerCase().includes(filters.district.toLowerCase())
      );
    }

    // Vehicle requirement filters
    if (filters.vehicleType) {
      filtered = filtered.filter(load => load.vehicleRequirement.vehicleType === filters.vehicleType);
    }

    if (filters.vehicleSize) {
      filtered = filtered.filter(load => load.vehicleRequirement.size === Number(filters.vehicleSize));
    }

    if (filters.trailerType) {
      filtered = filtered.filter(load => load.vehicleRequirement.trailerType === filters.trailerType);
    }

    // Payment terms filter
    if (filters.paymentTerms) {
      filtered = filtered.filter(load => load.paymentTerms === filters.paymentTerms);
    }

    // Commission filter
    if (filters.withCommission) {
      filtered = filtered.filter(load => load.commissionApplicable);
    }

    setFilteredLoads(filtered);
  };

  const updateFilter = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      state: '',
      district: '',
      vehicleType: '',
      vehicleSize: '',
      trailerType: '',
      paymentTerms: '',
      withCommission: false
    });
  };

  const applyForLoad = async (loadId: string) => {
    const load = loads.find(l => l._id === loadId);
    if (load) {
      setSelectedLoad(load);
      setIsVehicleApplicationModalOpen(true);
    }
  };

  const handleApplicationSent = () => {
    try {
      // Refresh the loads list
      fetchData();
      setIsVehicleApplicationModalOpen(false);
    } catch (error) {
      console.error('Error after application sent:', error);
    }
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

  const handleRequestResponded = () => {
    fetchVehicleRequests();
    fetchData(); // Refresh loads to update status
  };

  const openLoadProgress = (request: VehicleRequest) => {
    setSelectedRequest(request);
    setIsLoadProgressModalOpen(true);
  };

  const openLoadHistory = () => {
    setIsLoadHistoryModalOpen(true);
  };
  const calculateDistance = (load: Load) => {
    // Mock distance calculation - in real implementation, use Google Maps API
    return Math.floor(Math.random() * 800) + 200; // Random distance between 200-1000 km
  };

  const isVehicleCompatible = (load: Load) => {
    return myVehicles.some(vehicle =>
      vehicle.vehicleSize >= load.vehicleRequirement.size &&
      vehicle.passingLimit >= (Array.isArray(load.materials) ?
        load.materials.reduce((sum, material) => sum + material.totalWeight, 0) : 0) / 1000 &&
      vehicle.isApproved &&
      vehicle.status === 'available'
    );
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Find Loads</h1>
              <p className="text-slate-600">Discover available loads matching your vehicles</p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => setIsVehicleRequestModalOpen(true)}
                variant="outline"
                className="relative"
                icon={<BellIcon className="h-5 w-5" />}
              >
                Vehicle Requests
                {requestsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {requestsCount}
                  </span>
                )}
              </Button>
              <Button
                onClick={openLoadHistory}
                variant="secondary"
                icon={<StarIcon className="h-5 w-5" />}
              >
                Load History
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Advanced Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search loads..."
                value={filters.search}
                onChange={(value) => updateFilter('search', value)}
                className="pl-10"
              />
            </div>

            <Input
              placeholder="State"
              value={filters.state}
              onChange={(value) => updateFilter('state', value)}
            />

            <Input
              placeholder="District"
              value={filters.district}
              onChange={(value) => updateFilter('district', value)}
            />

            <select
              value={filters.vehicleType}
              onChange={(e) => updateFilter('vehicleType', e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
            >
              <option value="">All Vehicle Types</option>
              <option value="2-wheel">2-wheel</option>
              <option value="3-wheel">3-wheel</option>
              <option value="4-wheel">4-wheel</option>
              <option value="6-wheel">6-wheel</option>
              <option value="8-wheel">8-wheel</option>
              <option value="10-wheel">10-wheel</option>
              <option value="12-wheel">12-wheel</option>
              <option value="14-wheel">14-wheel</option>
              <option value="16-wheel">16-wheel</option>
              <option value="18-wheel">18-wheel</option>
              <option value="20-wheel">20-wheel</option>
            </select>

            <select
              value={filters.vehicleSize}
              onChange={(e) => updateFilter('vehicleSize', e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
            >
              <option value="">All Sizes</option>
              {[6, 8.5, 10, 14, 17, 19, 20, 22, 24].map(size => (
                <option key={size} value={size}>{size} ft</option>
              ))}
            </select>

            <select
              value={filters.trailerType}
              onChange={(e) => updateFilter('trailerType', e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
            >
              <option value="">All Trailer Types</option>
              <option value="none">None</option>
              <option value="lowbed">Lowbed</option>
              <option value="semi-lowbed">Semi-Lowbed</option>
              <option value="hydraulic-axle-8">Hydraulic Axle (8 Axle)</option>
              <option value="crane-14t">Crane (14T)</option>
              <option value="crane-25t">Crane (25T)</option>
              <option value="crane-50t">Crane (50T)</option>
              <option value="crane-100t">Crane (100T)</option>
              <option value="crane-200t">Crane (200T)</option>
            </select>

            <select
              value={filters.paymentTerms}
              onChange={(e) => updateFilter('paymentTerms', e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
            >
              <option value="">All Payment Terms</option>
              <option value="advance">Advance</option>
              <option value="cod">COD</option>
              <option value="after_pod">After POD</option>
              <option value="to_pay">To Pay</option>
              <option value="credit">Credit</option>
            </select>

            <label className="flex items-center space-x-3 px-4 py-3 border-2 border-slate-300 rounded-xl">
              <input
                type="checkbox"
                checked={filters.withCommission}
                onChange={(e) => updateFilter('withCommission', e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-slate-700">With Commission</span>
            </label>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">
              Showing {filteredLoads.length} of {loads.length} loads
            </p>
            <Button
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              icon={<FunnelIcon className="h-4 w-4" />}
            >
              Clear Filters
            </Button>
          </div>
        </motion.div>

        {/* Active Assignments Banner */}
        {vehicleRequests.filter(req => req.status === 'accepted').length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Active Load Assignments</h3>
                <p className="text-emerald-100">
                  You have {vehicleRequests.filter(req => req.status === 'accepted').length} active load(s) assigned to your vehicles
                </p>
              </div>
              <Button
                onClick={() => setIsLoadProgressModalOpen(true)}
                variant="outline"
                className="bg-white text-emerald-600 border-white hover:bg-emerald-50"
              >
                View Progress
              </Button>
            </div>
          </motion.div>
        )}
        {/* Loads Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredLoads.map((load, index) => {
              const distance = calculateDistance(load);
              const isCompatible = isVehicleCompatible(load);

              return (
                <motion.div
                  key={load.loadProviderId || load._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 ${isCompatible ? 'border-emerald-200 ring-2 ring-emerald-100' : 'border-slate-200'
                    }`}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">

                      <div className="flex items-center space-x-2">
                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-slate-600">Available</span>
                      </div>
                      <div className="flex space-x-2">
                        {load.commissionApplicable && (
                          <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                            <span className="text-xs font-medium">5% Commission</span>
                          </div>
                        )}
                        {isCompatible && (
                          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                            <span className="text-xs font-medium">Compatible</span>
                          </div>
                        )}
                      </div>
                    </div>


                    {/* Load Provider */}
                    <div className="mb-4">
                      <h3 className="font-semibold text-slate-900 mb-1">{load.loadProviderName}</h3>
                      <p className="text-sm text-slate-600">Load Provider</p>
                    </div>
                    {/* Material Photo Preview */}
                    {load.photos && load.photos.length > 0 && (
                      <div className="mb-4">
                        <div className="grid grid-cols-3 gap-2">
                          {load.photos.slice(0, 3).map((photo, index) => (
                            <div key={index} className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                              <img
                                src={photo.url}
                                alt={`Material photo ${index + 1}`}
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

                    {/* Route */}
                    <div className="mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                            <span className="font-medium text-slate-900 text-sm">{load.loadingLocation.place}</span>
                          </div>
                          <p className="text-xs text-slate-600 ml-5">{load.loadingLocation.state}</p>
                        </div>
                        <div className="text-slate-400 text-sm">{distance} km</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="h-3 w-3 bg-emerald-500 rounded-full"></div>
                            <span className="font-medium text-slate-900 text-sm">{load.unloadingLocation.place}</span>
                          </div>
                          <p className="text-xs text-slate-600 ml-5">{load.unloadingLocation.state}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Requirements */}
                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <h4 className="font-medium text-slate-900 mb-2 flex items-center">
                        <TruckIcon className="h-4 w-4 mr-2 text-slate-600" />
                        Vehicle Required
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-600">Type:</span>
                          <p className="font-medium text-slate-900">{load.vehicleRequirement.vehicleType}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Size:</span>
                          <p className="font-medium text-slate-900">{load.vehicleRequirement.size} ft</p>
                        </div>
                        {load.vehicleRequirement.trailerType && load.vehicleRequirement.trailerType !== 'none' && (
                          <div className="col-span-2">
                            <span className="text-slate-600">Trailer:</span>
                            <p className="font-medium text-slate-900">{load.vehicleRequirement.trailerType}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Load Details */}
                    <div className="space-y-2 mb-6 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Materials:</span>
                        <span className="font-medium text-slate-900">{(load.materials?.length ?? 0)} item(s)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Total Weight:</span>
                        <span className="font-medium text-slate-900">
                          {(load.materials?.reduce((sum, material) => sum + material.totalWeight, 0) ?? 0)} kg
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Loading Date:</span>
                        <span className="font-medium text-slate-900">{new Date(load.loadingDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Payment:</span>
                        <span className="font-medium text-slate-900 uppercase">{load.paymentTerms}</span>
                      </div>
                      {load.commissionApplicable && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Commission:</span>
                          <span className="font-medium text-emerald-600">₹{load.commissionAmount?.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => {
                          setSelectedLoad(load);
                          setIsModalOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 mr-2"
                        icon={<EyeIcon className="h-4 w-4" />}
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => applyForLoad(load._id)}
                        loading={applying === load._id}
                        disabled={!isCompatible}
                        variant={isCompatible ? "secondary" : "ghost"}
                        size="sm"
                        className="flex-1"
                        icon={<HandRaisedIcon className="h-4 w-4" />}
                      >
                        {isCompatible ? 'Apply' : 'Not Compatible'}
                      </Button>
                    </div>
                  </div>

                  {/* Compatibility Indicator */}
                  {isCompatible && (
                    <div className="bg-emerald-50 border-t border-emerald-200 px-6 py-3">
                      <p className="text-sm text-emerald-700 font-medium">
                        ✓ Compatible with your vehicles
                      </p>
                    </div>
                  )}
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
              {loads.length === 0 ? 'No loads available' : 'No loads match your filters'}
            </h3>
            <p className="text-slate-600 mb-6">
              {loads.length === 0
                ? 'Check back later for new load postings'
                : 'Try adjusting your search criteria or filters'
              }
            </p>
            {loads.length > 0 && (
              <Button onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </motion.div>
        )}

        {/* Load Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Load Details"
          size="xl"
        >
          {selectedLoad && (
            <div className="space-y-6">
              {/* Load Provider Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-2">Load Provider</h3>
                    <p className="text-blue-700 font-medium">{selectedLoad.loadProviderName}</p>
                    <p className="text-blue-600 text-sm">Contact for direct communication</p>
                  </div>
                  <Button
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsMessageModalOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                    icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
                  >
                    Message
                  </Button>
                </div>
              </div>
              {/* Material Photos */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Material Photos</h3>
                  {selectedLoad.photos && selectedLoad.photos.length > 0 && (
                    <span className="text-sm text-slate-600">{selectedLoad.photos.length} photo(s)</span>
                  )}
                </div>
                {selectedLoad.photos && selectedLoad.photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedLoad.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.url}
                          alt={`Material ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-slate-200 group-hover:opacity-80 transition-opacity cursor-pointer shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg flex items-center justify-center">
                          <EyeIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <DocumentTextIcon className="h-12 w-12 mb-2" />
                    <p className="text-sm">No material photos available</p>
                  </div>
                )}
              </div>

              {/* Route Information */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Route Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="font-medium text-slate-700 mb-2 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      Loading Location
                    </h4>
                    <div className="text-sm text-slate-600">
                      <p className="font-medium text-slate-900">{selectedLoad.loadingLocation.place}</p>
                      <p>{selectedLoad.loadingLocation.district}, {selectedLoad.loadingLocation.state}</p>
                      <p>PIN: {selectedLoad.loadingLocation.pincode}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="font-medium text-slate-700 mb-2 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      Unloading Location
                    </h4>
                    <div className="text-sm text-slate-600">
                      <p className="font-medium text-slate-900">{selectedLoad.unloadingLocation.place}</p>
                      <p>{selectedLoad.unloadingLocation.district}, {selectedLoad.unloadingLocation.state}</p>
                      <p>PIN: {selectedLoad.unloadingLocation.pincode}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Requirements */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Vehicle Requirements</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Type:</span>
                      <p className="font-medium text-slate-900">{selectedLoad.vehicleRequirement.vehicleType}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Size:</span>
                      <p className="font-medium text-slate-900">{selectedLoad.vehicleRequirement.size} ft</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Trailer:</span>
                      <p className="font-medium text-slate-900">{selectedLoad.vehicleRequirement.trailerType || 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Materials ({selectedLoad.materials?.length ?? 0})</h3>
                <div className="space-y-4">
                  {selectedLoad.materials?.map((material, index) => (
                    <div key={material.name || index} className="border border-slate-200 rounded-xl p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-slate-900 mb-2">{material.name}</h4>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p>Dimensions: {material.dimensions.length} × {material.dimensions.width} × {material.dimensions.height} ft</p>
                            <p>Pack Type: <span className="capitalize">{material.packType}</span></p>
                            <p>Count: {material.totalCount}</p>
                          </div>
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <p>Single Weight: {material.singleWeight} kg</p>
                          <p>Total Weight: <span className="font-semibold text-slate-900">{material.totalWeight} kg</span></p>
                        </div>
                      </div>

                      {/* Material Photos */}
                      {material.photos && material.photos.length > 0 && (
                        <div>
                          <h5 className="font-medium text-slate-900 mb-3">Photos</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {material.photos.map((photo, photoIndex) => (
                              <div key={photoIndex} className="relative group">
                                <img
                                  src={photo.url}
                                  alt={`Material ${photoIndex + 1}`}
                                  className="w-full h-20 object-cover rounded-lg border border-slate-200 group-hover:opacity-80 transition-opacity cursor-pointer"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Apply Section */}
              <div className="flex space-x-4 pt-4 border-t border-slate-200">
                <Button
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsVehicleApplicationModalOpen(true);
                  }}
                  disabled={!isVehicleCompatible(selectedLoad)}
                  className="flex-1"
                  icon={<HandRaisedIcon className="h-4 w-4" />}
                >
                  Apply for Load
                </Button>
                <Button
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsMessageModalOpen(true);
                  }}
                  variant="outline"
                  className="flex-1"
                  icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
                >
                  Message Provider
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Load Application Modal */}
        <VehicleApplicationModal
          isOpen={isVehicleApplicationModalOpen}
          onClose={() => setIsVehicleApplicationModalOpen(false)}
          load={selectedLoad!}
          vehicles={myVehicles}
          onApplicationSent={handleApplicationSent}
        />

        {/* Vehicle Request Modal */}
        <VehicleRequestModal
          isOpen={isVehicleRequestModalOpen}
          onClose={() => setIsVehicleRequestModalOpen(false)}
          onRequestResponded={handleRequestResponded}
        />

        {/* Load Progress Modal */}
        <LoadProgressModal
          isOpen={isLoadProgressModalOpen}
          onClose={() => setIsLoadProgressModalOpen(false)}
          vehicleRequests={vehicleRequests.filter(req => req.status === 'accepted')}
          onStatusUpdate={handleRequestResponded}
        />

        {/* Load History Modal */}
        <LoadHistoryModal
          isOpen={isLoadHistoryModalOpen}
          onClose={() => setIsLoadHistoryModalOpen(false)}
          completedRequests={vehicleRequests.filter(req => req.load?.status === 'completed')}
        />
        {/* Message Modal */}
        <MessageModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          loadProviderName={selectedLoad?.loadProviderName || ''}
          loadId={selectedLoad?._id || ''}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};