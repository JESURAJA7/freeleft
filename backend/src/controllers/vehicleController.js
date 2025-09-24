import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import Load from '../models/Load.js';
import VehicleRequest from '../models/VehicleRequest.js'
import VehicleApplication from '../models/VehicleApplication.js';
import LoadAssignment from '../models/LoadAssignment.js';
import Message from '../models/Message.js';
import Rating from '../models/Rating.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Create new vehicle
// @route   POST /api/vehicles
// @access  Private (Vehicle Owner only)
export const createVehicle = async (req, res) => {
  console.log('Create vehicle request body:', req.body);
  //console.log('Create vehicle request files:', req.files);
  try {
    const {
      vehicleType,
      vehicleSize,
      vehicleWeight,
      dimensions,
      vehicleNumber,
      passingLimit,
      availability,
      isOpen,
      bodyType,
      tarpaulin,
      trailerType,
      operatingAreas
    } = req.body;

    // Upload images to Cloudinary
    let imageUploads = [];
    if (req.files && req.files.length > 0) {
      imageUploads = await Promise.all(
        req.files.map((file) => {
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: "vehicles" },
              (error, result) => {
                if (error) reject(error);
                else resolve({
                  url: result.secure_url,
                  public_id: result.public_id
                });
              }
            );
            uploadStream.end(file.buffer);
          });
        })
      );
    }
    //console.log('Uploaded images:', imageUploads);

    // Create Vehicle in DB
    const vehicle = await Vehicle.create({
      ownerId: req.user._id,
      ownerName: req.user.name,
      vehicleType,
      vehicleSize,
      vehicleWeight,
      dimensions: dimensions ? JSON.parse(dimensions) : {},
      vehicleNumber,
      passingLimit,
      availability,
      isOpen,
      bodyType,
      tarpaulin,
      trailerType,
      operatingAreas: operatingAreas ? JSON.parse(operatingAreas) : [],
      photos: imageUploads
    });

    // Increment user vehicle count
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalVehicles: 1 } });

    res.status(201).json({
      success: true,
      message: "Vehicle registered successfully",
      data: vehicle
    });
  } catch (error) {
    console.error("Vehicle creation error:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all vehicles for vehicle owner
// @route   GET /api/vehicles
// @access  Private (Vehicle Owner)
export const getMyVehicles = async (req, res) => {
  try {
    //console.log('Get my vehicles for user:', req.user._id);
    const vehicles = await Vehicle.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    //console.log('Fetched vehicles:', vehicles);

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Private
export const getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('ownerId', 'name phone email');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    if (
      req.user.role === 'vehicle_owner' &&
      vehicle.ownerId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this vehicle'
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload vehicle photos
// @route   POST /api/vehicles/:id/photos
// @access  Private (Vehicle Owner)
export const uploadVehiclePhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const { photos } = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    if (vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vehicle'
      });
    }

    const uploadedPhotos = [];

    for (const photo of photos) {
      console.log('Uploading photo:', photo);
      const result = await cloudinary.uploader.upload(photo, {
        folder: `xbow/vehicles/${id}`,
        resource_type: 'auto'
      });

      uploadedPhotos.push({
        type: photo.type,
        url: result.secure_url,
        publicId: result.public_id
      });
    }

    vehicle.photos = uploadedPhotos;
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Photos uploaded successfully',
      data: vehicle
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update vehicle status
// @route   PUT /api/vehicles/:id/status
// @access  Private (Vehicle Owner)
export const updateVehicleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    if (vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vehicle'
      });
    }

    vehicle.status = status;
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle status updated successfully',
      data: vehicle
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get available vehicles for loads
// @route   GET /api/vehicles/available
// @access  Private (Admin, Load Provider)
export const getAvailableVehicles = async (req, res) => {
  try {
    const { state, district, vehicleSize, vehicleType } = req.query;

    let query = {
      status: 'available',
      isApproved: true
    };

    if (state) {
      query['preferredOperatingArea.state'] = state;
    }

    if (district) {
      query['preferredOperatingArea.district'] = district;
    }

    if (vehicleSize) {
      query.passingLimit = { $gte: vehicleSize };
    }

    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    const vehicles = await Vehicle.find(query)
      .populate('ownerId', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getMatchingVehicles = async (req, res) => {
  try {
    const { loadId } = req.params;

    const load = await Load.findById(loadId);
    if (!load) {
      return res.status(404).json({
        success: false,
        message: 'Load not found'
      });
    }

    const totalWeight = load.materials.reduce((sum, material) => sum + material.totalWeight, 0);

    // Find vehicles that match the requirements
    const matchingVehicles = await Vehicle.find({
      vehicleType: load.vehicleRequirement.vehicleType,
      vehicleSize: { $gte: load.vehicleRequirement.size },
      passingLimit: { $gte: totalWeight / 1000 },
      status: 'available',
      isApproved: true,
      availability: { $lte: new Date(load.loadingDate) },
      ...(load.vehicleRequirement.trailerType && load.vehicleRequirement.trailerType !== 'none' && {
        trailerType: load.vehicleRequirement.trailerType
      })
    }).populate('ownerId', 'name phone email');

    res.json({
      success: true,
      data: matchingVehicles
    });
  } catch (error) {
    console.error('Error getting matching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get matching vehicles'
    });
  }
};

// Apply for a load with a vehicle
export const applyForLoad = async (req, res) => {
  try {
    const { loadId, vehicleId, bidPrice, message } = req.body;
    const userId = req.user.id;

    // Verify vehicle ownership
    const vehicle = await Vehicle.findOne({ _id: vehicleId, ownerId: userId });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or not owned by you'
      });
    }

    // Verify load exists and is available
    const load = await Load.findOne({ _id: loadId, status: 'posted' });
    if (!load) {
      return res.status(404).json({
        success: false,
        message: 'Load not found or no longer available'
      });
    }
    // chect if vehicle status is available
    if (vehicle.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is not available for assignment'
      });
    }

    // Check if already applied
    const existingApplication = await VehicleApplication.findOne({
      vehicleId,
      loadId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this load with this vehicle'
      });
    }

    // Create application
    const application = new VehicleApplication({
      vehicleId,
      loadId,
      vehicleOwnerId: userId,
      vehicleOwnerName: req.user.name,
      bidPrice,
      message
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Application sent successfully',
      data: application
    });
  } catch (error) {
    console.error('Error applying for load:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply for load'
    });
  }
};

