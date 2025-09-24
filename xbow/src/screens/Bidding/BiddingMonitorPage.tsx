import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  Truck, 
  MapPin, 
  IndianRupee, 
  User, 
  Star, 
  Phone, 
  Mail, 
  Calendar, 
  Scale, 
  FileText, 
  Trophy, 
  CheckCircle, 
  Eye, 
  MessageSquare,
  Shield,
  Award,
  TrendingUp,
  Users,
  Filter,
  SortAsc,
  SortDesc,
  Play,
  AlertCircle,
  Check,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Route
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { biddingAPI, vehicleAPI, loadAPI, vehicleMatchingAPI } from '../../services/api';
import type { BiddingSession, Bid, Vehicle, Load } from '../../types';
import { Button } from '../../components/common/CustomButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { s } from 'framer-motion/client';

interface VehicleOwnerProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  rating: number;
  totalRatings: number;
  completedJourneys: number;
  joinedDate: string;
  isVerified: boolean;
  documents: {
    license: { verified: boolean };
    aadhar: { verified: boolean };
    pan: { verified: boolean };
  };
}

interface EnhancedBid extends Bid {
  vehicleOwnerProfile: VehicleOwnerProfile;
  vehicleDetails: Vehicle;
}

export const BiddingMonitorPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { joinBiddingRoom, leaveBiddingRoom, onNewBid, offNewBid } = useSocket();
  
  const [session, setSession] = useState<BiddingSession | null>(null);
  const [bids, setBids] = useState<EnhancedBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBidForSelection, setSelectedBidForSelection] = useState<EnhancedBid | null>(null);
  const [selectedBidForAction, setSelectedBidForAction] = useState<EnhancedBid | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'experience'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterVerified, setFilterVerified] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isStartJourneyModalOpen, setIsStartJourneyModalOpen] = useState(false);
  const [isVehiclePhotosModalOpen, setIsVehiclePhotosModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [acceptMessage, setAcceptMessage] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
      joinBiddingRoom(sessionId);
      
      onNewBid((newBid: Bid) => {
        if (newBid.biddingSessionId === sessionId) {
          fetchBidsData(); // Refresh to get complete data
          toast.success(`New bid received: ₹${newBid.bidAmount.toLocaleString()}`);
        }
      });

      const interval = setInterval(fetchBidsData, 10000); // Refresh every 10 seconds

      return () => {
        leaveBiddingRoom(sessionId);
        offNewBid();
        clearInterval(interval);
      };
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const response = await biddingAPI.getBiddingSession(sessionId!);
      if (response.data.success) {
        setSession(response.data.data);
        await fetchBidsData();
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load bidding session');
      navigate('/live-bidding');
    } finally {
      setLoading(false);
    }
  };

 const fetchBidsData = async () => {
  try {
    const response = await biddingAPI.getBidsForSession(sessionId!);
    if (response.data.success) {
      const enhancedBids = await Promise.all(
        response.data.data.map(async (bid: Bid) => {
          try {
            console.log('Vehicle ID object:', bid.vehicleId); // Debug - see what this contains
            console.log('Type of vehicleId:', typeof bid.vehicleId); // Debug
            
            // Extract vehicle ID properly
            let vehicleId: string;
            if (typeof bid.vehicleId === 'string') {
              vehicleId = bid.vehicleId;
            } else if (typeof bid.vehicleId === 'object' && bid.vehicleId !== null) {
              // Try different possible property names
              vehicleId = bid.vehicleId|| bid.vehicleId || bid.vehicleId;
              console.log('Extracted vehicleId:', vehicleId); // Debug
            } else {
              console.error('Invalid vehicleId format:', bid.vehicleId);
              vehicleId = ''; // Fallback
            }

            const [profileResponse, vehicleResponse] = await Promise.all([
              vehicleAPI.getVehicleOwnerProfile(bid.vehicleOwnerId),
              vehicleId ? vehicleAPI.getVehicle(vehicleId) : Promise.resolve({ data: { success: false, data: null } })
            ]);

            return {
              ...bid,
              vehicleOwnerProfile: profileResponse.data.data,
              vehicleDetails: vehicleResponse.data.success ? vehicleResponse.data.data : null
            };
          } catch (error) {
            console.error('Error fetching bid details:', error);
            return {
              ...bid,
              vehicleOwnerProfile: null,
              vehicleDetails: null
            };
          }
        })
      );

      setBids(enhancedBids);
    }
  } catch (error) {
    console.error('Error fetching bids:', error);
  }
};
  const handleSelectVehicleOwner = (bid: EnhancedBid) => {
    setSelectedBidForSelection(bid);
  };

  const handleAcceptBid = async () => {
    if (!selectedBidForAction || !session) return;

    try {
      setAccepting(true);
      
      // Send transport request (which effectively accepts the bid)
      await biddingAPI.sendTransportRequest(
        selectedBidForAction._id,
        acceptMessage.trim() || undefined
      );

      toast.success('Vehicle owner selected and transport request sent successfully!');
      await biddingAPI.closeBiddingSession(sessionId!);
      setIsAcceptModalOpen(false);
      setSelectedBidForAction(null);
      setAcceptMessage('');
      fetchSessionData(); // Refresh data
    } catch (error: any) {
      console.error('Error accepting bid:', error);
      toast.error(error.response?.data?.message || 'Failed to accept bid');
    } finally {
      setAccepting(false);
    }
  };

  const handleStartJourney = async () => {
    if (!selectedBidForAction || !session) return;

    try {
      setStarting(true);
      await loadAPI.updateLoadStatus(session.loadId._id, 'in_transit');
      await vehicleAPI.updateVehicleStatus(selectedBidForAction.vehicleId, 'in_transit');

      toast.success('Journey started successfully!');
      setIsStartJourneyModalOpen(false);
      navigate(`/journey-tracking/${session.loadId._id}`);
    } catch (error: any) {
      console.error('Error starting journey:', error);
      toast.error(error.response?.data?.message || 'Failed to start journey');
    } finally {
      setStarting(false);
    }
  };

  const getSortedAndFilteredBids = () => {
    let filteredBids = [...bids];

    if (filterVerified) {
      filteredBids = filteredBids.filter(bid => 
        bid.vehicleOwnerProfile?.isVerified
      );
    }

    return filteredBids.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price':
          comparison = a.bidAmount - b.bidAmount;
          break;
        case 'rating':
          comparison = (a.vehicleOwnerProfile?.rating || 0) - (b.vehicleOwnerProfile?.rating || 0);
          break;
        case 'experience':
          comparison = (a.vehicleOwnerProfile?.completedJourneys || 0) - (b.vehicleOwnerProfile?.completedJourneys || 0);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  };

  const formatTimeRemaining = (endTime: string) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const remaining = Math.max(0, end - now);
    
    if (remaining === 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isSessionActive = () => {
    if (!session) return false;
    const now = new Date();
    const endTime = new Date(session.endTime);
    return session.status === 'active' && now < endTime;
  };



  const hasWinner = () => {
    return session?.winningBidId || bids.some(bid => bid.isWinning);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Not Found</h2>
          <p className="text-slate-600 mb-4">The bidding session you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/live-bidding')}>
            Back to Live Bidding
          </Button>
        </div>
      </div>
    );
  }

  const sortedBids = getSortedAndFilteredBids();
  const load = session.loadId;
  const totalWeight = load?.materials?.reduce((sum: any, material: any) => sum + material.totalWeight, 0) || 0;
  const winningBid = bids.find(bid => bid.isWinning);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/live-bidding')}
                variant="outline"
                size="sm"
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Bidding Monitor</h1>
                <p className="text-slate-600">Select a vehicle owner and manage your load assignment</p>
              </div>
            </div>
            
            {/* Session Status */}
            <div className={`px-6 py-3 rounded-2xl text-white ${
              isSessionActive() 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                : hasWinner()
                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                : 'bg-gradient-to-r from-slate-500 to-slate-600'
            }`}>
              <div className="text-center">
                {isSessionActive() ? (
                  <>
                    <div className="text-2xl font-bold font-mono">
                      {formatTimeRemaining(session.endTime)}
                    </div>
                    <p className="text-sm opacity-90">Time Remaining</p>
                  </>
                ) : hasWinner() ? (
                  <>
                    <Trophy className="h-8 w-8 mx-auto mb-1" />
                    <p className="font-semibold">Winner Selected</p>
                  </>
                ) : (
                  <>
                    <Clock className="h-8 w-8 mx-auto mb-1" />
                    <p className="font-semibold">Bidding Closed</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Load Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Load Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h3 className="font-medium text-slate-700 mb-2">Route</h3>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-slate-900">{load?.loadingLocation?.place}</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span className="text-slate-900">{load?.unloadingLocation?.place}</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-slate-700 mb-2">Vehicle Required</h3>
                <p className="text-slate-900">{load?.vehicleRequirement?.size}ft {load?.vehicleRequirement?.vehicleType}</p>
                <p className="text-sm text-slate-600">{totalWeight.toLocaleString()} kg</p>
              </div>
              <div>
                <h3 className="font-medium text-slate-700 mb-2">Loading Date</h3>
                <p className="text-slate-900">{load?.loadingDate ? new Date(load.loadingDate).toLocaleDateString() : 'N/A'}</p>
                <p className="text-sm text-slate-600 uppercase">{load?.paymentTerms} Payment</p>
              </div>
              <div>
                <h3 className="font-medium text-slate-700 mb-2">Bidding Stats</h3>
                <p className="text-2xl font-bold text-emerald-600">{bids.length}</p>
                <p className="text-sm text-slate-600">Total Bids</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Selection Actions Bar */}
        { !hasWinner() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                  <span className="font-medium text-slate-700">Vehicle Owner Selection:</span>
                </div>
                {selectedBidForSelection ? (
                  <div className="flex items-center space-x-3 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-900">{selectedBidForSelection.vehicleOwnerName}</p>
                      <p className="text-sm text-emerald-700">₹{selectedBidForSelection.bidAmount.toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-500 italic">No vehicle owner selected</span>
                )}
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    if (selectedBidForSelection) {
                      setSelectedBidForAction(selectedBidForSelection);
                      setIsAcceptModalOpen(true);
                    } else {
                      toast.error('Please select a vehicle owner first');
                    }
                  }}
                  disabled={!selectedBidForSelection}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300"
                  icon={<Check className="h-4 w-4" />}
                > 
                  Accept & Assign
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Winner Actions Bar */}
        {winningBid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-6 w-6 text-yellow-300" />
                  <span className="font-semibold text-lg">Selected Winner:</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{winningBid.vehicleOwnerName}</p>
                    <p className="text-blue-100">{winningBid.vehicleDetails?.vehicleNumber} • ₹{winningBid.bidAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSelectedBidForAction(winningBid);
                  setIsStartJourneyModalOpen(true);
                }}
                className="bg-white text-blue-600 hover:bg-blue-50 border border-white"
                icon={<Route className="h-4 w-4" />}
              >
                Start Journey
              </Button>
            </div>
          </motion.div>
        )}

        {/* Filters and Sorting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-slate-600" />
                <span className="font-medium text-slate-700">Filters:</span>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterVerified}
                  onChange={(e) => setFilterVerified(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Verified Only</span>
              </label>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-slate-700">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="price">Price</option>
                  <option value="rating">Rating</option>
                  <option value="experience">Experience</option>
                </select>
                <Button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  variant="outline"
                  size="sm"
                  icon={sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                >
                  {sortOrder === 'asc' ? 'Low to High' : 'High to Low'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bids Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <AnimatePresence>
            {sortedBids.map((bid, index) => (
              <motion.div
                key={bid._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer ${
                  selectedBidForSelection?._id === bid._id
                    ? 'border-emerald-300 ring-2 ring-emerald-200 shadow-emerald-100'
                    : bid.isWinning
                    ? 'border-blue-200 ring-2 ring-blue-100'
                    : index === 0 
                    ? 'border-orange-200 ring-2 ring-orange-100' 
                    : 'border-slate-200'
                }`}
                onClick={() => {
                  if ( !hasWinner()) {
                    handleSelectVehicleOwner(bid);
                  }
                }}
              >
                {/* Selection Indicator */}
                {selectedBidForSelection?._id === bid._id && (
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 flex items-center justify-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Selected for Assignment</span>
                  </div>
                )}

                {/* Bid Header */}
                <div className={`p-4 border-b ${
                  selectedBidForSelection?._id === bid._id
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                    : bid.isWinning
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : index === 0 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                    : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {bid.vehicleOwnerProfile?.profileImage ? (
                          <img
                            src={bid.vehicleOwnerProfile.profileImage}
                            alt={bid.vehicleOwnerName}
                            className="h-12 w-12 rounded-full object-cover border-2 border-white"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                            <User className="h-6 w-6" />
                          </div>
                        )}
                        {bid.vehicleOwnerProfile?.isVerified && (
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Shield className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{bid.vehicleOwnerName}</h3>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-sm">
                              {bid.vehicleOwnerProfile?.rating?.toFixed(1) || 'N/A'}
                            </span>
                          </div>
                          <span className="text-sm opacity-75">
                            ({bid.vehicleOwnerProfile?.totalRatings || 0} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-3xl font-bold">
                        ₹{bid.bidAmount.toLocaleString()}
                      </div>
                      {selectedBidForSelection?._id === bid._id && (
                        <span className="text-sm opacity-90 font-medium">Selected</span>
                      )}
                      {bid.isWinning && (
                        <span className="text-sm opacity-90 font-medium">Winner</span>
                      )}
                      {index === 0 && !bid.isWinning && selectedBidForSelection?._id !== bid._id && (
                        <span className="text-sm opacity-90 font-medium">Highest Bid</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Vehicle Details */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-slate-900 mb-2">Vehicle Information</h4>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-600">Number:</span>
                          <p className="font-medium text-slate-900">{bid.vehicleDetails?.vehicleNumber}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Type:</span>
                          <p className="font-medium text-slate-900">{bid.vehicleDetails?.vehicleType}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Size:</span>
                          <p className="font-medium text-slate-900">{bid.vehicleDetails?.vehicleSize}ft</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Capacity:</span>
                          <p className="font-medium text-slate-900">{bid.vehicleDetails?.passingLimit}T</p>
                        </div>
                      </div>
                      
                      {/* Vehicle Photos Preview */}
                      {bid.vehicleDetails?.photos && bid.vehicleDetails.photos.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-600 text-sm">Vehicle Photos:</span>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBidForAction(bid);
                                setSelectedPhotoIndex(0);
                                setIsVehiclePhotosModalOpen(true);
                              }}
                              variant="outline"
                              size="sm"
                              icon={<ImageIcon className="h-4 w-4" />}
                            >
                              View All ({bid.vehicleDetails.photos.length})
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {bid.vehicleDetails.photos.slice(0, 3).map((photo, photoIndex) => (
                              <div
                                key={photoIndex}
                                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBidForAction(bid);
                                  setSelectedPhotoIndex(photoIndex);
                                  setIsVehiclePhotosModalOpen(true);
                                }}
                              >
                                <img
                                  src={photo.url}
                                  alt={`Vehicle ${photoIndex + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {bid.vehicleDetails.photos.length > 3 && photoIndex === 2 && (
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                    <span className="text-white font-medium">
                                      +{bid.vehicleDetails.photos.length - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Owner Stats */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-slate-900 mb-2">Owner Statistics</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <div className="text-lg font-bold text-blue-600">
                          {bid.vehicleOwnerProfile?.completedJourneys || 0}
                        </div>
                        <div className="text-xs text-blue-700">Completed</div>
                      </div>
                      <div className="text-center p-3 bg-emerald-50 rounded-xl">
                        <div className="text-lg font-bold text-emerald-600">
                          {bid.vehicleOwnerProfile?.rating?.toFixed(1) || 'N/A'}
                        </div>
                        <div className="text-xs text-emerald-700">Rating</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-xl">
                        <div className="text-lg font-bold text-purple-600">
                          {bid.vehicleOwnerProfile?.joinedDate ? 
                            Math.floor((new Date().getTime() - new Date(bid.vehicleOwnerProfile.joinedDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
                            : 0}M
                        </div>
                        <div className="text-xs text-purple-700">Experience</div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-slate-900 mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-slate-600" />
                        <span className="text-slate-900">{bid.vehicleOwnerProfile?.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-slate-600" />
                        <span className="text-slate-900">{bid.vehicleOwnerProfile?.email || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bid Message */}
                  {bid.message && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-slate-900 mb-2">Message</h4>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-sm text-slate-700 italic">"{bid.message}"</p>
                      </div>
                    </div>
                  )}

                  {/* Bid Time */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      <span>Placed on {new Date(bid.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Selection Hint */}
                  { !hasWinner() && (
                    <div className="text-center py-2 text-sm text-slate-600">
                      Click to select this vehicle owner
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {bids.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Bids Yet</h3>
            <p className="text-slate-600">Waiting for vehicle owners to place their bids</p>
          </motion.div>
        )}

        {/* Accept & Assign Modal */}
        <Modal
          isOpen={isAcceptModalOpen}
          onClose={() => setIsAcceptModalOpen(false)}
          title="Accept & Assign Vehicle Owner"
          size="md"
        >
          {selectedBidForAction && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h3 className="font-semibold text-emerald-800 mb-2">Assignment Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-700">Vehicle Owner:</span>
                    <span className="font-medium text-emerald-900">{selectedBidForAction.vehicleOwnerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-700">Vehicle:</span>
                    <span className="font-medium text-emerald-900">{selectedBidForAction.vehicleDetails?.vehicleNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-700">Agreed Price:</span>
                    <span className="font-medium text-emerald-900 text-lg">₹{selectedBidForAction.bidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-700">Rating:</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium text-emerald-900">
                        {selectedBidForAction.vehicleOwnerProfile?.rating?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">What happens next?</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      By accepting this bid, you'll assign this vehicle owner to transport your load. 
                      They will receive a transport request and can then accept to start the journey.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message to Vehicle Owner (Optional)
                </label>
                <textarea
                  value={acceptMessage}
                  onChange={(e) => setAcceptMessage(e.target.value)}
                  placeholder="Add any instructions, pickup details, or special requirements..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={() => setIsAcceptModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAcceptBid}
                  loading={accepting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  icon={<Check className="h-4 w-4" />}
                >
                  Accept & Assign
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Vehicle Photos Modal */}
        <Modal
          isOpen={isVehiclePhotosModalOpen}
          onClose={() => setIsVehiclePhotosModalOpen(false)}
          title="Vehicle Photos"
          size="lg"
        >
          {selectedBidForAction && selectedBidForAction.vehicleDetails?.photos && (
            <div className="space-y-4">
              {/* Main Photo Display */}
              <div className="relative">
                <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden">
                  <img
                    src={selectedBidForAction.vehicleDetails.photos[selectedPhotoIndex]?.url}
                    alt={`Vehicle photo ${selectedPhotoIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Navigation Arrows */}
                {selectedBidForAction.vehicleDetails.photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedPhotoIndex(prev => 
                        prev === 0 ? selectedBidForAction.vehicleDetails.photos.length - 1 : prev - 1
                      )}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setSelectedPhotoIndex(prev => 
                        prev === selectedBidForAction.vehicleDetails.photos.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
                
                {/* Photo Counter */}
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedPhotoIndex + 1} / {selectedBidForAction.vehicleDetails.photos.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {selectedBidForAction.vehicleDetails.photos.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {selectedBidForAction.vehicleDetails.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPhotoIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === selectedPhotoIndex
                          ? 'border-emerald-500 ring-2 ring-emerald-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Vehicle Details */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Vehicle Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-600">Vehicle Number:</span>
                    <p className="font-medium text-slate-900">{selectedBidForAction.vehicleDetails.vehicleNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Type:</span>
                    <p className="font-medium text-slate-900">{selectedBidForAction.vehicleDetails.vehicleType}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Size:</span>
                    <p className="font-medium text-slate-900">{selectedBidForAction.vehicleDetails.vehicleSize}ft</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Capacity:</span>
                    <p className="font-medium text-slate-900">{selectedBidForAction.vehicleDetails.passingLimit}T</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Start Journey Modal */}
        <Modal
          isOpen={isStartJourneyModalOpen}
          onClose={() => setIsStartJourneyModalOpen(false)}
          title="Start Journey"
          size="md"
        >
          {selectedBidForAction && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Journey Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Driver:</span>
                    <span className="font-medium text-blue-900">{selectedBidForAction.vehicleOwnerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Vehicle:</span>
                    <span className="font-medium text-blue-900">{selectedBidForAction.vehicleDetails?.vehicleNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Route:</span>
                    <span className="font-medium text-blue-900">{load?.loadingLocation?.place} → {load?.unloadingLocation?.place}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Agreed Price:</span>
                    <span className="font-medium text-blue-900 text-lg">₹{selectedBidForAction.bidAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Ready to Start?</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Starting the journey will update the load status to "In Transit" and enable real-time tracking. 
                      Make sure the vehicle owner has confirmed and is ready to begin.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={() => setIsStartJourneyModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Not Yet
                </Button>
                <Button
                  onClick={handleStartJourney}
                  loading={starting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  icon={<Route className="h-4 w-4" />}
                >
                  Start Journey
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};