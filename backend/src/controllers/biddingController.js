import BiddingSession from '../models/BiddingSession.js';
import Bid from '../models/Bid.js';
import TransportRequest from '../models/TransportRequest.js';
import Load from '../models/Load.js';
import Vehicle from '../models/Vehicle.js';
import LoadAssignment from '../models/LoadAssignment.js';

// Create bidding session
export const createBiddingSession = async (req, res) => {
  try {
    const { loadId, startTime, endTime, minBidAmount, maxBidAmount } = req.body;
    const userId = req.user.id;

    // Verify load ownership
    const load = await Load.findOne({ _id: loadId, loadProviderId: userId });
    if (!load) {
      return res.status(404).json({
        success: false,
        message: 'Load not found or not owned by you'
      });
    }

    // Check if bidding session already exists
    const existingSession = await BiddingSession.findOne({ loadId });
    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'Bidding session already exists for this load'
      });
    }

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < now) {
      return res.status(400).json({
        success: false,
        message: 'Start time cannot be in the past'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    const biddingSession = new BiddingSession({
      loadId,
      loadProviderId: userId,
      startTime: start,
      endTime: end,
      minBidAmount,
      maxBidAmount
    });

    await biddingSession.save();

    // Update load status
    await Load.findByIdAndUpdate(loadId, { status: 'bidding' });

    res.status(201).json({
      success: true,
      message: 'Bidding session created successfully',
      data: biddingSession
    });
  } catch (error) {
    console.error('Error creating bidding session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bidding session'
    });
  }
};

// Get bidding session by ID
export const getBiddingSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    //console.log("Session ID:", sessionId);

    const session = await BiddingSession.findById(sessionId)
      .populate('loadId')
      .populate('winningBidId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Bidding session not found'
      });
    }
    // console.log("Bidding Session:", session);
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error getting bidding session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bidding session'
    });
  }
};

// Get bidding session by load ID
export const getBiddingSessionByLoad = async (req, res) => {
  try {
    const { loadId } = req.params;

    const session = await BiddingSession.findOne({ loadId })
      .populate('loadId')
      .populate('winningBidId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Bidding session not found for this load'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error getting bidding session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bidding session'
    });
  }
};

// Place or update bid
export const placeBid = async (req, res) => {
  try {
    const { biddingSessionId, vehicleId, bidAmount, message } = req.body;
    const userId = req.user.id;

    // Verify bidding session exists and is active
    const session = await BiddingSession.findById(biddingSessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Bidding session not found'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Bidding session is not active'
      });
    }

    // Check if bidding time has expired
    if (new Date() > new Date(session.endTime)) {
      // Auto-close the session
      await BiddingSession.findByIdAndUpdate(biddingSessionId, { status: 'closed' });
      return res.status(400).json({
        success: false,
        message: 'Bidding time has expired'
      });
    }

    // Verify vehicle ownership
    const vehicle = await Vehicle.findOne({ _id: vehicleId, ownerId: userId });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or not owned by you'
      });
    }

    // Validate bid amount against session limits
    if (session.minBidAmount && bidAmount < session.minBidAmount) {
      return res.status(400).json({
        success: false,
        message: `Bid amount must be at least ₹${session.minBidAmount}`
      });
    }

    if (session.maxBidAmount && bidAmount > session.maxBidAmount) {
      return res.status(400).json({
        success: false,
        message: `Bid amount cannot exceed ₹${session.maxBidAmount}`
      });
    }

    // Check if user already has a bid in this session
    const existingBid = await Bid.findOne({
      biddingSessionId,
      vehicleOwnerId: userId
    });

    let bid;
    if (existingBid) {
      // Update existing bid
      existingBid.bidAmount = bidAmount;
      existingBid.message = message;
      existingBid.vehicleId = vehicleId;
      await existingBid.save();
      bid = existingBid;
    } else {
      // Create new bid
      bid = new Bid({
        biddingSessionId,
        loadId: session.loadId,
        vehicleId,
        vehicleOwnerId: userId,
        vehicleOwnerName: req.user.name,
        bidAmount,
        message
      });
      await bid.save();

      // Increment total bids count
      await BiddingSession.findByIdAndUpdate(biddingSessionId, {
        $inc: { totalBids: 1 }
      });
    }

    // Populate vehicle details
    await bid.populate('vehicleId');

    // Emit real-time update
    req.io?.to(`bidding-${biddingSessionId}`).emit('new-bid', bid);

    res.status(existingBid ? 200 : 201).json({
      success: true,
      message: existingBid ? 'Bid updated successfully' : 'Bid placed successfully',
      data: bid
    });
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to place bid'
    });
  }
};