// Get applications for a load (for load providers)
export const getLoadApplications = async (req, res) => {
  try {
    const { loadId } = req.params;
    const userId = req.user.id;

    // Verify load ownership
    const load = await Load.findOne({ _id: loadId, loadProviderId: userId });
    if (!load) {
      return res.status(404).json({
        success: false,
        message: 'Load not found or not owned by you'
      });
    }

    const applications = await VehicleApplication.find({ loadId })
      .populate({
        path: 'vehicleId',
        model: 'Vehicle',
        populate: {
          path: 'ownerId',
          model: 'User',
          select: 'name phone email'
        }
      })
      .sort({ appliedAt: -1 });

    // Transform data to include vehicle details
    const transformedApplications = applications.map(app => ({
      ...app.toObject(),
      vehicle: app.vehicleId
    }));

    res.json({
      success: true,
      data: transformedApplications
    });
  } catch (error) {
    console.error('Error getting load applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get load applications'
    });
  }
};

// Accept or reject vehicle application
export const respondToApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, agreedPrice } = req.body;
    const userId = req.user.id;

    const application = await VehicleApplication.findById(applicationId)
      .populate('loadId')
      .populate('vehicleId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify load ownership
    if (application.loadId.loadProviderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this application'
      });
    }

    // Update application status
    application.status = status;
    application.respondedAt = new Date();
    application.respondedBy = userId;
    await application.save();

    if (status === 'accepted') {
      // Create load assignment
      const assignment = new LoadAssignment({
        loadId: application.loadId._id,
        vehicleId: application.vehicleId._id,
        loadProviderId: userId,
        vehicleOwnerId: application.vehicleOwnerId,
        applicationId: application._id,
        agreedPrice
      });
      await assignment.save();

      // Update load status
      await Load.findByIdAndUpdate(application.loadId._id, {
        status: 'assigned',
        assignedVehicleId: application.vehicleId._id
      });

      // Update vehicle status
      await Vehicle.findByIdAndUpdate(application.vehicleId._id, {
        status: 'assigned'
      });

      // Reject other pending applications for this load
      await VehicleApplication.updateMany(
        {
          loadId: application.loadId._id,
          _id: { $ne: application._id },
          status: 'pending'
        },
        {
          status: 'rejected',
          respondedAt: new Date(),
          respondedBy: userId
        }
      );
    }

    res.json({
      success: true,
      message: `Application ${status} successfully`,
      data: application
    });
  } catch (error) {
    console.error('Error responding to application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to application'
    });
  }
};

