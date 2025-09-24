import User from'../models/User.js';
import cloudinary from'../config/cloudinary.js';
import multer from'multer';

// Get profile completion status
// backend
export const getCompletionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        isComplete: user.profileCompleted === true
      },
    });
  } catch (error) {
    console.error("Get completion status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Upload image to Cloudinary
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { folder } = req.body;
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: folder || 'profile_documents',
          resource_type: 'image',
          format: 'jpg',
          transformation: [
            { width: 1000, height: 1000, crop: 'limit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              public_id: result.public_id
            });
          }
        }
      );
      uploadStream.end(req.file.buffer);
    });

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: result
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const {
      address,
      businessDetails,
      ownerType,
      licenseNumber,
      licenseExpiry,
      documents
    } = req.body;

    // Update address
    if (address) {
      user.address = {
        street: address.street || user.address?.street,
        city: address.city || user.address?.city,
        state: address.state || user.address?.state,
        pincode: address.pincode || user.address?.pincode,
        landmark: address.landmark || user.address?.landmark
      };
    }

    // Update role-specific fields
    if (user.role === 'load_provider') {
      if (businessDetails) {
        user.businessDetails = {
          companyName: businessDetails.companyName || user.businessDetails?.companyName,
          businessType: businessDetails.businessType || user.businessDetails?.businessType,
          gstNumber: businessDetails.gstNumber || user.businessDetails?.gstNumber,
          panNumber: businessDetails.panNumber || user.businessDetails?.panNumber
        };
      }
    } else if (user.role === 'vehicle_owner') {
      if (ownerType) user.ownerType = ownerType;
      if (licenseNumber) user.licenseNumber = licenseNumber;
      if (licenseExpiry) user.licenseExpiry = new Date(licenseExpiry);

      // Update documents
      if (documents) {
        if (!user.documents) user.documents = {};
        
        Object.keys(documents).forEach(key => {
          if (documents[key]) {
            user.documents[key] = documents[key];
          }
        });
      }
    }

 
    let isComplete = true;

    // Address required
    if (!user.address?.street || !user.address?.city || !user.address?.state || !user.address?.pincode) {
      isComplete = false;
    }

    if (user.role === 'load_provider') {
      if (
        !user.businessDetails?.companyName ||
        !user.businessDetails?.businessType ||
        !user.businessDetails?.gstNumber ||
        !user.businessDetails?.panNumber
      ) {
        isComplete = false;
      }
    } else if (user.role === 'vehicle_owner') {
      if (!user.ownerType || !user.licenseNumber || !user.licenseExpiry) {
        isComplete = false;
      }
    }

    // Update profileCompleted field
    user.profileCompleted = isComplete;

    // Save user
    await user.save();

    // Populate user data for response
    const updatedUser = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser,
        completionStatus: isComplete
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
};


// Delete uploaded image
export const deleteImage = async (req, res) => {
  try {
    const { public_id } = req.body;
    
    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(public_id);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Image delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image'
    });
  }
};

// Get profile completion statistics (admin)
export const getCompletionStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$isProfileComplete', true] }, 1, 0]
            }
          },
          verified: {
            $sum: {
              $cond: [{ $eq: ['$isVerified', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const completedProfiles = await User.countDocuments({ profileCompleted: true });
    const verifiedUsers = await User.countDocuments({ isApproved: true });

    res.json({
      success: true,
      data: {
        overall: {
          total: totalUsers,
          completed: completedProfiles,
          verified: verifiedUsers,
          completionRate: totalUsers > 0 ? (completedProfiles / totalUsers * 100).toFixed(2) : 0
        },
        byRole: stats
      }
    });
  } catch (error) {
    console.error('Get completion stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};