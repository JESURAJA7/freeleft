import express from 'express';
import {
  createBiddingSession,
  getBiddingSession,
  getBiddingSessionByLoad,
  closeBiddingSession,
  placeBid,
  withdrawBid,
  getBidsForSession,
  getMyBids,
  sendTransportRequest,
  getTransportRequests,
  respondToTransportRequest,
  getActiveBiddingSessions,
  selectWinningBid,
  acceptBidAndAssign,
  startJourney,
  getBiddingSessionWithDetails,
  getVehicleOwnerProfile
} from '../controllers/biddingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Bidding session routes
router.post('/sessions', createBiddingSession);
router.get('/sessions/active', getActiveBiddingSessions);
router.get('/sessions/:sessionId', getBiddingSession);
router.get('/sessions/load/:loadId', getBiddingSessionByLoad);
router.patch('/sessions/:sessionId/close', closeBiddingSession);

// Bid routes
router.post('/bids', placeBid);
router.get('/my-bids', getMyBids);
router.patch('/bids/:bidId/withdraw', withdrawBid);
router.get('/sessions/:sessionId/bids', getBidsForSession);
router.patch('/sessions/:sessionId/select-bid', selectWinningBid);
router.patch('/sessions/:sessionId/accept-bid', acceptBidAndAssign);
router.patch('/sessions/:sessionId/start-journey', startJourney);
router.get('/sessions/:sessionId/details', getBiddingSessionWithDetails);
router.get('/vehicle-owner/:vehicleId', getVehicleOwnerProfile);

// Transport request routes
router.post('/transport-requests', sendTransportRequest);
router.get('/transport-requests', getTransportRequests);
router.patch('/transport-requests/:requestId/respond', respondToTransportRequest);

export default router;