// Get my vehicle applications (for vehicle owners)
export const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;

    const applications = await VehicleApplication.find({ vehicleOwnerId: userId })
      .populate('loadId')
      .populate('vehicleId')
      .sort({ appliedAt: -1 });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error getting my applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get applications'
    });
  }
};

// Update load assignment status
export const updateAssignmentStatus = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    console.log('Update assignment status request:', req.params, req.body);
    const { status } = req.body;
    const userId = req.user.id;

    const assignment = await LoadAssignment.findById(assignmentId)
      .populate('loadId')
      .populate('vehicleId');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Verify authorization (either load provider or vehicle owner)
    if (assignment.loadProviderId.toString() !== userId &&
      assignment.vehicleOwnerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this assignment'
      });
    }

    // Update assignment status
    assignment.status = status;

    // Set timestamps based on status
    switch (status) {
      case 'in_progress':
        assignment.startedAt = new Date();
        break;
      case 'delivered':
        assignment.deliveredAt = new Date();
        break;
      case 'completed':
        assignment.completedAt = new Date();
        break;
    }

    await assignment.save();

    // Update load status
    await Load.findByIdAndUpdate(assignment.loadId._id, { status });

    // Update vehicle status
    let vehicleStatus = 'assigned';
    if (status === 'in_progress') vehicleStatus = 'in_transit';
    if (status === 'completed') vehicleStatus = 'available';

    await Vehicle.findByIdAndUpdate(assignment.vehicleId._id, { status: vehicleStatus });

    res.json({
      success: true,
      message: 'Assignment status updated successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment status'
    });
  }
};

// Send message between load provider and vehicle owner
export const sendMessage = async (req, res) => {
  try {
    const { loadId, vehicleId, message } = req.body;
    console.log('Send message request:', req.body);
    const fromUserId = req.user.id;

    // Find the assignment to get the other party's ID
    const assignment = await LoadAssignment.findOne({ loadId, vehicleId });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Determine recipient
    let toUserId;
    if (assignment.loadProviderId.toString() === fromUserId) {
      toUserId = assignment.vehicleOwnerId;
    } else if (assignment.vehicleOwnerId.toString() === fromUserId) {
      toUserId = assignment.loadProviderId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages for this assignment'
      });
    }

    const newMessage = new Message({
      fromUserId,
      toUserId,
      loadId,
      vehicleId,
      message
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Get messages for a load/vehicle combination
export const getMessages = async (req, res) => {
  try {
    const { loadId, vehicleId } = req.params;
    const userId = req.user.id;

    // Verify user is part of this conversation
    const assignment = await LoadAssignment.findOne({ loadId, vehicleId });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.loadProviderId.toString() !== userId &&
      assignment.vehicleOwnerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these messages'
      });
    }

    const messages = await Message.find({ loadId, vehicleId })
      .populate('fromUserId', 'name')
      .populate('toUserId', 'name')
      .sort({ createdAt: 1 });

    // Mark messages as read for the current user
    await Message.updateMany(
      { loadId, vehicleId, toUserId: userId, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
};

// Submit rating and review
export const submitRating = async (req, res) => {
  try {
    const { loadId, vehicleId, rating, comment } = req.body;
    const fromUserId = req.user.id;

    // Find the assignment
    const assignment = await LoadAssignment.findOne({ loadId, vehicleId, status: 'completed' });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Completed assignment not found'
      });
    }

    // Determine recipient and rating type
    let toUserId, type;
    if (assignment.loadProviderId.toString() === fromUserId) {
      toUserId = assignment.vehicleOwnerId;
      type = 'load_provider_to_vehicle_owner';
    } else if (assignment.vehicleOwnerId.toString() === fromUserId) {
      toUserId = assignment.loadProviderId;
      type = 'vehicle_owner_to_load_provider';
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this assignment'
      });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({
      fromUserId,
      toUserId,
      loadId,
      type
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this assignment'
      });
    }

    const newRating = new Rating({
      fromUserId,
      toUserId,
      loadId,
      vehicleId,
      assignmentId: assignment._id,
      rating,
      comment,
      type
    });

    await newRating.save();

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: newRating
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating'
    });
  }
};

