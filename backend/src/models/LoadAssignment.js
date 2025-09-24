import mongoose from 'mongoose';

const loadAssignmentSchema = new mongoose.Schema({
  loadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Load',
    required: true,
    
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
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleApplication',
    
  },
  agreedPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['assigned', 'enroute', 'delivered', 'completed'],
    default: 'assigned'
  },
  startedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
loadAssignmentSchema.index({ loadId: 1 });
loadAssignmentSchema.index({ vehicleId: 1 });
loadAssignmentSchema.index({ loadProviderId: 1, status: 1 });
loadAssignmentSchema.index({ vehicleOwnerId: 1, status: 1 });

const LoadAssignment = mongoose.model('LoadAssignment', loadAssignmentSchema);
export default LoadAssignment;