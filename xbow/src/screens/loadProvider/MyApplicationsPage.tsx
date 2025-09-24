import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  EyeIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { vehicleMatchingAPI } from '../../services/api';
import type { VehicleApplication } from '../../types/index';
import { Button } from '../../components/common/CustomButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { RatingModal } from '../../components/Rating/RatingModal';
import { LoadStatusTracker } from '../../components/loads/LoadStatusTracker';
import toast from 'react-hot-toast';

export const MyApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<VehicleApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<VehicleApplication | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await vehicleMatchingAPI.getMyApplications();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return ClockIcon;
      case 'accepted': return CheckCircleIcon;
      case 'rejected': return XCircleIcon;
      default: return DocumentTextIcon;
    }
  };

  const filteredApplications = applications.filter(app => 
    statusFilter === 'all' || app.status === statusFilter
  );

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Applications</h1>
          <p className="text-slate-600">Track your vehicle applications and assignments</p>
        </motion.div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All Applications</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <p className="text-sm text-slate-600">
              Showing {filteredApplications.length} of {applications.length} applications
            </p>
          </div>
        </motion.div>

        {/* Applications Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <AnimatePresence>
            {filteredApplications.map((application, index) => {
              const StatusIcon = getStatusIcon(application.status);
              
              return (
                <motion.div
                  key={application._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-slate-50 to-emerald-50 p-4 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(application.status)}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-sm font-medium capitalize">{application.status}</span>
                      </div>
                      {application.bidPrice && (
                        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                          <span className="text-sm font-medium">₹{application.bidPrice.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Applied: {new Date(application.appliedAt).toLocaleDateString()}</span>
                      <span>Vehicle: {application.vehicle.vehicleNumber}</span>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Route */}
                    <div className="mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <MapPinIcon className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-slate-900">Loading</span>
                          </div>
                          <p className="text-sm text-slate-600">Pickup location details</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-0.5 bg-slate-300 mb-1"></div>
                          <TruckIcon className="h-4 w-4 text-slate-400" />
                          <div className="w-8 h-0.5 bg-slate-300 mt-1"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <MapPinIcon className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium text-slate-900">Delivery</span>
                          </div>
                          <p className="text-sm text-slate-600">Drop location details</p>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                      <h4 className="font-medium text-slate-900 mb-3">Your Vehicle</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-600">Type:</span>
                          <p className="font-medium text-slate-900">{application.vehicle.vehicleType}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Size:</span>
                          <p className="font-medium text-slate-900">{application.vehicle.vehicleSize} ft</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Capacity:</span>
                          <p className="font-medium text-slate-900">{application.vehicle.passingLimit} tons</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Status:</span>
                          <p className="font-medium text-slate-900 capitalize">{application.vehicle.status}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => {
                            setSelectedApplication(application);
                            setIsModalOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                          icon={<EyeIcon className="h-4 w-4" />}
                        >
                          View Details
                        </Button>
                        
                        {application.status === 'accepted' && (
                          <Button
                            onClick={() => {
                              setSelectedApplication(application);
                              setIsStatusModalOpen(true);
                            }}
                            variant="secondary"
                            size="sm"
                            icon={<ClockIcon className="h-4 w-4" />}
                          >
                            Track Status
                          </Button>
                        )}
                      </div>

                      {/* Rating Button for Completed Loads */}
                      {application.status === 'accepted' && (
                        <Button
                          onClick={() => {
                            setSelectedApplication(application);
                            setIsRatingModalOpen(true);
                          }}
                          className="w-full bg-yellow-500 hover:bg-yellow-600"
                          icon={<StarIcon className="h-4 w-4" />}
                        >
                          Rate Load Provider
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
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {applications.length === 0 ? 'No applications yet' : 'No applications match your filter'}
            </h3>
            <p className="text-slate-600 mb-6">
              {applications.length === 0 
                ? 'Start applying for loads to see your applications here'
                : 'Try changing your filter to see more applications'
              }
            </p>
          </motion.div>
        )}

        {/* Application Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Application Details"
          size="lg"
        >
          {selectedApplication && (
            <div className="space-y-6">
              {/* Application Status */}
              <div className={`p-4 rounded-xl border ${getStatusColor(selectedApplication.status)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold capitalize">{selectedApplication.status} Application</h3>
                    <p className="text-sm opacity-80">
                      Applied on {new Date(selectedApplication.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedApplication.bidPrice && (
                    <div className="text-right">
                      <p className="font-bold text-lg">₹{selectedApplication.bidPrice.toLocaleString()}</p>
                      <p className="text-sm opacity-80">Your Bid</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="font-semibold text-slate-900 mb-3">Vehicle Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Number:</span>
                    <p className="font-medium text-slate-900">{selectedApplication.vehicle.vehicleNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Type:</span>
                    <p className="font-medium text-slate-900">{selectedApplication.vehicle.vehicleType}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Size:</span>
                    <p className="font-medium text-slate-900">{selectedApplication.vehicle.vehicleSize} ft</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Capacity:</span>
                    <p className="font-medium text-slate-900">{selectedApplication.vehicle.passingLimit} tons</p>
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedApplication.message && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Your Message</h4>
                  <p className="text-blue-700">"{selectedApplication.message}"</p>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Status Tracking Modal */}
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          title="Load Status"
          size="lg"
        >
          {selectedApplication && (
            <LoadStatusTracker
              currentStatus="assigned" // This would come from the load status
              onStatusChange={() => {}} // Vehicle owners can't change status
              canUpdateStatus={false}
              loadingDate={new Date().toISOString()}
              assignedVehicle={{
                vehicleNumber: selectedApplication.vehicle.vehicleNumber,
                ownerName: selectedApplication.vehicleOwnerName
              }}
            />
          )}
        </Modal>

        {/* Rating Modal */}
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          load={null} // Would need to fetch load details
          vehicle={selectedApplication?.vehicle || null}
          userType="vehicle_owner"
          onRatingSubmitted={() => {
            setIsRatingModalOpen(false);
            fetchApplications();
          }}
        />
      </div>
    </div>
  );
};