// Get ratings for a user
export const getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;

    const ratings = await Rating.find({ toUserId: userId })
      .populate('fromUserId', 'name')
      .populate('loadId', 'loadingLocation unloadingLocation')
      .populate('vehicleId', 'vehicleNumber')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
      : 0;

    res.json({
      success: true,
      data: {
        ratings,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: ratings.length
      }
    });
  } catch (error) {
    console.error('Error getting user ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user ratings'
    });
  }
};

// Select vehicle for load (alternative to respondToApplication)
export const selectVehicle = async (req, res) => {
  try {
    const { loadId, vehicleId, agreedPrice } = req.body;
    const userId = req.user.id;

    // Find the application
    const application = await VehicleApplication.findOne({
      loadId,
      vehicleId,
      status: 'pending'
    }).populate('loadId').populate('vehicleId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify load ownership
    if (application.loadId.loadProviderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to select vehicle for this load'
      });
    }

    // Accept the application
    application.status = 'accepted';
    application.respondedAt = new Date();
    application.respondedBy = userId;
    await application.save();

    // Create load assignment
    const assignment = new LoadAssignment({
      loadId,
      vehicleId,
      loadProviderId: userId,
      vehicleOwnerId: application.vehicleOwnerId,
      applicationId: application._id,
      agreedPrice
    });
    await assignment.save();

    // Update load status
    await Load.findByIdAndUpdate(loadId, {
      status: 'assigned',
      assignedVehicleId: vehicleId
    });

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(vehicleId, {
      status: 'assigned'
    });

    // Reject other pending applications
    await VehicleApplication.updateMany(
      {
        loadId,
        _id: { $ne: application._id },
        status: 'pending'
      },
      {
        status: 'rejected',
        respondedAt: new Date(),
        respondedBy: userId
      }
    );

    res.json({
      success: true,
      message: 'Vehicle selected successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error selecting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to select vehicle'
    });
  }
};

// Send vehicle request to vehicle owner (for load providers)
export const sendVehicleRequest = async (req, res) => {
  try {
    const { loadId, vehicleId, message } = req.body;
    const userId = req.user.id;

    // Verify load ownership
    const load = await Load.findOne({ _id: loadId, loadProviderId: userId });
    if (!load) {
      return res.status(404).json({
        success: false,
        message: 'Load not found or not owned by you'
      });
    }

    // Verify vehicle exists and is available
    const vehicle = await Vehicle.findOne({ _id: vehicleId, status: 'available', isApproved: true });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or not available'
      });
    }



    // Create vehicle request
    const vehicleRequest = new VehicleRequest({
      loadId,
      vehicleId,
      loadProviderId: userId,
      vehicleOwnerId: vehicle.ownerId,
      loadProviderName: req.user.name,
      message
    });

    await vehicleRequest.save();

    res.status(201).json({
      success: true,
      message: 'Vehicle request sent successfully',
      data: vehicleRequest
    });
  } catch (error) {
    console.error('Error sending vehicle request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send vehicle request'
    });
  }
};

