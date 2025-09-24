import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  TruckIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EyeIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  ScaleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type { Vehicle, Load } from '../../types/index';
import { Button } from '../../components/common/CustomButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface MatchedVehicle extends Vehicle {
  bidPrice: number;
  matchScore: number;
  estimatedDeliveryTime: string;
  contactInfo: {
    phone: string;
    email: string;
    whatsapp: string;
  };
  ownerMessage: string;
}

interface VehicleMatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  load: Load | null;
  onVehicleSelect: (vehicleId: string) => void;
  unsavedLoadMessage?: string;
}

export const VehicleMatchingModal: React.FC<VehicleMatchingModalProps> = ({
  isOpen,
  onClose,
  load,
  onVehicleSelect,
  unsavedLoadMessage = "Please save the load first to view matched vehicles"
}) => {
  const [matchedVehicles, setMatchedVehicles] = useState<MatchedVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<MatchedVehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>('price');
  const [showContactModal, setShowContactModal] = useState(false);

  // Helper function to validate MongoDB ObjectId
  const isValidObjectId = (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  const isLoadSaved = load && isValidObjectId(load.loadId);
  console.log('isLoadSaved:', isLoadSaved);
  console.log('Load', load);

  useEffect(() => {
    if (isOpen && isLoadSaved) {
      fetchMatchedVehicles();
    } else if (isOpen) {
      // If modal is open but load is not saved, reset vehicles
      setMatchedVehicles([]);
      setLoading(false);
    }
  }, [isOpen, load?.loadId]);

  const fetchMatchedVehicles = async () => {
    if (!isLoadSaved) return;
    
    const token = Cookies.get('xbow_token');
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/vehicles/matchVehicles/${load.loadId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch matched vehicles`);
      }

      const data = await response.json();
      setMatchedVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Error fetching matched vehicles:', error);
      toast.error('Failed to load matched vehicles');
      setMatchedVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const sortVehicles = (vehicles: MatchedVehicle[], sortType: string) => {
    return [...vehicles].sort((a, b) => {
      switch (sortType) {
        case 'price':
          return b.bidPrice - a.bidPrice;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'distance':
          return a.matchScore - b.matchScore;
        default:
          return 0;
      }
    });
  };

  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star}>
            {star <= rating ? (
              <StarIconSolid className="h-4 w-4 text-yellow-400" />
            ) : (
              <StarIcon className="h-4 w-4 text-gray-300" />
            )}
          </div>
        ))}
        <span className="text-sm text-slate-600 ml-1">({rating})</span>
      </div>
    );
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'immediate': return 'bg-green-100 text-green-700 border-green-200';
      case 'today': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'tomorrow': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleContactOwner = (vehicle: MatchedVehicle) => {
    setSelectedVehicle(vehicle);
    setShowContactModal(true);
  };

  const handleSelectVehicle = (vehicleId: string) => {
    onVehicleSelect(vehicleId);
    onClose();
    toast.success('Vehicle selected successfully!');
  };

  const sortedVehicles = sortVehicles(matchedVehicles, sortBy);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Matched Vehicles</h3>
              {isLoadSaved ? (
                <p className="text-blue-100">
                  {matchedVehicles.length} vehicles found for your load • Sorted by {sortBy}
                </p>
              ) : (
                <p className="text-blue-100">{unsavedLoadMessage}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {isLoadSaved && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'price' | 'rating' | 'distance')}
                  className="px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  <option value="price" className="text-slate-900">Price (High to Low)</option>
                  <option value="rating" className="text-slate-900">Rating</option>
                  <option value="distance" className="text-slate-900">Distance</option>
                </select>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {!isLoadSaved ? (
            <div className="text-center py-16">
              <TruckIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Load Not Saved</h3>
              <p className="text-slate-600 mb-6">
                {unsavedLoadMessage}
              </p>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {sortedVehicles.map((vehicle, index) => (
                  <motion.div
                    key={vehicle._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                  >
                    {/* Vehicle Image with Price Overlay */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={vehicle.photos[0]?.url || 'https://images.pexels.com/photos/1198171/pexels-photo-1198171.jpeg'}
                        alt={`${vehicle.vehicleType} - ${vehicle.vehicleNumber}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                      
                      {/* Price Badge */}
                      <div className="absolute top-4 right-4">
                        <div className="bg-emerald-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg backdrop-blur-sm">
                          ₹{vehicle.bidPrice.toLocaleString()}
                        </div>
                      </div>

                      {/* Availability Badge */}
                      <div className="absolute top-4 left-4">
                        <div className={`px-3 py-1 rounded-full border text-xs font-medium backdrop-blur-sm ${getAvailabilityColor(vehicle.availability)}`}>
                          {vehicle.availability.charAt(0).toUpperCase() + vehicle.availability.slice(1)}
                        </div>
                      </div>

                      {/* Match Score */}
                      <div className="absolute bottom-4 left-4">
                        <div className="bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-200">
                          <span className="text-xs font-medium text-slate-700">
                            {vehicle.matchScore}% Match
                          </span>
                        </div>
                      </div>

                      {/* Vehicle Number */}
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg">
                          <span className="text-sm font-bold">{vehicle.vehicleNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="p-6">
                      {/* Owner Info */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">{vehicle.ownerName}</h3>
                          <p className="text-sm text-slate-600">Vehicle Owner</p>
                        </div>
                        <div className="text-right">
                          {renderStars(vehicle.rating)}
                          <p className="text-xs text-slate-600 mt-1">{vehicle.totalTrips} trips</p>
                        </div>
                      </div>

                      {/* Vehicle Specs Grid */}
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <TruckIcon className="h-4 w-4 text-slate-500" />
                            <div>
                              <span className="text-slate-600">Type:</span>
                              <p className="font-semibold text-slate-900">{vehicle.vehicleType}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <ScaleIcon className="h-4 w-4 text-slate-500" />
                            <div>
                              <span className="text-slate-600">Capacity:</span>
                              <p className="font-semibold text-slate-900">{vehicle.passingLimit}T</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPinIcon className="h-4 w-4 text-slate-500" />
                            <div>
                              <span className="text-slate-600">Size:</span>
                              <p className="font-semibold text-slate-900">{vehicle.vehicleSize} ft</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="h-4 w-4 text-slate-500" />
                            <div>
                              <span className="text-slate-600">ETA:</span>
                              <p className="font-semibold text-slate-900">{vehicle.estimatedDeliveryTime}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                        <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                          <UserIcon className="h-4 w-4 mr-2" />
                          Contact Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-blue-600">Phone:</span>
                            <a 
                              href={`tel:${vehicle.contactInfo.phone}`}
                              className="font-medium text-blue-800 hover:text-blue-900 transition-colors"
                            >
                              {vehicle.contactInfo.phone}
                            </a>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-blue-600">Email:</span>
                            <a 
                              href={`mailto:${vehicle.contactInfo.email}`}
                              className="font-medium text-blue-800 hover:text-blue-900 transition-colors"
                            >
                              {vehicle.contactInfo.email}
                            </a>
                          </div>
                          {vehicle.contactInfo.whatsapp && (
                            <div className="flex items-center justify-between">
                              <span className="text-blue-600">WhatsApp:</span>
                              <a 
                                href={`https://wa.me/${vehicle.contactInfo.whatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-800 hover:text-blue-900 transition-colors"
                              >
                                {vehicle.contactInfo.whatsapp}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Owner Message */}
                      {vehicle.ownerMessage && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                          <h4 className="font-semibold text-emerald-800 mb-2 flex items-center">
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                            Message from Owner
                          </h4>
                          <p className="text-sm text-emerald-700 italic">"{vehicle.ownerMessage}"</p>
                        </div>
                      )}

                      {/* Location */}
                      <div className="flex items-center space-x-2 mb-4">
                        <MapPinIcon className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {vehicle.preferredOperatingArea.place}, {vehicle.preferredOperatingArea.state}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        <Button
                          onClick={() => handleContactOwner(vehicle)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          icon={<PhoneIcon className="h-4 w-4" />}
                        >
                          Contact
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setShowContactModal(true);
                          }}
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          icon={<EyeIcon className="h-4 w-4" />}
                        >
                          Details
                        </Button>
                        <Button
                          onClick={() => handleSelectVehicle(vehicle._id)}
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          icon={<CheckCircleIcon className="h-4 w-4" />}
                        >
                          Select
                        </Button>
                      </div>
                    </div>

                    {/* Price Highlight Footer */}
                    <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Competitive Bid</span>
                        <span className="text-lg font-bold">₹{vehicle.bidPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty State for saved loads */}
          {isLoadSaved && !loading && matchedVehicles.length === 0 && (
            <div className="text-center py-16">
              <TruckIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Matching Vehicles Found</h3>
              <p className="text-slate-600 mb-6">
                No vehicles currently match your load requirements. Try adjusting your criteria or check back later.
              </p>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          )}
        </div>

        {/* Contact Modal */}
        <AnimatePresence>
          {showContactModal && selectedVehicle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
              onClick={() => setShowContactModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-bold text-slate-900">Vehicle Details</h4>
                    <button
                      onClick={() => setShowContactModal(false)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5 text-slate-500" />
                    </button>
                  </div>

                  {/* Detailed Vehicle Info */}
                  <div className="space-y-6">
                    {/* Owner & Pricing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h5 className="font-semibold text-blue-800 mb-3">Owner Details</h5>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-blue-600">Name:</span> <span className="font-medium">{selectedVehicle.ownerName}</span></p>
                          <p><span className="text-blue-600">Phone:</span> <span className="font-medium">{selectedVehicle.contactInfo.phone}</span></p>
                          <p><span className="text-blue-600">Email:</span> <span className="font-medium">{selectedVehicle.contactInfo.email}</span></p>
                          <div className="flex items-center justify-between">
                            <span className="text-blue-600">Rating:</span>
                            {renderStars(selectedVehicle.rating)}
                          </div>
                        </div>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <h5 className="font-semibold text-emerald-800 mb-3">Pricing & Timeline</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-600">Bid Price:</span>
                            <span className="text-2xl font-bold text-emerald-700">₹{selectedVehicle.bidPrice.toLocaleString()}</span>
                          </div>
                          <p><span className="text-emerald-600">Delivery Time:</span> <span className="font-medium">{selectedVehicle.estimatedDeliveryTime}</span></p>
                          <p><span className="text-emerald-600">Match Score:</span> <span className="font-medium">{selectedVehicle.matchScore}%</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Specifications */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <h5 className="font-semibold text-slate-900 mb-3">Vehicle Specifications</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Type:</span>
                          <p className="font-medium text-slate-900">{selectedVehicle.vehicleType}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Size:</span>
                          <p className="font-medium text-slate-900">{selectedVehicle.vehicleSize} ft</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Weight:</span>
                          <p className="font-medium text-slate-900">{selectedVehicle.vehicleWeight}T</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Limit:</span>
                          <p className="font-medium text-slate-900">{selectedVehicle.passingLimit}T</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                      <Button
                        onClick={() => window.open(`tel:${selectedVehicle.contactInfo.phone}`)}
                        variant="outline"
                        className="flex-1"
                        icon={<PhoneIcon className="h-4 w-4" />}
                      >
                        Call Owner
                      </Button>
                      <Button
                        onClick={() => handleSelectVehicle(selectedVehicle._id)}
                        variant="primary"
                        className="flex-1"
                        icon={<CheckCircleIcon className="h-4 w-4" />}
                      >
                        Select Vehicle
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};