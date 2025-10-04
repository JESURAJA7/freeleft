import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  TruckIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  ScaleIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../services/adminApi';
import type { VehicleApplication } from '../../types';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';

export const AdminApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<VehicleApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<VehicleApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<VehicleApplication | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    status: 'admin_review',
    vehicleType: 'all',
    dateRange: 'all'
  });

  const [reviewForm, setReviewForm] = useState({
    adjustedPrice: '',
    comments: '',
    action: 'approve' as 'approve' | 'reject'
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, filters]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getVehicleApplications();
      if (response.data.success) {
        setApplications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    if (filters.search) {
      filtered = filtered.filter(app =>
        app.vehicleOwnerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        app.vehicle.vehicleNumber.toLowerCase().includes(filters.search.toLowerCase()) 
        // app.load?.loadingLocation?.place.toLowerCase().includes(filters.search.toLowerCase()) ||
        // app.load?.unloadingLocation?.place.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    if (filters.vehicleType !== 'all') {
      filtered = filtered.filter(app => app.vehicle.vehicleType === filters.vehicleType);
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(app => new Date(app.appliedAt) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(app => new Date(app.appliedAt) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(app => new Date(app.appliedAt) >= filterDate);
          break;
      }
    }

    setFilteredApplications(filtered);
  };

 const handleReviewApplication = async () => {
  if (!selectedApplication) return;

  try {
    setActionLoading(selectedApplication._id);
    
    console.log('Sending review request:', {
      applicationId: selectedApplication._id,
      action: reviewForm.action,
      adjustedPrice: reviewForm.adjustedPrice,
      comments: reviewForm.comments
    });
    
    const response = await adminAPI.reviewVehicleApplication(
      selectedApplication._id,
      {
        action: reviewForm.action,
        adjustedPrice: reviewForm.adjustedPrice ? Number(reviewForm.adjustedPrice) : undefined,
        comments: reviewForm.comments.trim() || undefined
      }
    );

    console.log('Review response:', response);
    
    if (response.data && response.data.success) {
      toast.success(`Application ${reviewForm.action}d successfully!`);
      setIsReviewModalOpen(false);
      setSelectedApplication(null);
      setReviewForm({ adjustedPrice: '', comments: '', action: 'approve' });
      
      // Refresh the applications list
      await fetchApplications();
      
      // Also update the local state immediately for better UX
      setApplications(prev => prev.map(app => 
        app._id === selectedApplication._id 
          ? { ...app, status: reviewForm.action === 'approve' ? 'admin_approved' : 'admin_rejected' }
          : app
      ));
    } else {
      throw new Error(response.data?.message || 'Unknown error occurred');
    }
  } catch (error: any) {
    console.error('Error reviewing application:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to review application';
    toast.error(errorMessage);
  } finally {
    setActionLoading(null);
  }
};
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'admin_review': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'admin_approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'admin_rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'accepted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'admin_review': return ClockIcon;
      case 'admin_approved': return CheckCircleIcon;
      case 'admin_rejected': return XCircleIcon;
      case 'accepted': return CheckCircleIcon;
      case 'rejected': return XCircleIcon;
      default: return DocumentTextIcon;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'admin_review': return 'Admin Review';
      case 'admin_approved': return 'Admin Approved';
      case 'admin_rejected': return 'Admin Rejected';
      case 'accepted': return 'Load Provider Accepted';
      case 'rejected': return 'Load Provider Rejected';
      default: return status;
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Vehicle Applications</h1>
          <p className="text-slate-600">Review and approve vehicle applications with price adjustments</p>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[
            { 
              label: 'Pending Review', 
              value: applications.filter(a => a.status === 'admin_review').length, 
              color: 'yellow', 
              icon: ClockIcon 
            },
            { 
              label: 'Approved', 
              value: applications.filter(a => a.status === 'admin_approved').length, 
              color: 'green', 
              icon: CheckCircleIcon 
            },
            { 
              label: 'Rejected', 
              value: applications.filter(a => a.status === 'admin_rejected').length, 
              color: 'red', 
              icon: XCircleIcon 
            },
            { 
              label: 'Total Applications', 
              value: applications.length, 
              color: 'blue', 
              icon: DocumentTextIcon 
            }
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
                placeholder="Search applications..."
                value={filters.search}
                onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                className="pl-10"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="admin_review">Pending Review</option>
              <option value="admin_approved">Admin Approved</option>
              <option value="admin_rejected">Admin Rejected</option>
              <option value="accepted">Load Provider Accepted</option>
              <option value="rejected">Load Provider Rejected</option>
            </select>

            <select
              value={filters.vehicleType}
              onChange={(e) => setFilters(prev => ({ ...prev, vehicleType: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Vehicle Types</option>
              <option value="2-wheel">2-wheel</option>
              <option value="4-wheel">4-wheel</option>
              <option value="6-wheel">6-wheel</option>
              <option value="10-wheel">10-wheel</option>
              <option value="14-wheel">14-wheel</option>
              <option value="18-wheel">18-wheel</option>
              <option value="20-wheel">20-wheel</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-slate-600">
              Showing {filteredApplications.length} of {applications.length} applications
            </p>
            <Button
              onClick={() => setFilters({ search: '', status: 'admin_review', vehicleType: 'all', dateRange: 'all' })}
              variant="ghost"
              size="sm"
            >
              Reset Filters
            </Button>
          </div>
        </motion.div>

        {/* Applications Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <AnimatePresence>
            {filteredApplications.map((application, index) => {
              const StatusIcon = getStatusIcon(application.status);
              const totalWeight = application.load?.materials?.reduce((sum, material) => sum + material.totalWeight, 0) || 0;
              
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
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(application.status)}`}>
                        <StatusIcon className="h-3 w-3" />
                        <span>{getStatusLabel(application.status)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Applied: {new Date(application.appliedAt).toLocaleDateString()}</span>
                      <span>Vehicle: {application.vehicle.vehicleNumber}</span>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Load Route */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-slate-900 mb-3">Load Route</h4>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <MapPinIcon className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-slate-900 text-sm">{application.load?.loadingLocation?.place}</span>
                          </div>
                          <p className="text-xs text-slate-600 ml-6">{application.load?.loadingLocation?.state}</p>
                        </div>
                        <TruckIcon className="h-4 w-4 text-slate-400" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <MapPinIcon className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium text-slate-900 text-sm">{application.load?.unloadingLocation?.place}</span>
                          </div>
                          <p className="text-xs text-slate-600 ml-6">{application.load?.unloadingLocation?.state}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bid Information */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CurrencyRupeeIcon className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-800">
                            {application.adminAdjustedPrice ? 'Adjusted Price' : 'Original Bid'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600 text-lg">
                            ₹{(application.adminAdjustedPrice || application.bidPrice || 0).toLocaleString()}
                          </p>
                          {application.adminAdjustedPrice && application.bidPrice !== application.adminAdjustedPrice && (
                            <p className="text-xs text-emerald-500 line-through">
                              ₹{application.bidPrice?.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
                      <h5 className="font-medium text-slate-700 mb-2">Vehicle Details</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-slate-600">Type:</span>
                          <p className="font-medium">{application.vehicle.vehicleType}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Size:</span>
                          <p className="font-medium">{application.vehicle.vehicleSize} ft</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Capacity:</span>
                          <p className="font-medium">{application.vehicle.passingLimit} tons</p>
                        </div>
                      
                      </div>
                    </div>

                    {/* Load Requirements */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                      <h5 className="font-medium text-blue-800 mb-2">Load Requirements</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-blue-600">Required:</span>
                          <p className="font-medium text-blue-800">
                            {application.load?.vehicleRequirement?.size}ft {application.load?.vehicleRequirement?.vehicleType}
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-600">Weight:</span>
                          <p className="font-medium text-blue-800">{totalWeight.toLocaleString()} kg</p>
                        </div>
                        <div>
                          <span className="text-blue-600">Loading:</span>
                          <p className="font-medium text-blue-800">
                            {application.load?.loadingDate ? new Date(application.load.loadingDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-600">Payment:</span>
                          <p className="font-medium text-blue-800 uppercase">{application.load?.paymentTerms}</p>
                        </div>
                      </div>
                    </div>

                    {/* Application Message */}
                    {application.message && (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4">
                        <h5 className="font-medium text-purple-800 mb-2">Vehicle Owner Message</h5>
                        <p className="text-sm text-purple-700">"{application.message}"</p>
                      </div>
                    )}

                    {/* Admin Comments */}
                    {application.adminComments && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
                        <h5 className="font-medium text-orange-800 mb-2">Admin Comments</h5>
                        <p className="text-sm text-orange-700">"{application.adminComments}"</p>
                        {application.adminReviewedAt && (
                          <p className="text-xs text-orange-600 mt-1">
                            Reviewed on {new Date(application.adminReviewedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          setSelectedApplication(application);
                          setIsModalOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        icon={<EyeIcon className="h-4 w-4" />}
                      >
                        View Full Details
                      </Button>

                      {application.status === 'admin_review' && (
                        <Button
                          onClick={() => {
                            setSelectedApplication(application);
                            setReviewForm({
                              adjustedPrice: application.bidPrice?.toString() || '',
                              comments: '',
                              action: 'approve'
                            });
                            setIsReviewModalOpen(true);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          icon={<PencilIcon className="h-4 w-4" />}
                        >
                          Review Application
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredApplications.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <DocumentTextIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Applications Found</h3>
            <p className="text-slate-600">No vehicle applications match your current filters</p>
          </motion.div>
        )}

        {/* Application Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Application Details"
          size="xl"
        >
          {selectedApplication && (
            <div className="space-y-6">
              {/* Application Status */}
              <div className={`p-4 rounded-xl border ${getStatusColor(selectedApplication.status)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{getStatusLabel(selectedApplication.status)}</h3>
                    <p className="text-sm opacity-80">
                      Applied on {new Date(selectedApplication.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      ₹{(selectedApplication.adminAdjustedPrice || selectedApplication.bidPrice || 0).toLocaleString()}
                    </p>
                    <p className="text-sm opacity-80">
                      {selectedApplication.adminAdjustedPrice ? 'Adjusted Price' : 'Original Bid'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle Owner Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 mb-3">Vehicle Owner Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Name:</span>
                    <p className="font-medium text-blue-800">{selectedApplication.vehicleOwnerName}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Vehicle:</span>
                    <p className="font-medium text-blue-800">{selectedApplication.vehicle.vehicleNumber}</p>
                  </div>
                </div>
              </div>

              {/* Load Information */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h4 className="font-semibold text-emerald-800 mb-3">Load Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-emerald-600">Route:</span>
                    <p className="font-medium text-emerald-800">
                      {selectedApplication.load?.loadingLocation?.place} → {selectedApplication.load?.unloadingLocation?.place}
                    </p>
                  </div>
                  <div>
                    <span className="text-emerald-600">Loading Date:</span>
                    <p className="font-medium text-emerald-800">
                      {selectedApplication.load?.loadingDate ? new Date(selectedApplication.load.loadingDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  {/* <div>
                    <span className="text-emerald-600">Total Weight:</span>
                    <p className="font-medium text-emerald-800">{totalWeight.toLocaleString()} kg</p>
                  </div> */}
                  <div>
                    <span className="text-emerald-600">Payment:</span>
                    <p className="font-medium text-emerald-800 uppercase">{selectedApplication.load?.paymentTerms}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Specifications */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="font-semibold text-slate-900 mb-3">Vehicle Specifications</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Type:</span>
                    <p className="font-medium">{selectedApplication.vehicle.vehicleType}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Size:</span>
                    <p className="font-medium">{selectedApplication.vehicle.vehicleSize} ft</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Weight:</span>
                    <p className="font-medium">{selectedApplication.vehicle.vehicleWeight} tons</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Capacity:</span>
                    <p className="font-medium">{selectedApplication.vehicle.passingLimit} tons</p>
                  </div>
                
                  <div>
                    <span className="text-slate-600">Tarpaulin:</span>
                    <p className="font-medium capitalize">{selectedApplication.vehicle.tarpaulin}</p>
                  </div>
                </div>
              </div>

              {/* Review Actions */}
              {selectedApplication.status === 'admin_review' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h4 className="font-semibold text-yellow-800 mb-3">Admin Review Required</h4>
                  <p className="text-yellow-700 text-sm mb-4">
                    This application requires admin review before being sent to the load provider.
                  </p>
                  <Button
                    onClick={() => {
                      setReviewForm({
                        adjustedPrice: selectedApplication.bidPrice?.toString() || '',
                        comments: '',
                        action: 'approve'
                      });
                      setIsReviewModalOpen(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    icon={<PencilIcon className="h-4 w-4" />}
                  >
                    Review Application
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Review Modal */}
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title="Review Vehicle Application"
          size="md"
        >
          {selectedApplication && (
            <div className="space-y-6">
              {/* Application Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-slate-900 mb-2">{selectedApplication.vehicleOwnerName}</h3>
                <p className="text-slate-600 text-sm">
                  {selectedApplication.load?.loadingLocation?.place} → {selectedApplication.load?.unloadingLocation?.place}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Vehicle: {selectedApplication.vehicle.vehicleNumber} • Original Bid: ₹{selectedApplication.bidPrice?.toLocaleString()}
                </p>
              </div>

              {/* Review Action */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Review Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setReviewForm(prev => ({ ...prev, action: 'approve' }))}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      reviewForm.action === 'approve'
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-slate-900">Approve</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">Send to load provider</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setReviewForm(prev => ({ ...prev, action: 'reject' }))}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      reviewForm.action === 'reject'
                        ? 'border-red-500 bg-red-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <XCircleIcon className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-slate-900">Reject</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">Reject application</p>
                  </motion.div>
                </div>
              </div>

              {/* Price Adjustment */}
              {reviewForm.action === 'approve' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Adjusted Price (₹) - Optional
                  </label>
                  <Input
                    type="number"
                    placeholder={`Original: ₹${selectedApplication.bidPrice?.toLocaleString()}`}
                    value={reviewForm.adjustedPrice}
                    onChange={(value) => setReviewForm(prev => ({ ...prev, adjustedPrice: value }))}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Leave empty to keep original bid price of ₹{selectedApplication.bidPrice?.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Admin Comments {reviewForm.action === 'reject' ? '(Required)' : '(Optional)'}
                </label>
                <textarea
                  value={reviewForm.comments}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder={
                    reviewForm.action === 'approve' 
                      ? "Add any notes for the load provider..."
                      : "Explain why this application is being rejected..."
                  }
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <Button
                  onClick={() => setIsReviewModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReviewApplication}
                  loading={actionLoading === selectedApplication._id}
                  disabled={reviewForm.action === 'reject' && !reviewForm.comments.trim()}
                  className={`flex-1 ${
                    reviewForm.action === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  icon={reviewForm.action === 'approve' ? <CheckCircleIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
                >
                  {reviewForm.action === 'approve' ? 'Approve Application' : 'Reject Application'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};