// Get vehicle requests for vehicle owner
export const getVehicleRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await VehicleRequest.find({ vehicleOwnerId: userId })
      .populate('loadId')
      .populate('vehicleId')
      .sort({ sentAt: -1 });

    // Transform response
    const transformed = requests.map(r => ({
      ...r.toObject(),
      vehicle: r.vehicleId,
      load: r.loadId,
    }));

    res.json({
      success: true,
      data: transformed
    });
  } catch (error) {
    console.error('Error getting vehicle requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vehicle requests'
    });
  }
};


// Respond to vehicle request
export const respondToVehicleRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    console.log('Responding to vehicle request:', requestId, req.body);

    const request = await VehicleRequest.findById(requestId)
      .populate('loadId')
      .populate('vehicleId');
    console.log('Found vehicle request:', request);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle request not found'
      });
    }

    // Verify vehicle ownership
    if (request.vehicleOwnerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this request'
      });
    }

    // If accepting, check vehicle status before assigning
    if (status === 'accepted') {
      const vehicle = await Vehicle.findById(request.vehicleId._id);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      if (vehicle.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: 'Vehicle already assigned...'
        });
      }
    }

    // Update request status
    request.status = status;
    request.respondedAt = new Date();
    await request.save();

    if (status === 'accepted') {
      // Create load assignment
      const assignment = new LoadAssignment({
        loadId: request.loadId._id,
        vehicleId: request.vehicleId._id,
        loadProviderId: request.loadProviderId,
        vehicleOwnerId: userId,
        applicationId: null, // No application for direct requests
        agreedPrice: 0 // Will be negotiated separately
      });
      await assignment.save();

      // Update load status
      await Load.findByIdAndUpdate(request.loadId._id, {
        status: 'assigned',
        assignedVehicleId: request.vehicleId._id
      });

      // Update vehicle status
      await Vehicle.findByIdAndUpdate(request.vehicleId._id, {
        status: 'assigned'
      });

      // Reject other pending requests for this load
      await VehicleRequest.updateMany(
        {
          loadId: request.loadId._id,
          _id: { $ne: request._id },
          status: 'pending'
        },
        {
          status: 'rejected',
          respondedAt: new Date()
        }
      );
    }

    res.json({
      success: true,
      message: `Vehicle request ${status} successfully`,
      data: request
    });
  } catch (error) {
    console.error('Error responding to vehicle request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to vehicle request'
    });
  }
};


// Get matching vehicles for a load with compatibility scoring
// export const getMatchingVehiclesForLoad = async (req, res) => {
//   try {
//     const { loadId } = req.params;
//     const userId = req.user._id;

//     // Verify load ownership
//     const load = await Load.findOne({ _id: loadId, loadProviderId: userId });
//     if (!load) {
//       return res.status(404).json({
//         success: false,
//         message: 'Load not found or not owned by you'
//       });
//     }

//     const totalWeight = load.materials.reduce((sum, material) => sum + material.totalWeight, 0);

//     // Find vehicles that match the requirements
//     const matchingVehicles = await Vehicle.find({
//       vehicleType: load.vehicleRequirement.vehicleType,
//       vehicleSize: { $gte: load.vehicleRequirement.size },
//       passingLimit: { $gte: totalWeight / 1000 },
//       status: 'available',
//       isApproved: true,
//       availability: { $lte: new Date(load.loadingDate) },
//       ...(load.vehicleRequirement.trailerType && load.vehicleRequirement.trailerType !== 'none' && {
//         trailerType: load.vehicleRequirement.trailerType
//       })
//     }).populate('ownerId', 'name phone email');

