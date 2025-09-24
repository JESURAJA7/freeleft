import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Truck, MapPin, IndianRupee, User, HandIcon as Hand, Eye, Star, Calendar, Scale, FileText, MessageSquare, TrendingUp, Trophy, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { biddingAPI, vehicleAPI, loadAPI } from '../../services/api';
import type { BiddingSession, Bid, Vehicle, Load } from '../../types';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const LiveBiddingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { joinBiddingRoom, leaveBiddingRoom, onNewBid, offNewBid } = useSocket();
  
  const [biddingSessions, setBiddingSessions] = useState<BiddingSession[]>([]);
  const [myBiddingSessions, setMyBiddingSessions] = useState<BiddingSession[]>([]);
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  const [myLoads, setMyLoads] = useState<Load[]>([]);
  const [selectedSession, setSelectedSession] = useState<BiddingSession | null>(null);
  const [sessionBids, setSessionBids] = useState<Bid[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedWinningBid, setSelectedWinningBid] = useState<Bid | null>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidMessage, setBidMessage] = useState<string>('');
  const [transportMessage, setTransportMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [sending, setSending] = useState(false);
  const [isPlaceBidModalOpen, setIsPlaceBidModalOpen] = useState(false);
  const [isSelectWinnerModalOpen, setIsSelectWinnerModalOpen] = useState(false);
  const [isSessionDetailsModalOpen, setIsSessionDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSession) {
      joinBiddingRoom(selectedSession._id);
      fetchSessionBids(selectedSession._id);
      
      onNewBid((newBid: Bid) => {
        if (newBid.biddingSessionId === selectedSession._id) {
          setSessionBids(prev => {
            const existingIndex = prev.findIndex(bid => bid._id === newBid._id);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = newBid;
              return updated.sort((a, b) => b.bidAmount - a.bidAmount);
            } else {
              return [newBid, ...prev].sort((a, b) => b.bidAmount - a.bidAmount);
            }
          });
        }
      });

      return () => {
        leaveBiddingRoom(selectedSession._id);
        offNewBid();
      };
    }
  }, [selectedSession]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'vehicle_owner') {
        // Fetch all active bidding sessions for vehicle owners to place bids
        const sessionsResponse = await biddingAPI.getActiveBiddingSessions();
        if (sessionsResponse.data.success) {
          // Show all active sessions from other load providers (not their own)
          const allSessions = sessionsResponse.data.data;
          const otherProviderSessions = allSessions.filter((session: BiddingSession) => 
            session.loadId?.loadProviderId !== user.id
          );
          setBiddingSessions(otherProviderSessions);
        }

        // Fetch user's vehicles
        const vehiclesResponse = await vehicleAPI.getMyVehicles();
        if (vehiclesResponse.data.success) {
          setMyVehicles(vehiclesResponse.data.data.filter((v: Vehicle) => 
            v.status === 'available' && v.isApproved
          ));
        }
      } else if (user?.role === 'load_provider') {
        // For load providers, only show bidding sessions they created
        // This will primarily show sessions they just created
        const sessionsResponse = await biddingAPI.getActiveBiddingSessions();
        if (sessionsResponse.data.success) {
          // Filter to show only sessions for loads created by this load provider
          const allSessions = sessionsResponse.data.data;
          const myProviderSessions = allSessions.filter((session: BiddingSession) => 
            session.loadId?.loadProviderId === user.id
          );
          setMyBiddingSessions(myProviderSessions);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load bidding sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionBids = async (sessionId: string) => {
    try {
      const response = await biddingAPI.getBidsForSession(sessionId);
      if (response.data.success) {
        let bids = response.data.data.sort((a: Bid, b: Bid) => b.bidAmount - a.bidAmount);
        
        // For vehicle owners, filter to show only their own bids
        if (user?.role === 'vehicle_owner') {
          bids = bids.filter((bid: Bid) => bid.vehicleOwnerId === user.id);
        }
        // For load providers, show all bids (no filtering needed)
        
        setSessionBids(bids);
      }
    } catch (error) {
      console.error('Error fetching session bids:', error);
    }
  };

  const handlePlaceBid = async () => {
    if (!selectedSession || !selectedVehicle || !bidAmount) {
      toast.error('Please select a vehicle and enter bid amount');
      return;
    }

    try {
      setPlacing(true);
      
      // Check if user already has a bid for this session
      const existingBid = getMyBidForSession(selectedSession._id);
      
      if (existingBid) {
        // Update existing bid
        await biddingAPI.updateBid(
          existingBid._id,
          Number(bidAmount),
          bidMessage.trim() || undefined
        );
        toast.success('Bid updated successfully!');
      } else {
        // Place new bid
        await biddingAPI.placeBid(
          selectedSession._id,
          selectedVehicle._id,
          Number(bidAmount),
          bidMessage.trim() || undefined
        );
        toast.success('Bid placed successfully!');
      }

      setIsPlaceBidModalOpen(false);
      setBidAmount('');
      setBidMessage('');
      setSelectedVehicle(null);
      
      // Refresh the session bids
      if (selectedSession) {
        fetchSessionBids(selectedSession._id);
      }
    } catch (error: any) {
      console.error('Error placing/updating bid:', error);
      toast.error(error.response?.data?.message || 'Failed to place/update bid');
    } finally {
      setPlacing(false);
    }
  };

  const handleSelectWinner = async () => {
    if (!selectedSession || !selectedWinningBid) {
      toast.error('Please select a winning bid');
      return;
    }

    try {
      setSending(true);
      await biddingAPI.selectWinningBid(
        selectedSession._id,
        selectedWinningBid._id,
       
      );

      toast.success('Winner selected successfully!');
      setIsSelectWinnerModalOpen(false);
      setSelectedWinningBid(null);
      setTransportMessage('');
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error selecting winner:', error);
      toast.error(error.response?.data?.message || 'Failed to select winner');
    } finally {
      setSending(false);
    }
  };

  const formatTimeRemaining = (endTime: string) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const remaining = Math.max(0, end - now);
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isSessionActive = (session: BiddingSession) => {
    const now = new Date();
    const endTime = new Date(session.endTime);
    return session.status === 'active' && now < endTime;
  };

  const getMyBidForSession = (sessionId: string) => {
    return sessionBids.find(bid => 
      bid.biddingSessionId === sessionId && bid.vehicleOwnerId === user?.id
    );
  };

  // Function to get all bids for session (load providers only)
  const getAllBidsForSession = async (sessionId: string) => {
    try {
      const response = await biddingAPI.getBidsForSession(sessionId);
      if (response.data.success) {
        return response.data.data.sort((a: Bid, b: Bid) => b.bidAmount - a.bidAmount);
      }
      return [];
    } catch (error) {
      console.error('Error fetching all session bids:', error);
      return [];
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {user?.role === 'load_provider' ? 'My Active Bidding Sessions' : 'Live Bidding Marketplace'}
              </h1>
              <p className="text-slate-600">
                {user?.role === 'load_provider' 
                  ? 'Monitor and manage your active bidding sessions'
                  : 'Participate in active bidding sessions from load providers'
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">
                {user?.role === 'load_provider' ? 'My Active Sessions' : 'Available Sessions'}
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {user?.role === 'load_provider' ? myBiddingSessions.length : biddingSessions.length}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Load Provider View */}
        {user?.role === 'load_provider' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {myBiddingSessions.map((session, index) => {
                const isActive = isSessionActive(session);
                const isClosed = session.status === 'closed' || !isActive;
                const load = session.loadId;
                const totalWeight = load?.materials?.reduce((sum: any, material: any) => sum + material.totalWeight, 0) || 0;
                
                return (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 ${
                      isActive ? 'border-blue-200 ring-2 ring-blue-100' : 'border-slate-200'
                    }`}
                  >
                    {/* Session Header */}
                    <div className={`p-4 border-b ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : session.winningBidId
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                        : 'bg-gradient-to-r from-slate-500 to-slate-600 text-white'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5" />
                          <span className="font-semibold">
                            {isActive ? 'Live Bidding' : session.winningBidId ? 'Winner Selected' : 'Bidding Closed'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm opacity-90">Bids: {session.totalBids || 0}</p>
                        </div>
                      </div>
                      
                      {isActive && (
                        <div className="text-center">
                          <div className="text-2xl font-bold font-mono">
                            {formatTimeRemaining(session.endTime)}
                          </div>
                          <p className="text-sm opacity-90">Time Remaining</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      {/* Load Details */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-slate-900 text-sm">{load?.loadingLocation.place}</span>
                            </div>
                            <p className="text-xs text-slate-600 ml-6">{load?.loadingLocation?.state}</p>
                          </div>
                          <Truck className="h-4 w-4 text-slate-400" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <MapPin className="h-4 w-4 text-emerald-600" />
                              <span className="font-medium text-slate-900 text-sm">{load?.unloadingLocation?.place}</span>
                            </div>
                            <p className="text-xs text-slate-600 ml-6">{load?.unloadingLocation?.state}</p>
                          </div>
                        </div>
                      </div>

                      {/* Requirements */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-slate-600">Vehicle:</span>
                            <p className="font-medium text-slate-900">{load?.vehicleRequirement?.size}ft {load?.vehicleRequirement?.vehicleType}</p>
                          </div>
                          <div>
                            <span className="text-slate-600">Weight:</span>
                            <p className="font-medium text-slate-900">{totalWeight.toLocaleString()} kg</p>
                          </div>
                          <div>
                            <span className="text-slate-600">Loading:</span>
                            <p className="font-medium text-slate-900">{load?.loadingDate ? new Date(load.loadingDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-slate-600">Payment:</span>
                            <p className="font-medium text-slate-900 uppercase">{load?.paymentTerms}</p>
                          </div>
                        </div>
                      </div>

                      {/* Winner Info */}
                      {session.winningBidId && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-emerald-800">Winner Selected</span>
                            <Trophy className="h-4 w-4 text-emerald-600" />
                          </div>
                          <p className="text-emerald-700 font-semibold mt-1">
                            Bid Amount: ₹{session.winningBidAmount?.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <Button
                            onClick={async () => {
                              setSelectedSession(session);
                              // Load all bids for load providers
                              const allBids = await getAllBidsForSession(session._id);
                              setSessionBids(allBids);
                              setIsSessionDetailsModalOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            icon={<Eye className="h-4 w-4" />}
                          >
                            View All Bids
                          </Button>
                          
                          <Button
                            onClick={() => navigate(`/bidding-monitor/${session._id}`)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            size="sm"
                            icon={<TrendingUp className="h-4 w-4" />}
                          >
                            Monitor Live
                          </Button>
                        </div>
                        
                        {isClosed && !session.winningBidId && (session.totalBids || 0) > 0 && (
                          <Button
                            onClick={async () => {
                              setSelectedSession(session);
                              // Load all bids for selection
                              const allBids = await getAllBidsForSession(session._id);
                              setSessionBids(allBids);
                              setIsSelectWinnerModalOpen(true);
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            size="sm"
                            icon={<Trophy className="h-4 w-4" />}
                          >
                            Select Winner
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Vehicle Owner View */}
        {user?.role === 'vehicle_owner' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {biddingSessions.map((session, index) => {
                const myBid = getMyBidForSession(session._id);
                const isActive = isSessionActive(session);
                const load = session.loadId;
                const totalWeight = load?.materials?.reduce((sum: any, material: any) => sum + material.totalWeight, 0) || 0;
                
                return (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 ${
                      isActive ? 'border-purple-200 ring-2 ring-purple-100' : 'border-slate-200'
                    }`}
                  >
                    {/* Session Header */}
                    <div className={`p-4 border-b ${
                      isActive 
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                        : 'bg-gradient-to-r from-slate-500 to-slate-600 text-white'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5" />
                          <span className="font-semibold">
                            {isActive ? 'Live Bidding' : 'Bidding Closed'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm opacity-90">Total Bids: {session.totalBids || 0}</p>
                        </div>
                      </div>
                      
                      {isActive && (
                        <div className="text-center">
                          <div className="text-2xl font-bold font-mono">
                            {formatTimeRemaining(session.endTime)}
                          </div>
                          <p className="text-sm opacity-90">Time Remaining</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      {/* Load Provider Info */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Load Provider</span>
                        </div>
                        <p className="text-blue-700 font-semibold mt-1">
                          {load?.loadProviderId ? `Provider ${load.loadProviderId.slice(-6)}` : 'Unknown Provider'}
                        </p>
                      </div>

                      {/* Load Details */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-slate-900 text-sm">{load?.loadingLocation.place}</span>
                            </div>
                            <p className="text-xs text-slate-600 ml-6">{load?.loadingLocation?.state}</p>
                          </div>
                          <Truck className="h-4 w-4 text-slate-400" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <MapPin className="h-4 w-4 text-emerald-600" />
                              <span className="font-medium text-slate-900 text-sm">{load?.unloadingLocation?.place}</span>
                            </div>
                            <p className="text-xs text-slate-600 ml-6">{load?.unloadingLocation?.state}</p>
                          </div>
                        </div>
                      </div>

                      {/* Requirements */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-slate-600">Vehicle:</span>
                            <p className="font-medium text-slate-900">{load?.vehicleRequirement?.size}ft {load?.vehicleRequirement?.vehicleType}</p>
                          </div>
                          <div>
                            <span className="text-slate-600">Weight:</span>
                            <p className="font-medium text-slate-900">{totalWeight.toLocaleString()} kg</p>
                          </div>
                          <div>
                            <span className="text-slate-600">Loading:</span>
                            <p className="font-medium text-slate-900">{load?.loadingDate ? new Date(load.loadingDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-slate-600">Payment:</span>
                            <p className="font-medium text-slate-900 uppercase">{load?.paymentTerms}</p>
                          </div>
                        </div>
                      </div>

                      {/* My Bid Status */}
                      {myBid && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-800">Your Bid</span>
                            <span className="text-lg font-bold text-blue-600">₹{myBid.bidAmount.toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            Placed on {new Date(myBid.createdAt).toLocaleString()}
                          </p>
                        </div>
                      )}

                      {/* Bid Limits */}
                      {(session.minBidAmount || session.maxBidAmount) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                          <h5 className="text-sm font-medium text-yellow-800 mb-1">Bid Limits</h5>
                          <div className="text-xs text-yellow-700">
                            {session.minBidAmount && <p>Min: ₹{session.minBidAmount.toLocaleString()}</p>}
                            {session.maxBidAmount && <p>Max: ₹{session.maxBidAmount.toLocaleString()}</p>}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => {
                              setSelectedSession(session);
                              fetchSessionBids(session._id); // This will fetch only user's own bids
                              setIsSessionDetailsModalOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            icon={<Eye className="h-4 w-4" />}
                          >
                            View My Bid
                          </Button>
                          
                          {isActive && myVehicles.length > 0 && (
                            <Button
                              onClick={() => {
                                setSelectedSession(session);
                                // Pre-fill existing bid data if updating
                                const existingBid = getMyBidForSession(session._id);
                                if (existingBid) {
                                  setBidAmount(existingBid.bidAmount.toString());
                                  setBidMessage(existingBid.message || '');
                                  // Find and set the vehicle used in existing bid
                                  const bidVehicle = myVehicles.find(v => v._id === existingBid.vehicleId);
                                  setSelectedVehicle(bidVehicle || null);
                                }
                                setIsPlaceBidModalOpen(true);
                              }}
                              className="flex-1 bg-purple-600 hover:bg-purple-700"
                              size="sm"
                              icon={<Hand className="h-4 w-4" />}
                            >
                              {myBid ? 'Update Bid' : 'Place Bid'}
                            </Button>
                          )}
                        </div>
                        
                        {/* {isActive && (
                          <Button
                            onClick={() => navigate(`/bidding/${session.loadId._id}`)}
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            icon={<Star className="h-4 w-4" />}
                          >
                            Join Live Bidding Room
                          </Button>
                        )} */}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty States */}
        {((user?.role === 'load_provider' && myBiddingSessions.length === 0) || 
          (user?.role === 'vehicle_owner' && biddingSessions.length === 0)) && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Clock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {user?.role === 'load_provider' ? 'No Active Bidding Sessions' : 'No Available Bidding Sessions'}
            </h3>
            <p className="text-slate-600">
              {user?.role === 'load_provider' 
                ? 'Create a load and start a bidding session to see it here'
                : 'Check back later for new bidding opportunities from load providers'
              }
            </p>
            {user?.role === 'load_provider' && (
              <Button
                onClick={() => navigate('/loads')}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
                icon={<FileText className="h-4 w-4" />}
              >
                Go to My Loads
              </Button>
            )}
          </motion.div>
        )}

        {/* Place Bid Modal - Vehicle Owners */}
        <Modal
          isOpen={isPlaceBidModalOpen}
          onClose={() => {
            setIsPlaceBidModalOpen(false);
            setBidAmount('');
            setBidMessage('');
            setSelectedVehicle(null);
          }}
          title={getMyBidForSession(selectedSession?._id || '') ? "Update Your Bid" : "Place Your Bid"}
          size="md"
        >
          {selectedSession && (
            <div className="space-y-6">
              {/* Session Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <h3 className="font-semibold text-purple-800 mb-2">Bidding Session</h3>
                <p className="text-purple-700">
                  {selectedSession.loadId?.loadingLocation?.place} → {selectedSession.loadId?.unloadingLocation?.place}
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  Ends: {new Date(selectedSession.endTime).toLocaleString()}
                </p>
              </div>

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
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        selectedVehicle?._id === vehicle._id
                          ? 'border-purple-500 bg-purple-50'
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
                          <CheckCircle className="h-5 w-5 text-purple-500" />
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
                {(selectedSession.minBidAmount || selectedSession.maxBidAmount) && (
                  <div className="text-xs text-slate-500 mt-1">
                    {selectedSession.minBidAmount && `Min: ₹${selectedSession.minBidAmount.toLocaleString()}`}
                    {selectedSession.minBidAmount && selectedSession.maxBidAmount && ' • '}
                    {selectedSession.maxBidAmount && `Max: ₹${selectedSession.maxBidAmount.toLocaleString()}`}
                  </div>
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
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <Button
                  onClick={() => {
                    setIsPlaceBidModalOpen(false);
                    setBidAmount('');
                    setBidMessage('');
                    setSelectedVehicle(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePlaceBid}
                  loading={placing}
                  disabled={!selectedVehicle || !bidAmount}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  icon={<Hand className="h-4 w-4" />}
                >
                  {getMyBidForSession(selectedSession._id) ? 'Update Bid' : 'Place Bid'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Select Winner Modal - Load Providers */}
        <Modal
          isOpen={isSelectWinnerModalOpen}
          onClose={() => setIsSelectWinnerModalOpen(false)}
          title="Select Winning Bid"
          size="lg"
        >
          {selectedSession && (
            <div className="space-y-6">
              {/* Session Info */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h3 className="font-semibold text-emerald-800 mb-2">Select Winner</h3>
                <p className="text-emerald-700">
                  {selectedSession.loadId?.loadingLocation?.place} → {selectedSession.loadId?.unloadingLocation?.place}
                </p>
                <p className="text-sm text-emerald-600 mt-1">
                  {sessionBids.length} bids received
                </p>
              </div>

              {/* Bids List */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Available Bids</h3>
                {sessionBids.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-xl">
                    <IndianRupee className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">No bids available</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {sessionBids.map((bid, index) => (
                      <motion.div
                        key={bid._id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedWinningBid(bid)}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                          selectedWinningBid?._id === bid._id
                            ? 'border-emerald-500 bg-emerald-50'
                            : index === 0
                            ? 'border-orange-200 bg-orange-50 hover:border-orange-300'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-slate-900">
                                {bid.vehicleOwnerName}
                              </h4>
                              {index === 0 && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                                  Highest Bid
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              Placed on {new Date(bid.createdAt).toLocaleString()}
                            </p>
                            {bid.message && (
                              <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200">
                                <p className="text-sm text-slate-700">"{bid.message}"</p>
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className={`text-2xl font-bold ${
                              index === 0 ? 'text-orange-600' : 'text-slate-900'
                            }`}>
                              ₹{bid.bidAmount.toLocaleString()}
                            </p>
                            {selectedWinningBid?._id === bid._id && (
                              <CheckCircle className="h-6 w-6 text-emerald-500 mt-2 ml-auto" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message to Winner */}
              {selectedWinningBid && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Message to Winner (Optional)
                  </label>
                  <textarea
                    value={transportMessage}
                    onChange={(e) => setTransportMessage(e.target.value)}
                    placeholder="Add any additional instructions or information..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-4">
                <Button
                  onClick={() => setIsSelectWinnerModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSelectWinner}
                  loading={sending}
                  disabled={!selectedWinningBid}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  icon={<Trophy className="h-4 w-4" />}
                >
                  Select Winner
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Session Details Modal */}
        <Modal
          isOpen={isSessionDetailsModalOpen}
          onClose={() => setIsSessionDetailsModalOpen(false)}
          title={user?.role === 'vehicle_owner' ? "My Bid Details" : "All Bidding Details"}
          size="lg"
        >
          {selectedSession && (
            <div className="space-y-6">
              {/* Load Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-slate-900 mb-4">Load Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Route</h4>
                    <p className="text-slate-900">
                      {selectedSession.loadId?.loadingLocation?.place} → {selectedSession.loadId?.unloadingLocation?.place}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Vehicle Required</h4>
                    <p className="text-slate-900">
                      {selectedSession.loadId?.vehicleRequirement?.size}ft {selectedSession.loadId?.vehicleRequirement?.vehicleType}
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Bids */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">
                    {user?.role === 'vehicle_owner' 
                      ? `My Bid (${sessionBids.length})`
                      : `All Bids (${sessionBids.length})`
                    }
                  </h3>
                  <Button
                    onClick={() => {
                      if (user?.role === 'vehicle_owner') {
                        fetchSessionBids(selectedSession._id);
                      } else {
                        // Load all bids for load providers
                        getAllBidsForSession(selectedSession._id).then(allBids => {
                          setSessionBids(allBids);
                        });
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="ml-2"
                  >
                    Refresh
                  </Button>
                </div>
                {sessionBids.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-xl">
                    <IndianRupee className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">
                      {user?.role === 'vehicle_owner' 
                        ? 'You haven\'t placed a bid yet'
                        : 'No bids placed yet'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {sessionBids.map((bid, index) => (
                      <div
                        key={bid._id}
                        className={`border rounded-xl p-4 ${
                          user?.role === 'load_provider' && index === 0
                            ? 'border-emerald-200 bg-emerald-50' 
                            : bid.vehicleOwnerId === user?.id
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {user?.role === 'vehicle_owner' ? 'Your Bid' : bid.vehicleOwnerName}
                              {user?.role === 'load_provider' && bid.vehicleOwnerId === user?.id && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  Your Bid
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-slate-600">
                              {new Date(bid.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${
                              user?.role === 'load_provider' && index === 0 ? 'text-emerald-600' : 'text-slate-900'
                            }`}>
                              ₹{bid.bidAmount.toLocaleString()}
                            </p>
                            {user?.role === 'load_provider' && index === 0 && (
                              <p className="text-xs text-emerald-600 font-medium">Highest</p>
                            )}
                          </div>
                        </div>
                        
                        {bid.message && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-700">"{bid.message}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};