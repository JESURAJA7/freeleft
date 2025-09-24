import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  TruckIcon,
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  UserIcon,
  CalendarIcon,
  ScaleIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { Button } from '../../components/common/CustomButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import type { Load, Vehicle } from '../../types/index';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface BiddingModalProps {
  isOpen: boolean;
  onClose: () => void;
  load: Load | null;
  onSelectVehicle: (vehicleId: string, bidPrice: number) => void;
  onSendMessage: (vehicleId: string, message: string) => void;
}

export const BiddingModal: React.FC<BiddingModalProps> = ({
  isOpen,
  onClose,
  load,
  onSelectVehicle,
  onSendMessage
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>('price');
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (isOpen && load) {
      fetchMatchedVehicles();
    }
  }, [isOpen, load]);

  const fetchMatchedVehicles = async () => {
    if (!load) return;
    
    setLoading(true);
    try {
      // Mock API call - replace with actual API
      const response = await fetch(`${API_BASE_URL}/vehicles/matchVehicles/${load.loadId}`);
      const data = await response.json();
      
      if (data.success) {
        setVehicles(data.vehicles);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('Error fetching matched vehicles:', error);
      toast.error('Failed to fetch matched vehicles');
      // Mock data for demonstration
    //   setVehicles([
    //     {
    //       _id: '1',
    //       id: '1',
    //       ownerId: 'owner1',
    //       ownerName: 'Rajesh Kumar',
    //       vehicleType: 'truck',
    //       vehicleNumber: 'MH12AB1234',
    //       vehicleSize: 20,
    //       vehicleWeight: 8000,
    //       passingLimit: 25,
    //       dimensions: { length: 20, width: 8, height: 8 },
    //       preferredOperatingArea: {
    //         state: 'Maharashtra',
    //         district: 'Mumbai',
    //         coordinates: { latitude: 19.0760, longitude: 72.8777 }
    //       },
    //       availability: 'immediate',
    //       rating: 4.8,
    //       totalTrips: 156,
    //       photos: [],
    //       bidPrice: 45000,
    //       matchScore: 95,
    //       estimatedDeliveryTime: '2 days',
    //       distanceFromPickup: 25,
    //       contactInfo: {
    //         phone: '+91 9876543210',
    //         email: 'rajesh@example.com',
    //         whatsapp: '+91 9876543210'
    //       },
    //       ownerMessage: 'Experienced driver with 10+ years. Vehicle is well-maintained and ready for immediate dispatch.',
    //       status: 'available',
    //       isApproved: true,
    //       isOpen: true,
    //       trailerType: 'none',
    //       tarpaulin: true,
    //       createdAt: new Date().toISOString(),
    //       updatedAt: new Date().toISOString()
    //     },
    //     {
    //       _id: '2',
    //       id: '2',
    //       ownerId: 'owner2',
    //       ownerName: 'Suresh Transport',
    //       vehicleType: 'truck',
    //       vehicleNumber: 'GJ05CD5678',
    //       vehicleSize: 22,
    //       vehicleWeight: 9000,
    //       passingLimit: 30,
    //       dimensions: { length: 22, width: 8, height: 9 },
    //       preferredOperatingArea: {
    //         state: 'Gujarat',
    //         district: 'Ahmedabad',
    //         coordinates: { latitude: 23.0225, longitude: 72.5714 }
    //       },
    //       availability: 'today',
    //       rating: 4.5,
    //       totalTrips: 89,
    //       photos: [],
    //       bidPrice: 42000,
    //       matchScore: 88,
    //       estimatedDeliveryTime: '1 day',
    //       distanceFromPickup: 15,
    //       contactInfo: {
    //         phone: '+91 9123456789',
    //         email: 'suresh@transport.com',
    //         whatsapp: '+91 9123456789'
    //       },
    //       ownerMessage: 'Premium service with GPS tracking. Specialized in heavy cargo transport.',
    //       status: 'available',
    //       isApproved: true,
    //       isOpen: true,
    //       trailerType: 'lowbed',
    //       tarpaulin: true,
    //       createdAt: new Date().toISOString(),
    //       updatedAt: new Date().toISOString()
    //     }
    //   ]);
    } finally {
      setLoading(false);
    }
  };

  const sortedVehicles = [...vehicles].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.bidPrice - b.bidPrice;
      case 'rating':
        return b.rating - a.rating;
      case 'distance':
        return (a.distanceFromPickup || 0) - (b.distanceFromPickup || 0);
      default:
        return 0;
    }
  });

  const handleSelectVehicle = (vehicle: Vehicle) => {
    onSelectVehicle(vehicle._id, vehicle.bidPrice);
    onClose();
  };

  const handleSendMessage = async () => {
    if (!selectedVehicle || !message.trim()) return;
    
    try {
      await onSendMessage(selectedVehicle._id, message);
      setMessage('');
      setIsMessageModalOpen(false);
      toast.success('Message sent successfully!');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star}>
            {star <= rating ? (
              <StarSolidIcon className="h-4 w-4 text-yellow-400" />
            ) : (
              <StarIcon className="h-4 w-4 text-slate-300" />
            )}
          </div>
        ))}
        <span className="text-sm text-slate-600 ml-2">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title=""
        fullScreen={true}
      >
        <div className={`h-full flex flex-col ${isFullScreen ? 'p-6' : ''}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Vehicle Bidding</h2>
              {load && (
                <div className="flex items-center mt-2 text-slate-600">
                  <MapPinIcon className="h-5 w-5 mr-1 text-blue-500" />
                  <span className="text-sm">
                    {load.loadingLocation.place} → {load.unloadingLocation.place}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price' | 'rating' | 'distance')}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="price">Sort by Price</option>
                <option value="rating">Sort by Rating</option>
                <option value="distance">Sort by Distance</option>
              </select>

              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
              >
                {isFullScreen ? (
                  <ArrowsPointingInIcon className="h-5 w-5 text-slate-500" />
                ) : (
                  <ArrowsPointingOutIcon className="h-5 w-5 text-slate-500" />
                )}
              </button>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="xl" />
                <span className="ml-3 text-slate-600">Loading available vehicles...</span>
              </div>
            ) : (
              <div className={`grid gap-6 ${isFullScreen ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1 lg:grid-cols-2'}`}>
                <AnimatePresence>
                  {sortedVehicles.map((vehicle, index) => (
                    <motion.div
                      key={vehicle._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full"
                    >
                      {/* Vehicle Header */}
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <TruckIcon className="h-5 w-5" />
                            <span className="font-semibold">{vehicle.vehicleNumber}</span>
                          </div>
                          <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                            <span className="text-sm font-medium">{vehicle.matchScore}% Match</span>
                          </div>
                        </div>
                        <p className="text-blue-100 text-sm">{vehicle.ownerName}</p>
                      </div>

                      <div className="p-6 flex-1 flex flex-col">
                        {/* Rating and Stats */}
                        <div className="flex items-center justify-between mb-4">
                          {renderStars(vehicle.rating)}
                          <span className="text-sm text-slate-600">{vehicle.totalTrips} trips</span>
                        </div>

                        {/* Vehicle Specs */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Size:</span>
                            <span className="font-medium">{vehicle.vehicleSize}ft</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Capacity:</span>
                            <span className="font-medium">{vehicle.passingLimit}T</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Distance:</span>
                            <span className="font-medium">{vehicle.distanceFromPickup}km away</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Delivery:</span>
                            <span className="font-medium">{vehicle.estimatedDeliveryTime}</span>
                          </div>
                        </div>

                        {/* Bid Price */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-700 font-medium">Bid Price</span>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-emerald-800">
                                ₹{vehicle.bidPrice.toLocaleString()}
                              </div>
                              <div className="text-xs text-emerald-600">All inclusive</div>
                            </div>
                          </div>
                        </div>

                        {/* Owner Message */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
                          <p className="text-sm text-slate-700 italic">"{vehicle.ownerMessage}"</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-auto space-y-2">
                          <Button
                            onClick={() => handleSelectVehicle(vehicle)}
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                            icon={<CheckCircleIcon className="h-4 w-4" />}
                          >
                            Accept Bid - ₹{vehicle.bidPrice.toLocaleString()}
                          </Button>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() => {
                                setSelectedVehicle(vehicle);
                                setIsMessageModalOpen(true);
                              }}
                              variant="outline"
                              size="sm"
                              icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
                            >
                              Message
                            </Button>
                            <Button
                              onClick={() => window.open(`tel:${vehicle.contactInfo.phone}`)}
                              variant="outline"
                              size="sm"
                              icon={<PhoneIcon className="h-4 w-4" />}
                            >
                              Call
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Empty State */}
            {!loading && sortedVehicles.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <TruckIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Matching Vehicles Found</h3>
                <p className="text-slate-600 mb-6">
                  No vehicles currently match your load requirements. Try adjusting your criteria or check back later.
                </p>
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </Modal>

      {/* Message Modal */}
      <Modal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        title={`Message ${selectedVehicle?.ownerName}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-slate-900">{selectedVehicle?.ownerName}</h4>
                <p className="text-sm text-slate-600">{selectedVehicle?.vehicleNumber}</p>
              </div>
            </div>
            <div className="text-sm text-slate-600">
              <p>Bid: ₹{selectedVehicle?.bidPrice.toLocaleString()}</p>
              <p>Rating: {selectedVehicle?.rating}/5 ({selectedVehicle?.totalTrips} trips)</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message to the vehicle owner..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => setIsMessageModalOpen(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="flex-1"
              icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
            >
              Send Message
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};