//     // Get existing requests for this load
//     const existingRequests = await VehicleRequest.find({ loadId });
//     const requestMap = new Map(existingRequests.map(req => [req.vehicleId.toString(), req]));

//     // Calculate compatibility scores and add request status
//     const vehiclesWithScores = matchingVehicles.map(vehicle => {
//       let score = 0;

//       // Vehicle type match (30 points)
//       if (vehicle.vehicleType === load.vehicleRequirement.vehicleType) score += 30;

//       // Size compatibility (25 points)
//       if (vehicle.vehicleSize >= load.vehicleRequirement.size) score += 25;

//       // Weight capacity (25 points)
//       if (vehicle.passingLimit >= totalWeight / 1000) score += 25;

//       // Trailer type match (20 points)
//       if (vehicle.trailerType === load.vehicleRequirement.trailerType) score += 20;

//       const compatibilityScore = Math.min(score, 100);
//       const request = requestMap.get(vehicle._id.toString());
//       console.log(score);
//       console.log('Vehicle:', vehicle._id, 'Score:', compatibilityScore, 'Request:', request);

//       return {
//         ...vehicle.toObject(),
//         compatibilityScore,
//         distance: Math.floor(Math.random() * 800) + 200, // Mock distance
//         isRequested: !!request,
//         requestStatus: request?.status
//       };
//     });

//     // Sort by compatibility score
//     vehiclesWithScores.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

//     res.json({
//       success: true,
//       data: {
//         load,
//         vehicles: vehiclesWithScores
//       }
//     });
//   } catch (error) {
//     console.error('Error getting matching vehicles for load:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to get matching vehicles'
//     });
//   }
// };


export const getMatchingVehiclesForLoad = async (req, res) => {
  try {
    const { loadId } = req.params;
    const userId = req.user._id;

    // Verify load ownership
    const load = await Load.findOne({ _id: loadId, loadProviderId: userId });
    if (!load) {
      return res.status(404).json({
        success: false,
        message: 'Load not found or not owned by you'
      });
    }

    // ✅ Simple matching: only check status + type + size
    const matchingVehicles = await Vehicle.find({
      status: 'available',
      vehicleType: load.vehicleRequirement.vehicleType,
      vehicleSize: { $gte: load.vehicleRequirement.size }
    }).populate('ownerId', 'name phone email');

    res.json({
      success: true,
      data: {
        load,
        vehicles: matchingVehicles
      }
    });
  } catch (error) {
    console.error('Error getting matching vehicles for load:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get matching vehicles'
    });
  }
};

// @desc    Update vehicle details
// @route   PUT /api/vehicles/:id
// @access  Private (Vehicle Owner)
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    if (vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vehicle'
      });
    }

    // Handle image updates if files are provided
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      if (vehicle.photos && vehicle.photos.length > 0) {
        await Promise.all(
          vehicle.photos.map(photo =>
            cloudinary.uploader.destroy(photo.public_id)
          )
        );
      }

      // Upload new images
      const imageUploads = await Promise.all(
        req.files.map((file) => {
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: "vehicles" },
              (error, result) => {
                if (error) reject(error);
                else resolve({
                  url: result.secure_url,
                  public_id: result.public_id
                });
              }
            );
            uploadStream.end(file.buffer);
          });
        })
      );

      updateData.photos = imageUploads;
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: updatedVehicle
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (Vehicle Owner)
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    if (vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this vehicle'
      });
    }

    // Delete images from Cloudinary
    if (vehicle.photos && vehicle.photos.length > 0) {
      await Promise.all(
        vehicle.photos.map(photo =>
          cloudinary.uploader.destroy(photo.public_id)
        )
      );
    }

    await Vehicle.findByIdAndDelete(id);

    // Decrement user vehicle count
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalVehicles: -1 } });

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get load assignments for user
// @route   GET /api/assignments
// @access  Private
export const getMyAssignments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = {
      $or: [
        { loadProviderId: userId },
        { vehicleOwnerId: userId }
      ]
    };

    if (status) {
      query.status = status;
    }

    const assignments = await LoadAssignment.find(query)
      .populate('loadId')
      .populate('vehicleId')
      .populate('loadProviderId', 'name phone')
      .populate('vehicleOwnerId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error getting assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assignments'
    });
  }
};

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
export const getAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const assignment = await LoadAssignment.findById(id)
      .populate('loadId')
      .populate('vehicleId')
      .populate('loadProviderId', 'name phone email')
      .populate('vehicleOwnerId', 'name phone email');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Verify authorization
    if (assignment.loadProviderId._id.toString() !== userId &&
      assignment.vehicleOwnerId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this assignment'
      });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error getting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assignment'
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
export const getUnreadMessageCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Message.countDocuments({
      toUserId: userId,
      isRead: false
    });

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Error getting unread message count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread message count'
    });
  }
};

