import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const documentSchema = new mongoose.Schema({
  field: { type: String, required: true }, // e.g. "ownerAadharFront"
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  whatsappNumber: { type: String },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['load_provider','vehicle_owner','admin','super_admin','parcel&courier'], required: true },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  profileCompleted: { type: Boolean, default: false },

  // subscription details
  subscriptionStatus: { type: String, enum: ['active','inactive','trial','expired'], default: 'inactive' },
  subscriptionEndDate: Date,
  trialDays: { type: Number, default: 0 },
  paymentHistory: [{
    amount: Number,
    paymentId: String,
    status: String,
    date: { type: Date, default: Date.now }
  }],

  // business info
  businessDetails: {
    companyName: String,
    businessType: { type: String, enum: ['manufacturer','trader','logistics','other'] },
    gstNumber: String,
    panNumber: String,
    registrationNumber: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },

  // owner/driver details
  ownerType: { type: String, enum: ['owner','owner_with_driver'] },
  licenseNumber: String,
  licenseExpiry: Date,

  // documents
  ownerDocuments: [documentSchema],
  driverDocuments: [documentSchema],

  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String
  },

  totalLoadsPosted: { type: Number, default: 0 },
  totalVehicles: { type: Number, default: 0 },
  preferredOperatingState: String,
  preferredOperatingDistrict: String,
  subscriptionFee: { type: Number, default: 1000 },
  subscriptionFeePerVehicle: { type: Number, default: 1000 }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.checkProfileCompletion = function () {
  let completedFields = 0;
  let totalFields = 0;

  // Example checks (tweak depending on required profile fields):
  if (this.name) { completedFields++; }
  totalFields++;

  if (this.email) { completedFields++; }
  totalFields++;

  if (this.address?.city && this.address?.state && this.address?.pincode) {
    completedFields++;
  }
  totalFields++;

  if (this.role === "load_provider") {
    if (this.businessDetails?.companyName && this.businessDetails?.gstNumber) {
      completedFields++;
    }
    totalFields++;
  }

  if (this.role === "vehicle_owner") {
    if (this.licenseNumber && this.licenseExpiry) {
      completedFields++;
    }
    totalFields++;
  }

  // mark in schema
  this.isProfileComplete = completedFields >= totalFields;

  return {
    completedFields,
    totalFields,
    percentage: totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0,
    isProfileComplete: this.isProfileComplete,
  };
};

const User = mongoose.model('User', userSchema);
export default User;
