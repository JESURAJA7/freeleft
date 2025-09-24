import mongoose from 'mongoose';

const transportRequestSchema = new mongoose.Schema({
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
  loadProviderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicleOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    required: true
  },
  biddingSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BiddingSession',
    required: true
  },
  agreedPrice: {
    type: Number,
    required: true,
    min: 0
  },
  message: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate requests
transportRequestSchema.index({ loadId: 1, vehicleId: 1 }, { unique: true });

// Indexes for efficient queries
transportRequestSchema.index({ vehicleOwnerId: 1, status: 1 });
transportRequestSchema.index({ loadProviderId: 1, status: 1 });
transportRequestSchema.index({ bidId: 1 });

const TransportRequest = mongoose.model('TransportRequest', transportRequestSchema);
export default TransportRequest;