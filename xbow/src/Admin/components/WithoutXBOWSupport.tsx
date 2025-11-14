import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  MapPin,
  Truck,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  X,
  AlertTriangle,
  Building2,
  Scale,
  Package,
  Phone,
  Mail,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { Load, Vehicle, User } from '../../types';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { Pagination } from './common/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { adminAPI } from '../services/adminApi';

export const WithoutXBOWSupport: React.FC = () => {
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
  console.log("Selected Load:", selectedLoad);
  //console.log("Material Photos:", selectedLoad.materials[0].phots);


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
    fetchLoadsWithoutXBOW();
  }, []);

  useEffect(() => {
    filterLoads();
    resetPagination();
  }, [loads, searchTerm, statusFilter, priorityFilter]);

  const fetchLoadsWithoutXBOW = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getLoadsWithoutXBOWSupport();
      if (response.data.success) {
        setLoads(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching loads without XBOW:', error);
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
    } finally {
      setMatchingLoading(false);
    }
  };

  const assignVehicleToLoad = async () => {
    if (!selectedLoad || !selectedVehicle) return;

    try {
      setAssigningLoading(true);

      const assignmentData = {
        loadId: selectedLoad._id,
        vehicleId: selectedVehicle._id,
        agreedPrice: selectedVehicle.bidPrice || 0,
        vehicleOwnerId: selectedVehicle.ownerId,
        loadProviderId: typeof selectedLoad.loadProviderId === 'string'
          ? selectedLoad.loadProviderId
          : selectedLoad.loadProviderId.id,
        message: assignmentMessage
      };

      const response = await adminAPI.assignVehicleToLoad(assignmentData);

      if (response.data.success) {
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
      case 'posted': return FileText;
      case 'assigned': return CheckCircle;
      case 'enroute': return Truck;
      case 'delivered': return CheckCircle;
      case 'completed': return CheckCircle;
      default: return Clock;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Standard Loads Dashboard</h1>
              <p className="text-slate-600">Manage loads without XBOW support and assign vehicles</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
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
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
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
              icon={<X className="h-4 w-4" />}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Total Loads',
              value: loads.length,
              color: 'from-blue-500 to-blue-600',
              icon: Truck,
              iconBg: 'bg-blue-100',
              iconColor: 'text-blue-600'
            },
            {
              label: 'Pending Assignment',
              value: loads.filter(l => l.status === 'posted').length,
              color: 'from-amber-500 to-amber-600',
              icon: Clock,
              iconBg: 'bg-amber-100',
              iconColor: 'text-amber-600'
            },
            {
              label: 'Active Loads',
              value: loads.filter(l => ['assigned', 'enroute'].includes(l.status)).length,
              color: 'from-orange-500 to-orange-600',
              icon: TrendingUp,
              iconBg: 'bg-orange-100',
              iconColor: 'text-orange-600'
            },
            {
              label: 'Completed',
              value: loads.filter(l => l.status === 'completed').length,
              color: 'from-green-500 to-green-600',
              icon: CheckCircle,
              iconBg: 'bg-green-100',
              iconColor: 'text-green-600'
            }
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {paginatedItems.map((load) => {
            const StatusIcon = getStatusIcon(load.status);
            const totalWeight = load.materials?.reduce((sum, material) => sum + material.totalWeight, 0) || 0;
            const priorityLabel = getPriorityLabel(load.loadingDate);

            return (
              <div
                key={load._id}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="bg-gradient-to-r from-blue-50 to-slate-50 p-6 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(load.status)}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-sm font-medium capitalize">{load.status}</span>
                      </div>
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getPriorityColor(load.loadingDate)}`}>
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">{priorityLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span className="font-mono">#{load._id.slice(-8).toUpperCase()}</span>
                    <span>{new Date(load.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Load Provider</span>
                    </div>
                    <p className="font-semibold text-slate-900">{load.loadProviderName}</p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-slate-900">{load.loadingLocation.place}</span>
                        </div>
                        <p className="text-sm text-slate-600">{load.loadingLocation.district}, {load.loadingLocation.state}</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-0.5 bg-slate-300 mb-1"></div>
                        <Truck className="h-4 w-4 text-slate-400" />
                        <div className="w-8 h-0.5 bg-slate-300 mt-1"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="h-4 w-4 text-emerald-600" />
                          <span className="font-semibold text-slate-900">{load.unloadingLocation.place}</span>
                        </div>
                        <p className="text-sm text-slate-600">{load.unloadingLocation.district}, {load.unloadingLocation.state}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Vehicle</span>
                      </div>
                      <p className="text-sm text-blue-700">{load.vehicleRequirement.size}ft {load.vehicleRequirement.vehicleType}</p>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Scale className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-800">Weight</span>
                      </div>
                      <p className="text-sm text-emerald-700">{totalWeight.toLocaleString()} kg</p>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">Loading</span>
                      </div>
                      <p className="text-sm text-orange-700">{new Date(load.loadingDate).toLocaleDateString()}</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Package className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-800">Materials</span>
                      </div>
                      <p className="text-sm text-slate-700">{load.materials?.length || 0} items</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => {
                          setSelectedLoad(load);
                          setIsLoadDetailsModalOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        icon={<Eye className="h-4 w-4" />}
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => findMatchedVehicles(load)}
                        loading={matchingLoading && selectedLoad?._id === load._id}
                        disabled={load.status !== 'posted'}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                        icon={<Truck className="h-4 w-4" />}
                      >
                        Find Vehicles
                      </Button>
                    </div>

                    {load.status === 'assigned' && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Vehicle Assigned</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">Load is now being handled by assigned vehicle</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />

        {filteredLoads.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-slate-200">
            <Truck className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {loads.length === 0 ? 'No Loads Available' : 'No loads match your filters'}
            </h3>
            <p className="text-slate-600">
              {loads.length === 0
                ? 'Standard loads will appear here when load providers post requests'
                : 'Try adjusting your search criteria or filters'
              }
            </p>
          </div>
        )}

        <Modal
          isOpen={isLoadDetailsModalOpen}
          onClose={() => setIsLoadDetailsModalOpen(false)}
          title="Load Details"
          size="xl"
        >
          {selectedLoad && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Load Provider Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <span className="text-blue-700 font-medium">Load ID:</span>
                    <p className="text-slate-900 font-mono">#{selectedLoad._id.slice(-8).toUpperCase()}</p>
                  </div>
                  <p className="text-slate-900">
                    {new Date(selectedLoad.createdAt).toLocaleString()}
                  </p>

                  <div>
                    <span className="text-blue-700 font-medium">Status:</span>
                    <p className="text-slate-900 capitalize">{selectedLoad.status}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Route Information</h3>
                <div className="flex items-center space-x-6">
                  <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-800">Loading Point</span>
                    </div>
                    <p className="font-medium text-slate-900">{selectedLoad.loadingLocation.place}</p>
                    <p className="text-sm text-slate-600">{selectedLoad.loadingLocation.district}, {selectedLoad.loadingLocation.state}</p>
                    <p className="text-sm text-slate-500">PIN: {selectedLoad.loadingLocation.pincode}</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <Truck className="h-6 w-6 text-slate-400" />
                  </div>

                  <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <span className="font-semibold text-emerald-800">Delivery Point</span>
                    </div>
                    <p className="font-medium text-slate-900">{selectedLoad.unloadingLocation.place}</p>
                    <p className="text-sm text-slate-600">{selectedLoad.unloadingLocation.district}, {selectedLoad.unloadingLocation.state}</p>
                    <p className="text-sm text-slate-500">PIN: {selectedLoad.unloadingLocation.pincode}</p>
                  </div>
                </div>
              </div>

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

                      {/* Enhanced Photos Section */}
                      {selectedLoad.photos && selectedLoad.photos.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-700 font-medium text-sm">
                              Load Photos ({selectedLoad.photos.length})
                            </span>
                            {selectedLoad.photos.length > 6 && (
                              <span className="text-xs text-slate-500">
                                +{selectedLoad.photos.length - 6} more
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {selectedLoad.photos.slice(0, 6).map((photo, photoIndex) => (
                              <div key={photo._id || photoIndex} className="relative group">
                                <img
                                  src={photo.url}
                                  alt={`Load photo ${photoIndex + 1}`}
                                  className="w-full h-20 sm:h-24 object-cover rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105"
                                  onClick={() => {
                                    // Open image in modal or lightbox
                                    window.open(photo.url, '_blank');
                                  }}
                                  onError={(e) => {
                                    // Fallback if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/api/placeholder/80/80';
                                    target.alt = 'Failed to load image';
                                    target.className = 'w-full h-20 sm:h-24 object-cover rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg cursor-pointer"></div>
                              </div>
                            ))}

                            {selectedLoad.photos.length > 6 && (
                              <button
                                className="w-full h-20 sm:h-24 bg-slate-100 border border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                                onClick={() => {
                                  // Open gallery view with all photos
                                  console.log('Open gallery with all photos');
                                }}
                              >
                                <span className="text-lg font-bold">+{selectedLoad.photos.length - 6}</span>
                                <span className="text-xs mt-1">View All</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

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

        <Modal
          isOpen={isVehicleMatchingModalOpen}
          onClose={() => setIsVehicleMatchingModalOpen(false)}
          title="Matched Vehicles"
          size="xl"
        >
          {selectedLoad && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Finding vehicles for:</h3>
                <p className="text-blue-700">
                  {selectedLoad.loadingLocation.place} → {selectedLoad.unloadingLocation.place}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {selectedLoad.vehicleRequirement.size}ft {selectedLoad.vehicleRequirement.vehicleType}
                </p>
              </div>

              {matchedVehicles.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No matching vehicles found</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {matchedVehicles.map((vehicle) => (
                    <div
                      key={vehicle._id}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedVehicle?._id === vehicle._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                        }`}
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Truck className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{vehicle.vehicleNumber}</h4>
                            <p className="text-sm text-slate-600">
                              {vehicle.vehicleType} • {vehicle.vehicleSize}ft
                            </p>
                          </div>
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
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
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
                            {vehicle.passingLimit}T Capacity
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-slate-400 hover:text-blue-600">
                            <Phone className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-slate-400 hover:text-blue-600">
                            <Mail className="h-4 w-4" />
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
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    icon={<CheckCircle className="h-4 w-4" />}
                  >
                    Assign Selected Vehicle
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>

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
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  icon={<CheckCircle className="h-4 w-4" />}
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
