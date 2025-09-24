import POD from '../models/POD.js';
import Load from '../models/Load.js';
import Vehicle from '../models/Vehicle.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Upload POD
// @route   POST /api/pods
// @access  Private (Vehicle Owner)
const uploadPOD = async (req, res) => {
  try {
    const { loadId, vehicleId, type, file } = req.body; // file is base64

    const load = await Load.findById(loadId);
    const vehicle = await Vehicle.findById(vehicleId);

    if (!load || !vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Load or Vehicle not found'
      });
    }

    if (vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload POD for this vehicle'
      });
    }

    if (load.assignedVehicleId.toString() !== vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Load is not assigned to this vehicle'
      });
    }

    const result = await cloudinary.uploader.upload(file, {
      folder: `xbow/pods/${loadId}`,
      resource_type: 'auto'
    });

    const pod = await POD.create({
      loadId,
      vehicleId,
      uploadedBy: req.user._id,
      type,
      url: result.secure_url,
      publicId: result.public_id
    });

    await Load.findByIdAndUpdate(loadId, { status: 'delivered' });

    res.status(201).json({
      success: true,
      message: 'POD uploaded successfully',
      data: pod
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get PODs for a load
// @route   GET /api/pods/load/:loadId
// @access  Private
const getPODsByLoad = async (req, res) => {
  try {
    const { loadId } = req.params;

    const load = await Load.findById(loadId);
    if (!load) {
      return res.status(404).json({
        success: false,
        message: 'Load not found'
      });
    }

    if (
      req.user.role !== 'admin' &&
      load.loadProviderId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view PODs for this load'
      });
    }

    const pods = await POD.find({ loadId })
      .populate('vehicleId', 'vehicleNumber ownerName')
      .populate('uploadedBy', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pods.length,
      data: pods
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get PODs for vehicle owner
// @route   GET /api/pods/my-pods
// @access  Private (Vehicle Owner)
const getMyPODs = async (req, res) => {
  try {
    const pods = await POD.find({ uploadedBy: req.user._id })
      .populate('loadId', 'loadProviderName loadingLocation unloadingLocation')
      .populate('vehicleId', 'vehicleNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pods.length,
      data: pods
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single POD
// @route   GET /api/pods/:id
// @access  Private
const getPOD = async (req, res) => {
  try {
    const pod = await POD.findById(req.params.id)
      .populate('loadId', 'loadProviderName loadingLocation unloadingLocation')
      .populate('vehicleId', 'vehicleNumber ownerName')
      .populate('uploadedBy', 'name phone')
      .populate('reviewedBy', 'name');

    if (!pod) {
      return res.status(404).json({
        success: false,
        message: 'POD not found'
      });
    }

    const load = await Load.findById(pod.loadId);
    if (
      req.user.role !== 'admin' &&
      load.loadProviderId.toString() !== req.user._id.toString() &&
      pod.uploadedBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this POD'
      });
    }

    res.status(200).json({
      success: true,
      data: pod
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export {
  uploadPOD,
  getPODsByLoad,
  getMyPODs,
  getPOD
};
