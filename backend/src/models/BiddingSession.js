import mongoose from 'mongoose';

const biddingSessionSchema = new mongoose.Schema({
  loadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Load',
    required: true,
    unique: true // One bidding session per load
  },
  loadProviderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'completed'],
    default: 'active'
  },
  minBidAmount: {
    type: Number,
    min: 0
  },
  maxBidAmount: {
    type: Number,
    min: 0
  },
  winningBidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid'
  },
  totalBids: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
biddingSessionSchema.index({ loadId: 1 });
biddingSessionSchema.index({ loadProviderId: 1, status: 1 });
biddingSessionSchema.index({ status: 1, endTime: 1 });

// Auto-close expired bidding sessions
biddingSessionSchema.index({ endTime: 1 }, { expireAfterSeconds: 0 });

const BiddingSession = mongoose.model('BiddingSession', biddingSessionSchema);
export default BiddingSession;