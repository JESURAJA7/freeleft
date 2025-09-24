import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  dimensions: {
    length: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 }
  },
  packType: {
    type: String,
    enum: ['single', 'multi'],
    required: true
  },
  totalCount: {
    type: Number,
    required: true,
    min: 1
  },
  singleWeight: {
    type: Number,
    required: true,
    min: 0
  },
  totalWeight: {
    type: Number,
    required: true,
    min: 0
  },
  photos: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  }]
});

const loadSchema = new mongoose.Schema({
  loadProviderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loadProviderName: {
    type: String,
    required: true
  },
  loadingLocation: {
    pincode: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    place: { type: String, required: true },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  unloadingLocation: {
    pincode: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    place: { type: String, required: true },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  vehicleRequirement: {
    vehicleType: {
      type: String,
      enum: ['2-wheel', '3-wheel', '4-wheel', '6-wheel', '8-wheel', '10-wheel', '12-wheel', '14-wheel', '16-wheel', '18-wheel', '20-wheel','trailer'],
      required: true
    },
    size: {
      type: Number,
      required: true,
      enum: [20,40,50,60,70,110]
    },
    trailerType: {
      type: String,
      enum: ['lowbed', 'semi-lowbed', 'hydraulic-axle-8', 'crane-14t', 'crane-25t', 'crane-50t', 'crane-100t', 'crane-200t', 'none','flatbed'],
      default: 'none'
    }
  },
  materials: {
    type: [materialSchema],
    validate: {
      validator: function (materials) {
        return materials.length >= 1 && materials.length <= 5;
      },
      message: 'A load must have between 1 and 5 materials'
    }
  },
  loadingDate: {
    type: Date,
    required: true
  },
  loadingTime: {
    type: String,
    required: true
  },
  photos: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }}],
  paymentTerms: {
    type: String,
    enum: ['advance', 'cod', 'after_pod', 'to_pay', 'credit'],
    required: true
  },
  withXBowSupport: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['posted', 'assigned', 'enroute', 'delivered', 'completed'],
    default: 'posted'
  },
  assignedVehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  commissionApplicable: {
    type: Boolean,
    default: false
  },
  commissionAmount: Number
}, {
  timestamps: true
});

// Pre-save hook for calculating commission
loadSchema.pre('save', function (next) {
  this.commissionApplicable = this.withXBowSupport;
  if (this.commissionApplicable && this.assignedVehicleId) {
    // Placeholder logic: Replace with actual calculation
    this.commissionAmount = 2500;
  }
  next();
});

const Load = mongoose.model('Load', loadSchema);
export default Load;
