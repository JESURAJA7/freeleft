import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';
import { Modal } from '../common/Modal';
import { Button } from '../common/CustomButton';
import { LoadStatusTracker } from './LoadStatusTracker';
import { RatingModal } from '../Rating/RatingModal';
import { vehicleMatchingAPI } from '../../services/api';
import type { VehicleRequest } from '../../types/index';
import toast from 'react-hot-toast';

interface LoadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleRequests: VehicleRequest[];
  onStatusUpdate: () => void;
}

export const LoadProgressModal: React.FC<LoadProgressModalProps> = ({
  isOpen,
  onClose,
  vehicleRequests,
  onStatusUpdate
}) => {
  const [selectedRequest, setSelectedRequest] = useState<VehicleRequest | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const updateLoadStatus = async (loadId: string, newStatus: string) => {
    try {
      setUpdating(loadId);
      // This would call your load status update API
      await vehicleMatchingAPI.updateLoadStatus(loadId, newStatus);
      toast.success('Load status updated successfully');
      onStatusUpdate();
    } catch (error: any) {
      console.error('Error updating load status:', error);
      toast.error('Failed to update load status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'enroute': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title=""
        size="xl"
        fullScreen={true}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Load Progress</h2>
                <p className="text-emerald-100">Track your active load assignments</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-sm">Active Loads</p>
                <p className="text-white font-semibold text-2xl">{vehicleRequests.length}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {vehicleRequests.length === 0 ? (
              <div className="text-center py-16">
                <TruckIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Active Loads</h3>
                <p className="text-slate-600">You don't have any active load assignments at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence>
                  {vehicleRequests.map((request, index) => (
                    <motion.div
                      key={request._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
                    >
                      {/* Request Header */}
                      <div className="bg-gradient-to-r from-slate-50 to-emerald-50 p-4 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <TruckIcon className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{request.loadProviderName}</h3>
                              <p className="text-sm text-slate-600">Load Provider</p>
                            </div>
                          </div>
                          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(request.load?.status || 'assigned')}`}>
                            <span className="capitalize">{request.load?.status || 'assigned'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-slate-600">
                          <span>Vehicle: {request.vehicle.vehicleNumber}</span>
                          <span>Accepted: {new Date(request.respondedAt || request.sentAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="p-4">
                        {/* Route */}
                        <div className="mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <MapPinIcon className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-slate-900 text-sm">{request.load.loadingLocation.place}</span>
                              </div>
                              <p className="text-xs text-slate-600 ml-6">{request.load.loadingLocation.state}</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-0.5 bg-slate-300 mb-1"></div>
                              <TruckIcon className="h-4 w-4 text-slate-400" />
                              <div className="w-8 h-0.5 bg-slate-300 mt-1"></div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <MapPinIcon className="h-4 w-4 text-emerald-600" />
                                <span className="font-medium text-slate-900 text-sm">{request.load.unloadingLocation.place}</span>
                              </div>
                              <p className="text-xs text-slate-600 ml-6">{request.load.unloadingLocation.state}</p>
                            </div>
                          </div>
                        </div>

                        {/* Load Details */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-slate-600">Loading Date:</span>
                              <p className="font-medium text-slate-900">{new Date(request.load.loadingDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="text-slate-600">Payment:</span>
                              <p className="font-medium text-slate-900 uppercase">{request.load.paymentTerms}</p>
                            </div>
                            <div>
                              <span className="text-slate-600">Materials:</span>
                              <p className="font-medium text-slate-900">{request.load.materials?.length || 0} items</p>
                            </div>
                            <div>
                              <span className="text-slate-600">Total Weight:</span>
                              <p className="font-medium text-slate-900">
                                {(request.load.materials?.reduce((sum, material) => sum + material.totalWeight, 0) || 0)} kg
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              onClick={() => {
                                setSelectedRequest(request);
                              }}
                              variant="outline"
                              size="sm"
                              icon={<ClockIcon className="h-4 w-4" />}
                            >
                              View Timeline
                            </Button>
                            
                            {request.load?.status !== 'completed' && (
                              <Button
                                onClick={() => {
                                  const nextStatus = request.load?.status === 'assigned' ? 'enroute' :
                                                   request.load?.status === 'enroute' ? 'delivered' :
                                                   request.load?.status === 'delivered' ? 'completed' : 'enroute';
                                  updateLoadStatus(request.load._id, nextStatus);
                                }}
                                loading={updating === request.load._id}
                                variant="secondary"
                                size="sm"
                                icon={<CheckCircleIcon className="h-4 w-4" />}
                              >
                                {request.load?.status === 'assigned' ? 'Start Journey' :
                                 request.load?.status === 'enroute' ? 'Mark Delivered' :
                                 request.load?.status === 'delivered' ? 'Complete Load' : 'Update Status'}
                              </Button>
                            )}
                          </div>

                          {request.load?.status === 'completed' && (
                            <Button
                              onClick={() => {
                                setSelectedRequest(request);
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
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Status Timeline Modal */}
      {selectedRequest && !isRatingModalOpen && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title="Load Timeline"
          size="lg"
        >
          <LoadStatusTracker
            currentStatus={selectedRequest.load?.status || 'assigned'}
            loadingDate={selectedRequest.load.loadingDate}
            onStatusChange={(status) => updateLoadStatus(selectedRequest.load._id, status)}
            canUpdateStatus={true}
            assignedVehicle={{
              vehicleNumber: selectedRequest.vehicle.vehicleNumber,
              ownerName: selectedRequest.vehicle.ownerName
            }}
          />
        </Modal>
      )}

      {/* Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => {
          setIsRatingModalOpen(false);
          setSelectedRequest(null);
        }}
        load={selectedRequest?.load || null}
        vehicle={selectedRequest?.vehicle || null}
        userType="vehicle_owner"
        onRatingSubmitted={() => {
          setIsRatingModalOpen(false);
          setSelectedRequest(null);
          onStatusUpdate();
        }}
      />
    </>
  );
};