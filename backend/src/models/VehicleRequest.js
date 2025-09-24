import mongoose from 'mongoose';

const vehicleRequestSchema = new mongoose.Schema({
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
  loadProviderName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500
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
vehicleRequestSchema.index({ loadId: 1, vehicleId: 1 }, { unique: true });

// Indexes for efficient queries
vehicleRequestSchema.index({ vehicleOwnerId: 1, status: 1 });
vehicleRequestSchema.index({ loadProviderId: 1, status: 1 });

const VehicleRequest = mongoose.model('VehicleRequest', vehicleRequestSchema);
export default VehicleRequest;