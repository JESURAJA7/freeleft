import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Load',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoadAssignment',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['load_provider_to_vehicle_owner', 'vehicle_owner_to_load_provider'],
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate ratings
ratingSchema.index({ fromUserId: 1, toUserId: 1, loadId: 1, type: 1 }, { unique: true });

// Indexes for efficient queries
ratingSchema.index({ toUserId: 1, type: 1 });
ratingSchema.index({ loadId: 1 });

const Rating = mongoose.model('Rating', ratingSchema);
export default Rating;