// @desc    Get all conversations for user
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get unique load-vehicle combinations where user has messages
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { fromUserId: mongoose.Types.ObjectId(userId) },
            { toUserId: mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $group: {
          _id: {
            loadId: '$loadId',
            vehicleId: '$vehicleId'
          },
          lastMessage: { $last: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$toUserId', mongoose.Types.ObjectId(userId)] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'loads',
          localField: '_id.loadId',
          foreignField: '_id',
          as: 'load'
        }
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id.vehicleId',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      {
        $unwind: '$load'
      },
      {
        $unwind: '$vehicle'
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations'
    });
  }
};

// @desc    Get all vehicles (Admin)
// @route   GET /api/admin/vehicles
// @access  Private (Admin)
export const getAllVehicles = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const { page = 1, limit = 10, status, isApproved } = req.query;

    const query = {};
    if (status) query.status = status;
    if (isApproved !== undefined) query.isApproved = isApproved === 'true';

    const vehicles = await Vehicle.find(query)
      .populate('ownerId', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Vehicle.countDocuments(query);

    res.status(200).json({
      success: true,
      data: vehicles,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalVehicles: total
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve/Reject vehicle (Admin)
// @route   PUT /api/admin/vehicles/:id/approval
// @access  Private (Admin)
export const updateVehicleApproval = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const { id } = req.params;
    const { isApproved, rejectionReason } = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    vehicle.isApproved = isApproved;
    if (!isApproved && rejectionReason) {
      vehicle.rejectionReason = rejectionReason;
    }

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: `Vehicle ${isApproved ? 'approved' : 'rejected'} successfully`,
      data: vehicle
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'vehicle_owner') {
      const [
        totalVehicles,
        availableVehicles,
        assignedVehicles,
        totalApplications,
        pendingApplications,
        completedAssignments
      ] = await Promise.all([
        Vehicle.countDocuments({ ownerId: userId }),
        Vehicle.countDocuments({ ownerId: userId, status: 'available' }),
        Vehicle.countDocuments({ ownerId: userId, status: 'assigned' }),
        VehicleApplication.countDocuments({ vehicleOwnerId: userId }),
        VehicleApplication.countDocuments({ vehicleOwnerId: userId, status: 'pending' }),
        LoadAssignment.countDocuments({ vehicleOwnerId: userId, status: 'completed' })
      ]);

      stats = {
        totalVehicles,
        availableVehicles,
        assignedVehicles,
        totalApplications,
        pendingApplications,
        completedAssignments
      };
    } else if (userRole === 'load_provider') {
      const [
        totalLoads,
        postedLoads,
        assignedLoads,
        completedLoads,
        totalRequestsSent
      ] = await Promise.all([
        Load.countDocuments({ loadProviderId: userId }),
        Load.countDocuments({ loadProviderId: userId, status: 'posted' }),
        Load.countDocuments({ loadProviderId: userId, status: 'assigned' }),
        Load.countDocuments({ loadProviderId: userId, status: 'completed' }),
        VehicleRequest.countDocuments({ loadProviderId: userId })
      ]);

      stats = {
        totalLoads,
        postedLoads,
        assignedLoads,
        completedLoads,
        totalRequestsSent
      };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics'
    });
  }
};

