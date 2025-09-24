import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
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
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  isRead: {
    type: Boolean,
    default: false
  },
  messageType: {
    type: String,
    enum: ['application', 'negotiation', 'status_update', 'general'],
    default: 'general'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
messageSchema.index({ loadId: 1, createdAt: -1 });
messageSchema.index({ fromUserId: 1, toUserId: 1, loadId: 1 });
messageSchema.index({ toUserId: 1, isRead: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;