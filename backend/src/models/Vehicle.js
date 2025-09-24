import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerName: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['2-wheel', '3-wheel', '4-wheel', '6-wheel', '8-wheel', '10-wheel', '12-wheel', '14-wheel', '16-wheel', '18-wheel', '20-wheel'],
    required: true
  },
  vehicleSize: {
    type: Number,
    enum: [6, 8.5, 10, 14, 17, 19, 20, 22, 24],
    required: true
  },
 
  dimensions: {
    length: { type: Number, required: true },
    breadth: { type: Number, required: true }
  },
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: [/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/, 'Please enter a valid vehicle number']
  },
  passingLimit: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
 availability: {
  type: Date,
  required: true
},

bodyType: {
    type: String,
   
    required: true
  },

  tarpaulin: {
    type: String,
    enum: ['one', 'two', 'none'],
    required: true
  },
  trailerType: {
    type: String,
    enum: ['lowbed', 'semi-lowbed', 'hydraulic-axle-8', 'crane-14t', 'crane-25t', 'crane-50t', 'crane-100t', 'crane-200t', 'none'],
    default: 'none'
  },
operatingAreas: [
  {
    state: { type: String, required: true },
    district: { type: String, required: true },
    place: { type: String, required: true }
  }
]
,
  photos: [{
   
    url: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['available', 'assigned', 'in_transit', 'delivered', 'unavailable', 'maintenance', 'completed'],
    default: 'available'
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
