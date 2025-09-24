import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TruckIcon,
  MapPinIcon,
  StarIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { Modal } from '../common/Modal';
import { Button } from '../common/CustomButton';
import type { VehicleRequest } from '../../types/index';

interface LoadHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedRequests: VehicleRequest[];
}

export const LoadHistoryModal: React.FC<LoadHistoryModalProps> = ({
  isOpen,
  onClose,
  completedRequests
}) => {
  const [selectedRequest, setSelectedRequest] = useState<VehicleRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const calculateEarnings = () => {
    return completedRequests.reduce((total, request) => {
      return total + (request.load?.commissionAmount || 0);
    }, 0);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => {
      const StarComponent = index < rating ? StarSolidIcon : StarIcon;
      return (
        <StarComponent
          key={index}
          className={`h-4 w-4 ${index < rating ? 'text-yellow-400' : 'text-slate-300'}`}
        />
      );
    });
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Load History</h2>
                <p className="text-blue-100">Your completed load assignments and earnings</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Total Earnings</p>
                <p className="text-white font-semibold text-2xl">₹{calculateEarnings().toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white border-b border-slate-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{completedRequests.length}</p>
                <p className="text-sm text-slate-600">Completed Loads</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">₹{calculateEarnings().toLocaleString()}</p>
                <p className="text-sm text-slate-600">Total Earnings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">4.8</p>
                <p className="text-sm text-slate-600">Average Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {completedRequests.length > 0 ? Math.round(calculateEarnings() / completedRequests.length) : 0}
                </p>
                <p className="text-sm text-slate-600">Avg per Load</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {completedRequests.length === 0 ? (
              <div className="text-center py-16">
                <TruckIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Completed Loads</h3>
                <p className="text-slate-600">You haven't completed any loads yet. Start applying for loads to build your history!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {completedRequests.map((request, index) => (
                    <motion.div
                      key={request._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                              <TruckIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{request.loadProviderName}</h3>
                              <p className="text-sm text-slate-600">Load Provider</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200 mb-2">
                              <span className="text-sm font-medium">Completed</span>
                            </div>
                            <p className="text-sm text-slate-600">
                              {new Date(request.load.createdAt || request.respondedAt || request.sentAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Route */}
                        <div className="mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <MapPinIcon className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-slate-900">{request.load.loadingLocation.place}</span>
                              </div>
                              <p className="text-sm text-slate-600 ml-6">{request.load.loadingLocation.state}</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-0.5 bg-slate-300 mb-1"></div>
                              <TruckIcon className="h-4 w-4 text-slate-400" />
                              <div className="w-12 h-0.5 bg-slate-300 mt-1"></div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <MapPinIcon className="h-4 w-4 text-emerald-600" />
                                <span className="font-medium text-slate-900">{request.load.unloadingLocation.place}</span>
                              </div>
                              <p className="text-sm text-slate-600 ml-6">{request.load.unloadingLocation.state}</p>
                            </div>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <TruckIcon className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Vehicle</span>
                            </div>
                            <p className="text-sm text-blue-700">{request.vehicle.vehicleNumber}</p>
                          </div>
                          
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <CurrencyRupeeIcon className="h-4 w-4 text-emerald-600" />
                              <span className="text-sm font-medium text-emerald-800">Earnings</span>
                            </div>
                            <p className="text-sm text-emerald-700">₹{(request.load?.commissionAmount || 0).toLocaleString()}</p>
                          </div>
                          
                          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <CalendarIcon className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-800">Duration</span>
                            </div>
                            <p className="text-sm text-orange-700">3 days</p>
                          </div>
                          
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <StarIcon className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800">Rating</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {renderStars(5)}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-3">
                          <Button
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsDetailsModalOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            icon={<EyeIcon className="h-4 w-4" />}
                          >
                            View Details
                          </Button>
                          <Button
                            onClick={() => {
                              // Handle message functionality
                            }}
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
                          >
                            Message Provider
                          </Button>
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

      {/* Load Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedRequest(null);
        }}
        title="Load Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Load Summary */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">Completed Load</h3>
                  <p className="text-green-700">Load #{selectedRequest.load._id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-600 text-sm">Total Earnings</p>
                  <p className="text-green-800 font-semibold text-xl">₹{(selectedRequest.load?.commissionAmount || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Route Information */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Route Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="font-medium text-slate-700 mb-2">Loading Location</h4>
                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-900">{selectedRequest.load.loadingLocation.place}</p>
                    <p>{selectedRequest.load.loadingLocation.district}, {selectedRequest.load.loadingLocation.state}</p>
                    <p>PIN: {selectedRequest.load.loadingLocation.pincode}</p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="font-medium text-slate-700 mb-2">Delivery Location</h4>
                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-900">{selectedRequest.load.unloadingLocation.place}</p>
                    <p>{selectedRequest.load.unloadingLocation.district}, {selectedRequest.load.unloadingLocation.state}</p>
                    <p>PIN: {selectedRequest.load.unloadingLocation.pincode}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Vehicle Used</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Vehicle Number:</span>
                    <p className="font-medium text-slate-900">{selectedRequest.vehicle.vehicleNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Vehicle Type:</span>
                    <p className="font-medium text-slate-900">{selectedRequest.vehicle.vehicleType}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Size:</span>
                    <p className="font-medium text-slate-900">{selectedRequest.vehicle.vehicleSize} ft</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Capacity:</span>
                    <p className="font-medium text-slate-900">{selectedRequest.vehicle.passingLimit} tons</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Materials */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Materials Transported</h3>
              <div className="space-y-3">
                {selectedRequest.load.materials?.map((material, index) => (
                  <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900">{material.name}</h4>
                      <span className="text-sm font-medium text-slate-700">{material.totalWeight} kg</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-slate-600">
                      <div>
                        <span>Dimensions:</span>
                        <p>{material.dimensions.length}×{material.dimensions.width}×{material.dimensions.height} ft</p>
                      </div>
                      <div>
                        <span>Count:</span>
                        <p>{material.totalCount}</p>
                      </div>
                      <div>
                        <span>Pack Type:</span>
                        <p className="capitalize">{material.packType}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};