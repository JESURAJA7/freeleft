import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  biddingSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BiddingSession',
    required: true
  },
  loadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Load',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  vehicleOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicleOwnerName: {
    type: String,
    required: true
  },
  bidAmount: {
    type: Number,
    required: true,
    min: 0
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['active', 'withdrawn', 'selected'],
    default: 'active'
  },
  isWinning: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate bids from same vehicle owner in same session
bidSchema.index({ biddingSessionId: 1, vehicleOwnerId: 1 }, { unique: true });

// Indexes for efficient queries
bidSchema.index({ biddingSessionId: 1, bidAmount: -1 });
bidSchema.index({ vehicleOwnerId: 1, status: 1 });
bidSchema.index({ loadId: 1 });

const Bid = mongoose.model('Bid', bidSchema);
export default Bid;