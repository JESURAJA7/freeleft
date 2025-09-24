import mongoose from 'mongoose';

const vehicleApplicationSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  loadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Load',
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
  bidPrice: {
    type: Number,
    min: 0
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
  appliedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications
vehicleApplicationSchema.index({ vehicleId: 1, loadId: 1 }, { unique: true });

// Index for efficient queries
vehicleApplicationSchema.index({ loadId: 1, status: 1 });
vehicleApplicationSchema.index({ vehicleOwnerId: 1, status: 1 });

const VehicleApplication = mongoose.model('VehicleApplication', vehicleApplicationSchema);
export default VehicleApplication;