// Get bids for a session
export const getBidsForSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verify session exists
    const session = await BiddingSession.findById(sessionId).populate('loadId');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Bidding session not found'
      });
    }

    // Check authorization
    const isLoadProvider = session.loadProviderId.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    let bids;
    if (isLoadProvider || isAdmin) {
      // Load provider and admin can see all bids
      bids = await Bid.find({ biddingSessionId: sessionId, status: 'active' })
        .populate('vehicleId')
        .sort({ bidAmount: -1, createdAt: 1 });
    } else {
      // Vehicle owners can see all bids (for transparency)
      bids = await Bid.find({ biddingSessionId: sessionId, status: 'active' })
        .populate('vehicleId')
        .sort({ bidAmount: -1, createdAt: 1 });
    }

    res.json({
      success: true,
      data: bids
    });
  } catch (error) {
    console.error('Error getting bids:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bids'
    });
  }
};

// Send transport request to winning bidder
export const sendTransportRequest = async (req, res) => {
  try {
    const { bidId, message } = req.body;
    const userId = req.user.id;

    // Get the bid with session details
    const bid = await Bid.findById(bidId)
      .populate('biddingSessionId')
      .populate('vehicleId');

    //console.log("Bid Details:", bid);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Verify load provider authorization
    if (bid.biddingSessionId.loadProviderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send transport request'
      });
    }

    // Check if transport request already exists
    const existingRequest = await TransportRequest.findOne({
      loadId: bid.loadId,
      vehicleId: bid.vehicleId
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Transport request already sent for this bid'
      });
    }

    // Create transport request
    const transportRequest = new TransportRequest({
      loadId: bid.loadId,
      vehicleId: bid.vehicleId._id, // Use _id explicitly
      loadProviderId: userId,
      vehicleOwnerId: bid.vehicleOwnerId,
      bidId: bid._id,
      biddingSessionId: bid.biddingSessionId._id,
      agreedPrice: bid.bidAmount,
      message
    });
    //console.log("Transport Request:", transportRequest);
    if (!transportRequest) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create transport request'
      });
    }

    await transportRequest.save();

    //create load assignment record
    const assignment = new LoadAssignment({
      loadId: bid.loadId._id,
      vehicleId: bid.vehicleId._id,
      loadProviderId: userId,
      vehicleOwnerId: bid.vehicleOwnerId,
      applicationId: null, // No application for bidding-based assignments
      agreedPrice: bid.bidAmount,
      status: 'assigned'
    });
    await assignment.save();

    // Mark bid as selected
    await Bid.findByIdAndUpdate(bidId, {
      status: 'selected',
      isWinning: true
    });

    // Update bidding session with winning bid
    await BiddingSession.findByIdAndUpdate(bid.biddingSessionId._id, {
      winningBidId: bidId,
      status: 'completed'
    });

    // Update load status to assigned
    await Load.findByIdAndUpdate(bid.loadId, {
      status: 'assigned',
      assignedVehicleId: bid.vehicleId._id // Use _id explicitly
    });

    // Update vehicle status to assigned - FIXED
    await Vehicle.findByIdAndUpdate(bid.vehicleId._id, {
      status: 'assigned'
    });

    // Emit real-time notification to vehicle owner
    req.io?.to(`user-${bid.vehicleOwnerId}`).emit('transport-request', transportRequest);

    res.status(201).json({
      success: true,
      message: 'Transport request sent successfully',
      data: transportRequest
    });
  } catch (error) {
    console.error('Error sending transport request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send transport request'
    });
  }
};