// @desc    Search vehicles with filters
// @route   GET /api/vehicles/search
// @access  Private
export const searchVehicles = async (req, res) => {
  try {
    const {
      vehicleType,
      minSize,
      maxSize,
      minWeight,
      maxWeight,
      state,
      district,
      status,
      isAvailable,
      page = 1,
      limit = 10
    } = req.query;

    let query = { isApproved: true };

    if (vehicleType) query.vehicleType = vehicleType;
    if (minSize) query.vehicleSize = { ...query.vehicleSize, $gte: parseInt(minSize) };
    if (maxSize) query.vehicleSize = { ...query.vehicleSize, $lte: parseInt(maxSize) };
    if (minWeight) query.passingLimit = { ...query.passingLimit, $gte: parseInt(minWeight) };
    if (maxWeight) query.passingLimit = { ...query.passingLimit, $lte: parseInt(maxWeight) };
    if (state) query['operatingAreas.state'] = state;
    if (district) query['operatingAreas.district'] = district;
    if (status) query.status = status;
    if (isAvailable === 'true') query.status = 'available';

    const vehicles = await Vehicle.find(query)
      .populate('ownerId', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Vehicle.countDocuments(query);

    res.status(200).json({
      success: true,
      data: vehicles,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalVehicles: total
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateLoadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { loadId } = req.params;
    console.log('Update load status request:', loadId, req.body);
    // 1. Find load
    const load = await Load.findById(loadId);
    if (!load) {
      return res.status(404).json({
        success: false,
        message: 'Load not found'
      });
    }

    // 2. Authorization
    // if (req.user.role !== 've' && load.loadProviderId.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to update this load'
    //   });
    // }

    // 3. Update load status
    load.status = status;
    await load.save();

    // 4. Find related assignment
    const assignment = await LoadAssignment.findOne({ loadId: load._id });
    if (assignment) {
      assignment.status = status;

      // Set timestamps based on status
      switch (status) {
        case 'enroute':
          assignment.startedAt = new Date();
          break;
        case 'delivered':
          assignment.deliveredAt = new Date();
          break;
        case 'completed':
          assignment.completedAt = new Date();
          break;
      }

      await assignment.save();

      // 5. Update vehicle status based on load/assignment status
      let vehicleStatus = 'assigned';
      if (status === 'enroute') vehicleStatus = 'in_transit';
      if (status === 'completed') vehicleStatus = 'available';

      await Vehicle.findByIdAndUpdate(assignment.vehicleId, { status: vehicleStatus });
    }

    res.status(200).json({
      success: true,
      message: 'Load, assignment and vehicle status updated successfully',
      data: {
        load,
        assignment: assignment || null
      }
    });

  } catch (error) {
    console.error('Error updating load status:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getVehicleOwnerProfile = async (req, res) => {
  try {
    const { ownerId } = req.params;
    console.log('Getting vehicle owner profile for:', ownerId);

    // Get user profile
    const user = await User.findById(ownerId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle owner not found'
      });
    }

    // Get user statistics
    const completedJourneys = await LoadAssignment.countDocuments({
      vehicleOwnerId: ownerId,
      status: 'completed'
    });

    // Get average rating
    const ratingStats = await Rating.aggregate([
      { $match: { ratedUserId: ownerId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    const rating = ratingStats.length > 0 ? ratingStats[0].averageRating : 0;
    const totalRatings = ratingStats.length > 0 ? ratingStats[0].totalRatings : 0;

    const profile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      rating: rating,
      totalRatings: totalRatings,
      completedJourneys: completedJourneys,
      joinedDate: user.createdAt,
      isVerified: user.isVerified || false,
      documents: user.documents || {
        license: { verified: false },
        aadhar: { verified: false },
        pan: { verified: false }
      }
    };

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error getting vehicle owner profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vehicle owner profile'
    });
  }
};






