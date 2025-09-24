import mongoose from "mongoose";

const adminSettingsSchema = new mongoose.Schema(
  {
    subscriptionEnabled: {
      type: Boolean,
      default: true,
    },
    trialEnabled: {
      type: Boolean,
      default: true,
    },
    trialDays: {
      type: Number,
      default: 15,
    },
    loadProviderAccess: {
      type: Boolean,
      default: true,
    },
    vehicleOwnerAccess: {
      type: Boolean,
      default: true,
    },
    loadProviderFee: {
      type: Number,
      default: 1000,
    },
    vehicleOwnerFee: {
      type: Number,
      default: 1000,
    },
    commissionRate: {
      type: Number,
      default: 5,
    },
    smsEnabled: {
      type: Boolean,
      default: true,
    },
    appNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const AdminSettings = mongoose.model("AdminSettings", adminSettingsSchema);

export default AdminSettings;
