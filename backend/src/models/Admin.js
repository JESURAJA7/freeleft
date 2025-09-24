import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "User email is required"],
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    password: {
      type: String,
      required: [true, "User password not set in database"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // hide password by default in queries
    },
    role: {
      type: String,
      enum: ["user", "admin", "super_admin"],
      default: "user",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "inactive",
    },
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", userSchema);

export default Admin;
