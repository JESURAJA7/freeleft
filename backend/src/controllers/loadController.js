import Load from '../models/Load.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import upload from '../middleware/multer.js';


// @desc    Create new load
// @route   POST /api/loads
// @access  Private (Load Provider only)
export const createLoad = async (req, res) => {
  console.log('Create load request body:', req.body);
  console.log('Create load request files:', req.files);
  
  try {
    const {
      loadingLocation,
      unloadingLocation,
      vehicleRequirement,
      materials,
      loadingDate,
      loadingTime,
      paymentTerms,
      withXBowSupport
    } = req.body;

    // Parse JSON strings back to objects
    const parsedLoadingLocation = typeof loadingLocation === 'string' 
      ? JSON.parse(loadingLocation) 
      : loadingLocation;
    
    const parsedUnloadingLocation = typeof unloadingLocation === 'string' 
      ? JSON.parse(unloadingLocation) 
      : unloadingLocation;
    
    const parsedVehicleRequirement = typeof vehicleRequirement === 'string' 
      ? JSON.parse(vehicleRequirement) 
      : vehicleRequirement;
    
    const parsedMaterials = typeof materials === 'string' 
      ? JSON.parse(materials) 
      : materials;

    // Upload material images to Cloudinary if any files are provided
    let materialPhotos = [];
    if (req.files && req.files.length > 0) {
      materialPhotos = await Promise.all(
        req.files.map((file) => {
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: "loads/materials" },
              (error, result) => {
                if (error) reject(error);
                else resolve({
                  url: result.secure_url,
                  publicId: result.public_id,
                  type: file.fieldname // This will contain the photo type
                });
              }
            );
            uploadStream.end(file.buffer);
          });
        })
      );
    }

    // Process materials - merge uploaded photos with material data
    const processedMaterials = parsedMaterials.map((material, index) => {
      // Find photos for this material (by index or other identifier)
      const materialSpecificPhotos = materialPhotos.filter(photo => 
        photo.type && photo.type.includes(`material_${index}`)
      );
      
      return {
        ...material,
        photos: material.photos || materialSpecificPhotos
      };
    });

    // Calculate total load weight
    const totalWeight = processedMaterials.reduce((sum, material) => 
      sum + (material.totalWeight || 0), 0
    );

    // Create Load in DB
    const load = await Load.create({
      loadProviderId: req.user._id,
      loadProviderName: req.user.name,
      loadingLocation: parsedLoadingLocation,
      unloadingLocation: parsedUnloadingLocation,
      vehicleRequirement: parsedVehicleRequirement,
      materials: processedMaterials,
      loadingDate,
      loadingTime,
      paymentTerms,
      withXBowSupport: withXBowSupport === 'true',
      totalWeight,
      photos: materialPhotos,
      status: 'posted'
    });

    // Increment user load count
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalLoads: 1 } });

    res.status(201).json({
      success: true,
      message: "Load created successfully",
      data: load,
      _id: load._id // Ensure the ObjectId is returned
    });
  } catch (error) {
    console.error("Load creation error:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all loads for load provider
// @route   GET /api/loads
// @access  Private (Load Provider)
export const getMyLoads = async (req, res) => {
  try {
    const loads = await Load.find({ loadProviderId: req.user._id })
      .populate('assignedVehicleId', 'vehicleNumber ownerName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: loads.length,
      data: loads
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get available loads for vehicle owners
// @route   GET /api/loads/available
// @access  Private (Vehicle Owner)
export const getAvailableLoads = async (req, res) => {
  try {
    const { state, district, vehicleSize, vehicleType, trailerType } = req.query;

    let query = { status: 'posted' };

    if (state) {
      query['loadingLocation.state'] = state;
    }

    if (district) {
      query['loadingLocation.district'] = district;
    }

    if (vehicleSize) {
      query['vehicleRequirement.size'] = vehicleSize;
    }

    if (vehicleType) {
      query['vehicleRequirement.vehicleType'] = vehicleType;
    }

    if (trailerType && trailerType !== 'none') {
      query['vehicleRequirement.trailerType'] = trailerType;
    }

    const loads = await Load.find(query)
      .populate('loadProviderId', 'name phone companyName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: loads.length,
      data: loads
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single load
// @route   GET /api/loads/:id
// @access  Private
export const getLoad = async (req, res) => {
  try {
    const load = await Load.findById(req.params.id)
      .populate('loadProviderId', 'name phone email companyName')
      .populate('assignedVehicleId', 'vehicleNumber ownerName');

    if (!load) {
      return res.status(404).json({
        success: false,
        message: 'Load not found'
      });
    }

    if (req.user.role === 'load_provider' && load.loadProviderId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this load'
      });
    }

    res.status(200).json({
      success: true,
      data: load
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload material photos
// @route   POST /api/loads/:id/materials/:materialIndex/photos
// @access  Private (Load Provider)
export const uploadMaterialPhotos = async (req, res) => {
  console.log('Upload Material Photos Request Params:', req.params);
  console.log('Upload Material Photos Request Files:', req.files);
  console.log('Upload Material Photos', req.body);
  try {
    const { id, materialIndex } = req.params;

    const load = await Load.findById(id);
    if (!load) {
      return res.status(404).json({
        success: false,
        message: "Load not found",
      });
    }

    if (load.loadProviderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this load",
      });
    }

    const materialIdx = parseInt(materialIndex, 10);
    if (isNaN(materialIdx) || materialIdx >= load.materials.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid material index",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No photos uploaded",
      });
    }

    const uploadedPhotos = [];
    for (const file of req.files) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `xbow/loads/${id}/materials/${materialIdx}`,
            resource_type: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      uploadedPhotos.push({
        type: file.fieldname, // e.g. "photo" or "invoice"
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    load.materials[materialIdx].photos = uploadedPhotos;
    await load.save();

    res.status(200).json({
      success: true,
      message: "Photos uploaded successfully",
      data: load.materials[materialIdx],
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update load status
// @route   PUT /api/loads/:id/status
// @access  Private (Admin or Load Provider)
export const updateLoadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const load = await Load.findById(id);
    if (!load) {
      return res.status(404).json({
        success: false,
        message: 'Load not found'
      });
    }

    if (req.user.role !== 'admin' && load.loadProviderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this load'
      });
    }

    load.status = status;
    await load.save();

    res.status(200).json({
      success: true,
      message: 'Load status updated successfully',
      data: load
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a load
// @route   DELETE /api/loads/:id
// @access  Private (Load Provider or Admin)
export const deleteLoad = async (req, res) => {
  try {
    const { id } = req.params;

    const load = await Load.findById(id);
    if (!load) {
      return res.status(404).json({
        success: false,
        message: 'Load not found'
      });
    }

    // Check if user is authorized to delete this load
    if (req.user.role !== 'admin' && load.loadProviderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this load'
      });
    }

    // Check if load can be deleted (only posted loads can be deleted)
    if (load.status !== 'posted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete load. Only loads with "posted" status can be deleted.'
      });
    }

    // Delete material photos from cloud storage if they exist
    if (load.materials && load.materials.length > 0) {
      for (const material of load.materials) {
        if (material.photos && material.photos.length > 0) {
          for (const photo of material.photos) {
            try {
              await cloudinary.uploader.destroy(photo.publicId);
            } catch (error) {
              console.error('Error deleting photo from cloud storage:', error);
              // Continue with deletion even if photo deletion fails
            }
          }
        }
      }
    }

    // Delete the load
    await Load.findByIdAndDelete(id);

    // Update user's total loads count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalLoadsPosted: -1 }
    });

    res.status(200).json({
      success: true,
      message: 'Load deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting load:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting load'
    });
  }
};