// Get transport requests for vehicle owner
export const getTransportRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await TransportRequest.find({ vehicleOwnerId: userId })
      .populate('loadId')
      .populate('vehicleId')
      .populate('bidId')
      .sort({ sentAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error getting transport requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transport requests'
    });
  }
};

// Respond to transport request
export const respondToTransportRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    console.log("status:", status);
    const request = await TransportRequest.findById(requestId)
      .populate('loadId')
      .populate('vehicleId');
      //console.log("Transport Request:", request);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Transport request not found'
      });
    }

    // Verify vehicle owner authorization
    if (request.vehicleOwnerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this request'
      });
    }

    // Update request status
    request.status = status;
    request.respondedAt = new Date();
    await request.save();
    console.log("Updated Transport Request:", request);
    console.log("Request Status:", status);
    if (status === 'accepted') {
      if (!request.agreedPrice && request.agreedPrice !== 0) {
        return res.status(400).json({
          success: false,
          message: 'Agreed price is required to create load assignment'
        });
      }

      // Check if load already has an assignment
      const existingAssignment = await LoadAssignment.findOne({ 
        loadId: request.loadId._id 
      });
      
      if (existingAssignment) {
        return res.status(400).json({
          success: false,
          message: 'Load already has an assignment'
        });
      }

      // Create load assignment
      const assignment = new LoadAssignment({
        loadId: request.loadId, // Use _id instead of the populated object
        vehicleId: request.vehicleId, // Use _id instead of the populated object
        loadProviderId: request.loadProviderId,
        vehicleOwnerId: request.vehicleOwnerId,
        applicationId: null, // No application for bidding-based assignments
        agreedPrice: request.agreedPrice
      });

      console.log("Load Assignment:", assignment);

      await assignment.save();

      // Update load status
      await Load.findByIdAndUpdate(request.loadId._id, {
        status: 'assigned',
        assignedVehicleId: request.vehicleId._id
      });

      // Update vehicle status
      await Vehicle.findByIdAndUpdate(request.vehicleId._id, {
        status: 'assigned'
      });
    }

    res.json({
      success: true,
      message: `Transport request ${status} successfully`,
      data: request
    });
  } catch (error) {
    console.error('Error responding to transport request:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Load already has an assignment'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to respond to transport request'
    });
  }
};
  // Get active bidding sessions
  export const getActiveBiddingSessions = async (req, res) => {
    try {
      const now = new Date();

      // First, close any expired sessions
      await BiddingSession.updateMany(
        {
          status: 'active',
          endTime: { $lt: now }
        },
        { status: 'closed' }
      );

      const sessions = await BiddingSession.find({
        status: 'active',
        endTime: { $gt: now }
      })
        .populate('loadId')
        .populate('winningBidId')
        .sort({ createdAt: -1 });

      // Add bid counts to each session
      const sessionsWithCounts = await Promise.all(
        sessions.map(async (session) => {
          const bidCount = await Bid.countDocuments({
            biddingSessionId: session._id,
            status: 'active'
          });
          return {
            ...session.toObject(),
            totalBids: bidCount
          };
        })
      );

      res.json({
        success: true,
        data: sessionsWithCounts
      });
    } catch (error) {
      console.error('Error getting active bidding sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active bidding sessions'
      });
    }
  };

  // Close bidding session
  export const closeBiddingSession = async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      const session = await BiddingSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Bidding session not found'
        });
      }

      // Verify authorization
      if (session.loadProviderId.toString() !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to close this bidding session'
        });
      }

      // Update session status
      await BiddingSession.findByIdAndUpdate(sessionId, { status: 'closed' });

      // Emit real-time notification
      req.io?.to(`bidding-${sessionId}`).emit('bidding-closed', sessionId);

      res.json({
        success: true,
        message: 'Bidding session closed successfully'
      });
    } catch (error) {
      console.error('Error closing bidding session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to close bidding session'
      });
    }
  };

  // Get my bids (for vehicle owners)
  export const getMyBids = async (req, res) => {
    try {
      const userId = req.user.id;

      const bids = await Bid.find({ vehicleOwnerId: userId })
        .populate('biddingSessionId')
        .populate('loadId')
        .populate('vehicleId')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: bids
      });
    } catch (error) {
      console.error('Error getting my bids:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get bids'
      });
    }
  };

  // Withdraw bid
  export const withdrawBid = async (req, res) => {
    try {
      const { bidId } = req.params;
      const userId = req.user.id;

      const bid = await Bid.findById(bidId).populate('biddingSessionId');
      if (!bid) {
        return res.status(404).json({
          success: false,
          message: 'Bid not found'
        });
      }

      // Verify ownership
      if (bid.vehicleOwnerId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to withdraw this bid'
        });
      }

      // Check if bidding is still active
      if (bid.biddingSessionId.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Cannot withdraw bid from inactive session'
        });
      }

      // Update bid status
      await Bid.findByIdAndUpdate(bidId, { status: 'withdrawn' });

      res.json({
        success: true,
        message: 'Bid withdrawn successfully'
      });
    } catch (error) {
      console.error('Error withdrawing bid:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to withdraw bid'
      });
    }
  };

  // Select winning bid and send transport request
  export const selectWinningBid = async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { bidId } = req.body;
      const userId = req.user.id;
      const transportMessage = req.body.message || '';

      const session = await BiddingSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Bidding session not found'
        });
      }
      // Verify authorization
      if (session.loadProviderId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to select winning bid for this session'
        });
      }
      // Verify bid belongs to session
      const bid = await Bid.findOne({ _id: bidId, biddingSessionId: sessionId });
      if (!bid) {
        return res.status(404).json({
          success: false,
          message: 'Bid not found in this session'
        });
      }
      // Update session with winning bid and close it
      session.winningBidId = bidId;
      session.status = 'completed';
      await session.save();
      // Mark bid as selected
      bid.status = 'selected';
      bid.isWinning = true;
      await bid.save();
      // Create transport request
      const existingRequest = await TransportRequest.findOne({
        loadId: bid.loadId,
        vehicleId: bid.vehicleId
      });
      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'Transport request already sent for this bid'
        });
      }
      const transportRequest = new TransportRequest({
        loadId: bid.loadId,
        vehicleId: bid.vehicleId,
        loadProviderId: userId,
        vehicleOwnerId: bid.vehicleOwnerId,
        bidId: bid._id,
        biddingSessionId: session._id,
        agreedPrice: bid.bidAmount,
        message: transportMessage.trim() || undefined
      });
      await transportRequest.save();
      // Emit real-time notification to vehicle owner
      req.io?.to(`user-${bid.vehicleOwnerId}`).emit('transport-request', transportRequest);
      res.json({
        success: true,
        message: 'Winning bid selected and transport request sent successfully',
        data: { session, bid, transportRequest }
      });
    } catch (error) {
      console.error('Error selecting winning bid:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to select winning bid'
      });
    }
  };

  // Accept bid and assign vehicle owner
  export const acceptBidAndAssign = async (req, res) => {
    try {
      const { bidId } = req.params;
      const { message } = req.body;
      const userId = req.user.id;

      // Get the bid with session details
      const bid = await Bid.findById(bidId)
        .populate('biddingSessionId')
        .populate('vehicleId')
        .populate('loadId');

      if (!bid) {
        return res.status(404).json({
          success: false,
          message: 'Bid not found'
        });
      }

      // Verify load provider authorization
      if (bid.biddingSessionId.loadProviderId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to accept this bid'
        });
      }

      // Check if bidding session is closed
      if (bid.biddingSessionId.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Cannot accept bid while session is still active'
        });
      }

      // Check if transport request already exists
      const existingRequest = await TransportRequest.findOne({
        loadId: bid.loadId._id,
        vehicleId: bid.vehicleId._id
      });

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'Transport request already sent for this bid'
        });
      }

      // Create transport request
      const transportRequest = new TransportRequest({
        loadId: bid.loadId._id,
        vehicleId: bid.vehicleId._id,
        loadProviderId: userId,
        vehicleOwnerId: bid.vehicleOwnerId,
        bidId: bid._id,
        biddingSessionId: bid.biddingSessionId._id,
        agreedPrice: bid.bidAmount,
        message: message?.trim() || undefined
      });

      await transportRequest.save();

      // Mark bid as selected
      await Bid.findByIdAndUpdate(bidId, {
        status: 'selected',
        isWinning: true
      });

      // Update bidding session with winning bid
      await BiddingSession.findByIdAndUpdate(bid.biddingSessionId._id, {
        winningBidId: bidId,
        status: 'completed'
      });

      // Update load status to assigned
      await Load.findByIdAndUpdate(bid.loadId._id, {
        status: 'assigned',
        assignedVehicleId: bid.vehicleId._id
      });

      // Update vehicle status to assigned
      await Vehicle.findByIdAndUpdate(bid.vehicleId._id, {
        status: 'assigned'
      });

      // Create load assignment record
      const assignment = new LoadAssignment({
        loadId: bid.loadId._id,
        vehicleId: bid.vehicleId._id,
        loadProviderId: userId,
        vehicleOwnerId: bid.vehicleOwnerId,
        applicationId: null, // No application for bidding-based assignments
        agreedPrice: bid.bidAmount,
        status: 'assigned'
      });
      await assignment.save();

      // Emit real-time notification to vehicle owner
      req.io?.to(`user-${bid.vehicleOwnerId}`).emit('transport-request', {
        ...transportRequest.toObject(),
        loadDetails: bid.loadId,
        vehicleDetails: bid.vehicleId
      });

      // Emit update to bidding room
      req.io?.to(`bidding-${bid.biddingSessionId._id}`).emit('bid-accepted', {
        bidId,
        sessionId: bid.biddingSessionId._id
      });

      res.status(201).json({
        success: true,
        message: 'Bid accepted and vehicle owner assigned successfully',
        data: {
          transportRequest,
          assignment,
          bid: await Bid.findById(bidId).populate('vehicleId').populate('loadId')
        }
      });
    } catch (error) {
      console.error('Error accepting bid:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to accept bid'
      });
    }
  };

  // Start journey for assigned load
  export const startJourney = async (req, res) => {
    try {
      const { loadId } = req.params;
      const { vehicleId } = req.body;
      const userId = req.user.id;

      // Verify load ownership
      const load = await Load.findOne({ _id: loadId, loadProviderId: userId });
      if (!load) {
        return res.status(404).json({
          success: false,
          message: 'Load not found or not owned by you'
        });
      }

      // Check if load is assigned
      if (load.status !== 'assigned') {
        return res.status(400).json({
          success: false,
          message: 'Load must be assigned before starting journey'
        });
      }

      // Verify vehicle assignment
      if (load.assignedVehicleId?.toString() !== vehicleId) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle is not assigned to this load'
        });
      }

      // Get vehicle details
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Check if vehicle is available for journey
      if (vehicle.status !== 'assigned') {
        return res.status(400).json({
          success: false,
          message: 'Vehicle is not available for journey'
        });
      }

      // Update load status to in_transit
      await Load.findByIdAndUpdate(loadId, {
        status: 'in_transit',
        journeyStartedAt: new Date()
      });

      // Update vehicle status to in_transit
      await Vehicle.findByIdAndUpdate(vehicleId, {
        status: 'in_transit'
      });

      // Update load assignment status
      await LoadAssignment.findOneAndUpdate(
        { loadId, vehicleId },
        {
          status: 'in_transit',
          journeyStartedAt: new Date()
        }
      );

      // Create journey tracking record (if you have a Journey model)
      // const journey = new Journey({
      //   loadId,
      //   vehicleId,
      //   loadProviderId: userId,
      //   vehicleOwnerId: vehicle.ownerId,
      //   startedAt: new Date(),
      //   status: 'in_progress'
      // });
      // await journey.save();

      // Emit real-time notification to vehicle owner
      req.io?.to(`user-${vehicle.ownerId}`).emit('journey-started', {
        loadId,
        vehicleId,
        message: 'Journey has been started by the load provider'
      });

      // Emit update to load tracking room
      req.io?.to(`load-${loadId}`).emit('journey-started', {
        loadId,
        vehicleId,
        startedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Journey started successfully',
        data: {
          loadId,
          vehicleId,
          status: 'in_transit',
          startedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error starting journey:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start journey'
      });
    }
  };

  // Get bidding session with enhanced details
  export const getBiddingSessionWithDetails = async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      const session = await BiddingSession.findById(sessionId)
        .populate({
          path: 'loadId',
          populate: {
            path: 'materials'
          }
        })
        .populate('winningBidId');

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Bidding session not found'
        });
      }

      // Check authorization - only load provider can access detailed view
      if (session.loadProviderId.toString() !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this bidding session'
        });
      }

      // Get bid statistics
      const bidStats = await Bid.aggregate([
        { $match: { biddingSessionId: session._id, status: 'active' } },
        {
          $group: {
            _id: null,
            totalBids: { $sum: 1 },
            highestBid: { $max: '$bidAmount' },
            lowestBid: { $min: '$bidAmount' },
            averageBid: { $avg: '$bidAmount' }
          }
        }
      ]);

      const stats = bidStats[0] || {
        totalBids: 0,
        highestBid: 0,
        lowestBid: 0,
        averageBid: 0
      };

      // Check if there's an active transport request
      let transportRequest = null;
      if (session.winningBidId) {
        transportRequest = await TransportRequest.findOne({
          biddingSessionId: sessionId
        }).populate('vehicleId');
      }

      res.json({
        success: true,
        data: {
          session,
          stats,
          transportRequest
        }
      });
    } catch (error) {
      console.error('Error getting bidding session details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get bidding session details'
      });
    }
  };

  // Get vehicle owner profile with enhanced details
  export const getVehicleOwnerProfile = async (req, res) => {
    try {
      const { ownerId } = req.params;

      // Get user profile
      const User = (await import('../models/User.js')).default;
      const owner = await User.findById(ownerId).select('-password');

      if (!owner) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle owner not found'
        });
      }

      // Get vehicle owner statistics
      const vehicleCount = await Vehicle.countDocuments({ ownerId });

      // Get completed journeys count
      const completedJourneys = await LoadAssignment.countDocuments({
        vehicleOwnerId: ownerId,
        status: 'completed'
      });

      // Get average rating
      const Rating = (await import('../models/Rating.js')).default;
      const ratingStats = await Rating.aggregate([
        { $match: { ratedUserId: ownerId } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 }
          }
        }
      ]);

      const rating = ratingStats[0] || { averageRating: 0, totalRatings: 0 };

      // Check verification status
      const isVerified = owner.documents &&
        owner.documents.license?.verified &&
        owner.documents.aadhar?.verified;

      const profile = {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        profileImage: owner.profileImage,
        rating: rating.averageRating,
        totalRatings: rating.totalRatings,
        completedJourneys,
        vehicleCount,
        joinedDate: owner.createdAt,
        isVerified,
        documents: owner.documents || {}
      };

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Error getting vehicle owner profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get vehicle owner profile'
      });
    }
  };