import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema(
  {
    loadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Load",
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    loadProviderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    commissionAmount: {
      type: Number,
      required: true,
    },
    commissionRate: {
      type: Number,
      required: true,
      default: 5,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "deducted", "paid"],
      default: "pending",
    },
    deductedAt: Date,
    paidAt: Date,
    smsNotificationSent: {
      type: Boolean,
      default: false,
    },
    appNotificationSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Commission = mongoose.model("Commission", commissionSchema);

export default Commission;
