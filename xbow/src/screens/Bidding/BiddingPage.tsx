import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Truck,
  MapPin,
  IndianRupee,
  User,
  CheckCircle,
  Star,
  Calendar,
  Scale
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { biddingAPI, loadAPI, vehicleAPI } from '../../services/api';
import type { Load, BiddingSession, Bid, Vehicle } from '../../types';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';

interface BiddingPageProps {
  load: Load;
  onBack: () => void;
  onVehicleSelect: (vehicleId: string) => void;
}

 export const BiddingPage: React.FC<BiddingPageProps> = ({ load: initialLoad, onBack, onVehicleSelect }) => {
  const { loadId } = useParams<{ loadId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinBiddingRoom, leaveBiddingRoom, onNewBid, onBiddingClosed, offNewBid, offBiddingClosed } = useSocket();

  const [load, setLoad] = useState<Load | null>(initialLoad || null);
  const [biddingSession, setBiddingSession] = useState<BiddingSession | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidMessage, setBidMessage] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [isPlaceBidModalOpen, setIsPlaceBidModalOpen] = useState(false);
  const [isTransportRequestModalOpen, setIsTransportRequestModalOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [transportMessage, setTransportMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (loadId) {
      fetchData();
    }
  }, [loadId]);

  useEffect(() => {
    if (biddingSession) {
      joinBiddingRoom(biddingSession._id);

      onNewBid(handleNewBid);
      onBiddingClosed(handleBiddingClosed);

      return () => {
        leaveBiddingRoom(biddingSession._id);
        offNewBid();
        offBiddingClosed();
      };
    }
  }, [biddingSession]);

  useEffect(() => {
    if (biddingSession && biddingSession.status === 'active') {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const endTime = new Date(biddingSession.endTime).getTime();
        const remaining = Math.max(0, endTime - now);

        setTimeRemaining(remaining);

        if (remaining === 0) {
          setBiddingSession(prev => prev ? { ...prev, status: 'closed' } : null);
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [biddingSession]);

  const fetchData = async () => {
    if (!loadId) return;

    try {
      setLoading(true);

      const loadResponse = await loadAPI.getLoad(loadId);
      if (loadResponse.data.success) {
        setLoad(loadResponse.data.data);
      }

      const sessionResponse = await biddingAPI.getBiddingSessionByLoad(loadId);
      if (sessionResponse.data.success) {
        setBiddingSession(sessionResponse.data.data);

        const bidsResponse = await biddingAPI.getBidsForSession(sessionResponse.data.data._id);
        if (bidsResponse.data.success) {
          setBids(bidsResponse.data.data);
        }
      }

      if (user?.role === 'vehicle_owner') {
        const vehiclesResponse = await vehicleAPI.getMyVehicles();
        if (vehiclesResponse.data.success) {
          setMyVehicles(vehiclesResponse.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching bidding data:', error);
      toast.error('Failed to load bidding information');
    } finally {
      setLoading(false);
    }
  };

  const handleNewBid = useCallback((newBid: Bid) => {
    setBids(prev => {
      const existingIndex = prev.findIndex(bid => bid._id === newBid._id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newBid;
        return updated.sort((a, b) => b.bidAmount - a.bidAmount);
      } else {
        return [newBid, ...prev].sort((a, b) => b.bidAmount - a.bidAmount);
      }
    });
  }, []);

  const handleBiddingClosed = useCallback((sessionId: string) => {
    if (biddingSession?._id === sessionId) {
      setBiddingSession(prev => prev ? { ...prev, status: 'closed' } : null);
      toast('Bidding session has ended');
    }
  }, [biddingSession]);

  const handlePlaceBid = async () => {
    if (!biddingSession || !selectedVehicle || !bidAmount) {
      toast.error('Please select a vehicle and enter bid amount');
      return;
    }

    try {
      setPlacing(true);
      const response = await biddingAPI.placeBid(
        biddingSession._id,
        selectedVehicle._id,
        Number(bidAmount),
        bidMessage.trim() || undefined
      );

      if (response.data.success) {
        toast.success('Bid placed successfully!');
        setIsPlaceBidModalOpen(false);
        setBidAmount('');
        setBidMessage('');
        setSelectedVehicle(null);
      }
    } catch (error: any) {
      console.error('Error placing bid:', error);
      toast.error(error.response?.data?.message || 'Failed to place bid');
    } finally {
      setPlacing(false);
    }
  };

  const handleSendTransportRequest = async () => {
    if (!selectedBid) return;

    try {
      const response = await biddingAPI.sendTransportRequest(
        selectedBid._id,
        transportMessage.trim() || undefined
      );

      if (response.data.success) {
        toast.success('Transport request sent successfully!');
        setIsTransportRequestModalOpen(false);
        setTransportMessage('');
        setSelectedBid(null);
      }
    } catch (error: any) {
      console.error('Error sending transport request:', error);
      toast.error(error.response?.data?.message || 'Failed to send transport request');
    }
  };

  const formatTimeRemaining = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const canPlaceBid = () => {
    return user?.role === 'vehicle_owner' &&
      biddingSession?.status === 'active' &&
      timeRemaining > 0 &&
      myVehicles.length > 0;
  };

  const canSelectWinner = () => {
    return user?.role === 'load_provider' &&
      user?.id === load?.loadProviderId &&
      biddingSession?.status === 'closed' &&
      bids.length > 0;
  };

  const getMyBid = () => {
    return bids.find(bid => bid.vehicleOwnerId === user?.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!load || !biddingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Bidding Session Not Found</h2>
          <p className="text-slate-600 mb-4">The bidding session for this load could not be found.</p>
          <Button onClick={() => navigate('/live-bidding')}>
            Back to Live Bidding
          </Button>
        </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Live Bidding</h1>
              <p className="text-slate-600">
                {load.loadingLocation.place} → {load.unloadingLocation.place}
              </p>
            </div>
            <Button
              onClick={() => navigate('/live-bidding')}
              variant="outline"
            >
              Back to Marketplace
            </Button>
          </div>
        </motion.div>

        {/* Bidding Status & Timer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl shadow-lg border p-6 mb-8 ${biddingSession.status === 'active'
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
              : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Clock className="h-8 w-8" />
              <div>
                <h2 className="text-xl font-bold">
                  {biddingSession.status === 'active' ? 'Bidding Active' : 'Bidding Closed'}
                </h2>
                <p className="opacity-90">
                  {biddingSession.status === 'active'
                    ? `Ends: ${new Date(biddingSession.endTime).toLocaleString()}`
                    : `Ended: ${new Date(biddingSession.endTime).toLocaleString()}`
                  }
                </p>
                <div className="flex items-center mt-1">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-300' : 'bg-red-300'}`} />
                  <span className="text-xs opacity-75">
                    {isConnected ? 'Live connection' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>

            {biddingSession.status === 'active' && (
              <div className="text-right">
                <div className="text-3xl font-bold font-mono">
                  {formatTimeRemaining(timeRemaining)}
                </div>
                <p className="text-sm opacity-90">Time Remaining</p>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Load Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Load Details</h3>

              {/* Route */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-slate-900">{load.loadingLocation.place}</span>
                    </div>
                    <p className="text-sm text-slate-600">{load.loadingLocation.state}</p>
                  </div>
                  <Truck className="h-5 w-5 text-slate-400" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <span className="font-semibold text-slate-900">{load.unloadingLocation.place}</span>
                    </div>
                    <p className="text-sm text-slate-600">{load.unloadingLocation.state}</p>
                  </div>
                </div>
              </div>

              {/* Key Details */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Vehicle Required</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {load.vehicleRequirement.size}ft {load.vehicleRequirement.vehicleType}
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Scale className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">Total Weight</span>
                  </div>
                  <p className="text-sm text-emerald-700">
                    {load.materials?.reduce((sum, material) => sum + material.totalWeight, 0)} kg
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Loading Date</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    {new Date(load.loadingDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <IndianRupee className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Payment Terms</span>
                  </div>
                  <p className="text-sm text-purple-700 uppercase">{load.paymentTerms}</p>
                </div>
              </div>

              {/* Action Button */}
              {canPlaceBid() && (
                <div className="mt-6">
                  <Button
                    onClick={() => setIsPlaceBidModalOpen(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
                    icon={<IndianRupee className="h-4 w-4" />}
                  >
                    {getMyBid() ? 'Update Bid' : 'Place Bid'}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Bidding Table */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  Live Bids ({bids.length})
                </h3>
                {bids.length > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Highest Bid</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      ₹{bids[0]?.bidAmount.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {bids.length === 0 ? (
                <div className="text-center py-12">
                  <IndianRupee className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">No Bids Yet</h4>
                  <p className="text-slate-600">Be the first to place a bid on this load!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {bids.map((bid, index) => (
                      <motion.div
                        key={bid._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className={`border rounded-xl p-4 ${index === 0
                            ? 'border-emerald-200 bg-emerald-50'
                            : bid.vehicleOwnerId === user?.id
                              ? 'border-blue-200 bg-blue-50'
                              : 'border-slate-200 bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${index === 0 ? 'bg-emerald-100' : 'bg-slate-100'
                              }`}>
                              {index === 0 ? (
                                <Star className="h-5 w-5 text-emerald-600" />
                              ) : (
                                <User className="h-5 w-5 text-slate-600" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                {bid.vehicleOwnerName}
                                {bid.vehicleOwnerId === user?.id && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    Your Bid
                                  </span>
                                )}
                              </h4>
                              <p className="text-sm text-slate-600">
                                {new Date(bid.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className={`text-2xl font-bold ${index === 0 ? 'text-emerald-600' : 'text-slate-900'
                                  }`}>
                                  ₹{bid.bidAmount.toLocaleString()}
                                </p>
                                {index === 0 && (
                                  <p className="text-xs text-emerald-600 font-medium">Highest</p>
                                )}
                              </div>

                              {canSelectWinner() && (
                                <Button
                                  onClick={() => {
                                    setSelectedBid(bid);
                                    setIsTransportRequestModalOpen(true);
                                  }}
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  icon={<CheckCircle className="h-4 w-4" />}
                                >
                                  Select
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {bid.message && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-700">"{bid.message}"</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Place Bid Modal */}
        <Modal
          isOpen={isPlaceBidModalOpen}
          onClose={() => setIsPlaceBidModalOpen(false)}
          title="Place Your Bid"
          size="md"
        >
          <div className="space-y-6">
            {/* Vehicle Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Select Vehicle
              </label>
              <div className="grid grid-cols-1 gap-3">
                {myVehicles.map((vehicle) => (
                  <motion.div
                    key={vehicle._id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedVehicle(vehicle)}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedVehicle?._id === vehicle._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900">{vehicle.vehicleNumber}</h4>
                        <p className="text-sm text-slate-600">
                          {vehicle.vehicleType} • {vehicle.vehicleSize}ft • {vehicle.passingLimit}T
                        </p>
                      </div>
                      {selectedVehicle?._id === vehicle._id && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bid Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bid Amount (₹) *
              </label>
              <Input
                type="number"
                placeholder="Enter your bid amount"
                value={bidAmount}
                onChange={setBidAmount}
              />
              {bids.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Current highest bid: ₹{bids[0]?.bidAmount.toLocaleString()}
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Message (Optional)
              </label>
              <textarea
                value={bidMessage}
                onChange={(e) => setBidMessage(e.target.value)}
                placeholder="Add any additional information..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <Button
                onClick={() => setIsPlaceBidModalOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePlaceBid}
                loading={placing}
                disabled={!selectedVehicle || !bidAmount}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                icon={<IndianRupee className="h-4 w-4" />}
              >
                {getMyBid() ? 'Update Bid' : 'Place Bid'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Transport Request Modal */}
        <Modal
          isOpen={isTransportRequestModalOpen}
          onClose={() => setIsTransportRequestModalOpen(false)}
          title="Send Transport Request"
          size="md"
        >
          {selectedBid && (
            <div className="space-y-6">
              {/* Winner Details */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Star className="h-8 w-8 text-emerald-600" />
                  <div>
                    <h3 className="font-semibold text-emerald-800">Selected Winner</h3>
                    <p className="text-emerald-700">{selectedBid.vehicleOwnerName}</p>
                    <p className="text-emerald-600 font-bold text-lg">
                      ₹{selectedBid.bidAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message to Vehicle Owner (Optional)
                </label>
                <textarea
                  value={transportMessage}
                  onChange={(e) => setTransportMessage(e.target.value)}
                  placeholder="Congratulations! You've won the bid. Please confirm your availability..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <Button
                  onClick={() => setIsTransportRequestModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendTransportRequest}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  icon={<CheckCircle className="h-4 w-4" />}
                >
                  Send Request
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};