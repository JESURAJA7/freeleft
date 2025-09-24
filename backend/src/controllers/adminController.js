import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Load from '../models/Load.js';
import Vehicle from '../models/Vehicle.js';
import POD from '../models/POD.js';
import Payment from '../models/Payment.js';
import Commission from '../models/Commission.js';
import AdminSettings from '../models/AdminSettings.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
export const getDashboardStats = async (req, res) => {
  try {
    // Get total counts
    const totalLoads = await Load.countDocuments();
    const totalVehicles = await Vehicle.countDocuments();
    
    // Get active subscriptions
    const activeLoadProviders = await User.countDocuments({
      role: 'load_provider',
      subscriptionStatus: 'active'
    });
    
    const activeVehicleOwners = await User.countDocuments({
      role: 'vehicle_owner',
      subscriptionStatus: 'active'
    });

    // Get payment statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const paymentsToday = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const paymentsThisMonth = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: thisMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalPayments = await Payment.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Get pending approvals
    const pendingUsers = await User.countDocuments({ isApproved: false });
    const pendingVehicles = await Vehicle.countDocuments({ isApproved: false });
    const pendingPODs = await POD.countDocuments({ status: 'pending' });

    // Get commission data
    const commissionThisMonth = await Commission.aggregate([
      {
        $match: {
          status: 'deducted',
          createdAt: { $gte: thisMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$commissionAmount' }
        }
      }
    ]);

    const totalCommission = await Commission.aggregate([
      {
        $match: { status: 'deducted' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$commissionAmount' }
        }
      }
    ]);

    // Get trial users
    const trialUsers = await User.countDocuments({ subscriptionStatus: 'trial' });

    const stats = {
      totalLoads,
      totalVehicles,
      activeSubscriptions: {
        loadProviders: activeLoadProviders,
        vehicleOwners: activeVehicleOwners
      },
      paymentsReceived: {
        today: paymentsToday[0]?.total || 0,
        thisMonth: paymentsThisMonth[0]?.total || 0,
        total: totalPayments[0]?.total || 0
      },
      pendingApprovals: {
        users: pendingUsers,
        vehicles: pendingVehicles,
        pods: pendingPODs
      },
      commission: {
        thisMonth: commissionThisMonth[0]?.total || 0,
        total: totalCommission[0]?.total || 0
      },
      trialUsers
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getUsers = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (role) query.role = role;
    if (status === 'approved') query.isApproved = true;
    if (status === 'pending') query.isApproved = false;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      data: users
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve user
// @route   PUT /api/admin/users/:id/approve
// @access  Private (Admin only)
export const approveUser = async (req, res) => {
  try {
    const { trialDays } = req.body;
    
    const updateData = { isApproved: true };
    
    // If trial is enabled, set trial status
    const settings = await AdminSettings.findOne() || new AdminSettings();
    if (settings.trialEnabled && trialDays) {
      updateData.subscriptionStatus = 'trial';
      updateData.trialDays = trialDays;
      
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + trialDays);
      updateData.subscriptionEndDate = trialEndDate;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject user
// @route   PUT /api/admin/users/:id/reject
// @access  Private (Admin only)
export const rejectUser = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isApproved: false, 
        isActive: false,
        rejectionReason: reason
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User rejected successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all loads
// @route   GET /api/admin/loads
// @access  Private (Admin only)
export const getLoads = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const loads = await Load.find(query)
      .populate('loadProviderId', 'name email phone companyName')
      .populate('assignedVehicleId', 'vehicleNumber ownerName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Load.countDocuments(query);

    res.status(200).json({
      success: true,
      count: loads.length,
      total,
      data: loads
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all vehicles
// @route   GET /api/admin/vehicles
// @access  Private (Admin only)
export const getVehicles = async (req, res) => {
  try {
    const { status, approved, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (approved === 'true') query.isApproved = true;
    if (approved === 'false') query.isApproved = false;

    const vehicles = await Vehicle.find(query)
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Vehicle.countDocuments(query);

    res.status(200).json({
      success: true,
      count: vehicles.length,
      total,
      data: vehicles
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve vehicle
// @route   PUT /api/admin/vehicles/:id/approve
// @access  Private (Admin only)
export const approveVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle approved successfully',
      data: vehicle
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject vehicle
// @route   PUT /api/admin/vehicles/:id/reject
// @access  Private (Admin only)
export const rejectVehicle = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { 
        isApproved: false,
        rejectionReason: reason
      },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle rejected successfully',
      data: vehicle
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Match loads with vehicles
// @route   POST /api/admin/match-loads
// @access  Private (Admin only)
export const matchLoadsWithVehicles = async (req, res) => {
  try {
    const { loadId, vehicleId } = req.body;

    const load = await Load.findById(loadId);
    const vehicle = await Vehicle.findById(vehicleId);

    if (!load || !vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Load or Vehicle not found'
      });
    }

    // Check if vehicle is compatible
    const totalWeight = load.materials.reduce((sum, material) => sum + material.totalWeight, 0);
    if (vehicle.passingLimit * 1000 < totalWeight) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle weight capacity insufficient for this load'
      });
    }

    // Assign load to vehicle
    load.assignedVehicleId = vehicleId;
    load.status = 'assigned';
    await load.save();

    vehicle.status = 'assigned';
    await vehicle.save();

    // Create commission record if applicable
    if (load.withXBowSupport) {
      const settings = await AdminSettings.findOne() || new AdminSettings();
      const commissionAmount = (totalWeight * settings.commissionRate) / 100;
      
      await Commission.create({
        loadId,
        vehicleId,
        loadProviderId: load.loadProviderId,
        vehicleOwnerId: vehicle.ownerId,
        commissionAmount,
        commissionRate: settings.commissionRate,
        totalAmount: totalWeight
      });
    }

    res.status(200).json({
      success: true,
      message: 'Load assigned to vehicle successfully',
      data: { load, vehicle }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get admin settings
// @route   GET /api/admin/settings
// @access  Private (Admin only)
export const getAdminSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = await AdminSettings.create({});
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update admin settings
// @route   PUT /api/admin/settings
// @access  Private (Admin only)
export const updateAdminSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    Object.keys(req.body).forEach(key => {
      settings[key] = req.body[key];
    });

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all PODs
// @route   GET /api/admin/pods
// @access  Private (Admin only)
export const getPODs = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const pods = await POD.find(query)
      .populate('loadId', 'loadProviderName loadingLocation unloadingLocation')
      .populate('vehicleId', 'vehicleNumber ownerName')
      .populate('uploadedBy', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await POD.countDocuments(query);

    res.status(200).json({
      success: true,
      count: pods.length,
      total,
      data: pods
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve POD
// @route   PUT /api/admin/pods/:id/approve
// @access  Private (Admin only)
export const approvePOD = async (req, res) => {
  try {
    const { comments } = req.body;

    const pod = await POD.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: req.user._id,
        comments
      },
      { new: true }
    );

    if (!pod) {
      return res.status(404).json({
        success: false,
        message: 'POD not found'
      });
    }

    // Update load status to completed
    await Load.findByIdAndUpdate(pod.loadId, { status: 'completed' });

    res.status(200).json({
      success: true,
      message: 'POD approved successfully',
      data: pod
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject POD
// @route   PUT /api/admin/pods/:id/reject
// @access  Private (Admin only)
export const rejectPOD = async (req, res) => {
  try {
    const { comments } = req.body;

    const pod = await POD.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: req.user._id,
        comments
      },
      { new: true }
    );

    if (!pod) {
      return res.status(404).json({
        success: false,
        message: 'POD not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'POD rejected successfully',
      data: pod
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Private (Admin only)
export const getPayments = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const payments = await Payment.find(query)
      .populate('userId', 'name email phone role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      data: payments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get commission reports
// @route   GET /api/admin/commission
// @access  Private (Admin only)
export const getCommissionReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const commissions = await Commission.find(query)
      .populate('loadId', 'loadProviderName loadingLocation unloadingLocation')
      .populate('vehicleId', 'vehicleNumber')
      .populate('loadProviderId', 'name email phone')
      .populate('vehicleOwnerId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Commission.countDocuments(query);

    res.status(200).json({
      success: true,
      count: commissions.length,
      total,
      data: commissions
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate reports
// @route   GET /api/admin/reports/:type
// @access  Private (Admin only)
export const generateReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate } = req.query;

    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let data = [];
    let filename = '';

    switch (type) {
      case 'subscription':
        data = await Payment.find({ type: 'subscription', ...query })
          .populate('userId', 'name email phone role')
          .sort({ createdAt: -1 });
        filename = 'subscription_report.json';
        break;

      case 'commission':
        data = await Commission.find(query)
          .populate('loadId', 'loadProviderName')
          .populate('vehicleId', 'vehicleNumber')
          .populate('loadProviderId', 'name email')
          .populate('vehicleOwnerId', 'name email')
          .sort({ createdAt: -1 });
        filename = 'commission_report.json';
        break;

      case 'load-history':
        data = await Load.find(query)
          .populate('loadProviderId', 'name email phone')
          .populate('assignedVehicleId', 'vehicleNumber ownerName')
          .sort({ createdAt: -1 });
        filename = 'load_history_report.json';
        break;

      case 'pod-status':
        data = await POD.find(query)
          .populate('loadId', 'loadProviderName')
          .populate('vehicleId', 'vehicleNumber')
          .populate('uploadedBy', 'name phone')
          .sort({ createdAt: -1 });
        filename = 'pod_status_report.json';
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).json({
      success: true,
      reportType: type,
      generatedAt: new Date(),
      count: data.length,
      data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Toggle user access
// @route   PUT /api/admin/users/:id/toggle-access
// @access  Private (Admin only)
export const toggleUserAccess = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User access ${user.isActive ? 'enabled' : 'disabled'} successfully`,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Register admin user
// @route   POST /api/admin/register
// @access  Private (Super Admin only)
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    console.log("Register Admin:", { name, email, phone, role });

    // Validate password
    if (!password || password.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password is required and must be at least 6 characters"
      });
    }

    // Check if user already exists
    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Validate role
    const allowedRoles = ['admin', 'super_admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Allowed roles: admin, super_admin'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Hashed password:", hashedPassword);

    // Create admin user
    const adminUser = await Admin.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      isApproved: true,
      isActive: true,
      subscriptionStatus: 'active'
    });

    // Return response (without password)
    const userResponse = {
      _id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      phone: adminUser.phone,
      role: adminUser.role,
      isActive: adminUser.isActive,
      createdAt: adminUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error("Register Admin Error:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Login admin user
// @route   POST /api/admin/login
// @access  Public
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    //console.log("Login Admin Request:", { email, passwordReceived: !!password });

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Check if user exists
    const user = await Admin.findOne({ email }).select("+password");

   // console.log("Found user:", user);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Ensure password field exists in DB
    if (!user.password) {
      return res.status(500).json({
        success: false,
        message: "User password not set in database"
      });
    }

    // Check if user is an admin
    if (!["admin", "super_admin"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required."
      });
    }

    // Check if user is approved and active
    if (!user.isApproved || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is not approved or is deactivated"
      });
    }

    // Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isPasswordMatch);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Create token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    // Response without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: userResponse
    });
  } catch (error) {
    console.error("Login Admin Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};


// @desc    Get current admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin only)
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private (Admin only)
export const updateAdminProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const updatedAdmin = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Change admin password
// @route   PUT /api/admin/change-password
// @access  Private (Admin only)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const admin = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    admin.password = hashedPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export default {
  getDashboardStats,
  getUsers,
  approveUser,
  rejectUser,
  getLoads,
  getVehicles,
  approveVehicle,
  rejectVehicle,
  matchLoadsWithVehicles,
  getAdminSettings,
  updateAdminSettings,
  getPODs,
  approvePOD,
  rejectPOD,
  getPayments,
  getCommissionReports,
  generateReport,
  toggleUserAccess,
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changePassword
};