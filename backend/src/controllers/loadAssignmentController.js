import LoadAssignment from '../models/LoadAssignment.js';
import Load from '../models/Load.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// @desc    Get my assignments (for vehicle owners)
// @route   GET /api/load-assignments/my-assignments
// @access  Private (Vehicle Owner)
export const getMyAssignments = asyncHandler(async (req, res) => {
  const assignments = await LoadAssignment.find({
    vehicleOwnerId: req.user._id
  })
    .populate({
      path: 'loadId',
      select: 'loadingLocation unloadingLocation loadingDate loadingTime materials vehicleRequirement status paymentTerms withXBowSupport loadProviderName'
    })
    .populate({
      path: 'vehicleId',
      select: 'vehicleNumber vehicleType vehicleSize photos ownerName'
    })
    .populate({
      path: 'loadProviderId',
      select: 'name email phone'
    })
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, assignments, 'Assignments fetched successfully')
  );
});

// @desc    Get my load assignments (for load providers)
// @route   GET /api/load-assignments/my-load-assignments
// @access  Private (Load Provider)
export const getMyLoadAssignments = asyncHandler(async (req, res) => {
  const assignments = await LoadAssignment.find({
    loadProviderId: req.user._id
  })
    .populate({
      path: 'loadId',
      select: 'loadingLocation unloadingLocation loadingDate loadingTime materials vehicleRequirement status paymentTerms withXBowSupport'
    })
    .populate({
      path: 'vehicleId',
      select: 'vehicleNumber vehicleType vehicleSize photos ownerName'
    })
    .populate({
      path: 'vehicleOwnerId',
      select: 'name email phone'
    })
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, assignments, 'Load assignments fetched successfully')
  );
});

// @desc    Get assignment by load ID
// @route   GET /api/load-assignments/load/:loadId
// @access  Private
export const getAssignmentByLoad = asyncHandler(async (req, res) => {
  const { loadId } = req.params;

  const assignment = await LoadAssignment.findOne({ loadId })
    .populate({
      path: 'loadId',
      select: 'loadingLocation unloadingLocation loadingDate loadingTime materials vehicleRequirement status paymentTerms withXBowSupport loadProviderName'
    })
    .populate({
      path: 'vehicleId',
      select: 'vehicleNumber vehicleType vehicleSize photos ownerName'
    })
    .populate({
      path: 'loadProviderId',
      select: 'name email phone'
    })
    .populate({
      path: 'vehicleOwnerId',
      select: 'name email phone'
    });

  if (!assignment) {
    throw new ApiError(404, 'Assignment not found for this load');
  }

  // Check if user has permission to view this assignment
  const userId = req.user._id.toString();
  const canView = 
    assignment.vehicleOwnerId._id.toString() === userId ||
    assignment.loadProviderId._id.toString() === userId;

  if (!canView) {
    throw new ApiError(403, 'Not authorized to view this assignment');
  }

  res.status(200).json(
    new ApiResponse(200, assignment, 'Assignment fetched successfully')
  );
});

// @desc    Update assignment status
// @route   PUT /api/load-assignments/:assignmentId/status
// @access  Private
export const updateAssignmentStatus = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const { status, notes } = req.body;

  // Validate status
  const validStatuses = ['assigned', 'enroute', 'delivered', 'completed'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid status provided');
  }

  const assignment = await LoadAssignment.findById(assignmentId)
    .populate('loadId')
    .populate('vehicleId');

  if (!assignment) {
    throw new ApiError(404, 'Assignment not found');
  }

  // Check if user has permission to update this assignment
  const userId = req.user._id.toString();
  const canUpdate = 
    assignment.vehicleOwnerId.toString() === userId ||
    assignment.loadProviderId.toString() === userId;

  if (!canUpdate) {
    throw new ApiError(403, 'Not authorized to update this assignment');
  }

  // Update assignment status and timestamps
  assignment.status = status;
  if (notes) assignment.notes = notes;

  // Set appropriate timestamps
  const now = new Date();
  switch (status) {
    case 'enroute':
      if (!assignment.startedAt) assignment.startedAt = now;
      break;
    case 'delivered':
      if (!assignment.deliveredAt) assignment.deliveredAt = now;
      break;
    case 'completed':
      if (!assignment.completedAt) assignment.completedAt = now;
      break;
  }

  await assignment.save();

  // Update corresponding load status
  const load = await Load.findById(assignment.loadId._id);
  if (load) {
    load.status = status;
    await load.save();
  }

  // Update corresponding vehicle status
  const vehicle = await Vehicle.findById(assignment.vehicleId._id);
  if (vehicle) {
    // Map assignment status to vehicle status
    const vehicleStatusMap = {
      'assigned': 'assigned',
      'enroute': 'in_transit',
      'delivered': 'delivered', // Still on trip until completed
      'completed': 'available'
    };
    
    vehicle.status = vehicleStatusMap[status] || 'available';
    await vehicle.save();
  }

  // Populate the updated assignment for response
  const updatedAssignment = await LoadAssignment.findById(assignmentId)
    .populate({
      path: 'loadId',
      select: 'loadingLocation unloadingLocation loadingDate loadingTime materials vehicleRequirement status paymentTerms withXBowSupport loadProviderName'
    })
    .populate({
      path: 'vehicleId',
      select: 'vehicleNumber vehicleType vehicleSize photos ownerName'
    });

  res.status(200).json(
    new ApiResponse(200, updatedAssignment, `Assignment status updated to ${status}`)
  );
});

// @desc    Get assignment details with full population
// @route   GET /api/load-assignments/:assignmentId/details
// @access  Private
export const getAssignmentDetails = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;

  const assignment = await LoadAssignment.findById(assignmentId)
    .populate({
      path: 'loadId',
      populate: {
        path: 'materials',
        select: 'name dimensions totalCount totalWeight singleWeight packType photos'
      }
    })
    .populate({
      path: 'vehicleId',
      select: 'vehicleNumber vehicleType vehicleSize photos ownerName driverName driverPhone'
    })
    .populate({
      path: 'loadProviderId',
      select: 'name email phone companyName'
    })
    .populate({
      path: 'vehicleOwnerId',
      select: 'name email phone companyName'
    });

  if (!assignment) {
    throw new ApiError(404, 'Assignment not found');
  }

  // Check if user has permission to view this assignment
  const userId = req.user._id.toString();
  const canView = 
    assignment.vehicleOwnerId._id.toString() === userId ||
    assignment.loadProviderId._id.toString() === userId;

  if (!canView) {
    throw new ApiError(403, 'Not authorized to view this assignment');
  }

  res.status(200).json(
    new ApiResponse(200, assignment, 'Assignment details fetched successfully')
  );
});

// @desc    Update assignment notes
// @route   PUT /api/load-assignments/:assignmentId/notes
// @access  Private
export const updateAssignmentNotes = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const { notes } = req.body;

  const assignment = await LoadAssignment.findById(assignmentId);

  if (!assignment) {
    throw new ApiError(404, 'Assignment not found');
  }

  // Check if user has permission to update this assignment
  const userId = req.user._id.toString();
  const canUpdate = 
    assignment.vehicleOwnerId.toString() === userId ||
    assignment.loadProviderId.toString() === userId;

  if (!canUpdate) {
    throw new ApiError(403, 'Not authorized to update this assignment');
  }

  assignment.notes = notes;
  await assignment.save();

  res.status(200).json(
    new ApiResponse(200, assignment, 'Assignment notes updated successfully')
  );
});

// @desc    Complete assignment
// @route   PUT /api/load-assignments/:assignmentId/complete
// @access  Private
export const completeAssignment = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;

  const assignment = await LoadAssignment.findById(assignmentId)
    .populate('loadId')
    .populate('vehicleId');

  if (!assignment) {
    throw new ApiError(404, 'Assignment not found');
  }

  // Check if user has permission to complete this assignment
  const userId = req.user._id.toString();
  const canComplete = 
    assignment.vehicleOwnerId.toString() === userId ||
    assignment.loadProviderId.toString() === userId;

  if (!canComplete) {
    throw new ApiError(403, 'Not authorized to complete this assignment');
  }

  // Check if assignment can be completed (must be delivered first)
  if (assignment.status !== 'delivered') {
    throw new ApiError(400, 'Assignment must be delivered before it can be completed');
  }

  // Update assignment
  assignment.status = 'completed';
  assignment.completedAt = new Date();
  await assignment.save();

  // Update load status
  const load = await Load.findById(assignment.loadId._id);
  if (load) {
    load.status = 'completed';
    await load.save();
  }

  // Update vehicle status to available
  const vehicle = await Vehicle.findById(assignment.vehicleId._id);
  if (vehicle) {
    vehicle.status = 'available';
    await vehicle.save();
  }

  res.status(200).json(
    new ApiResponse(200, assignment, 'Assignment completed successfully')
  );
});

// @desc    Create new load assignment
// @route   POST /api/load-assignments
// @access  Private (Load Provider)
export const createLoadAssignment = asyncHandler(async (req, res) => {
  const {
    loadId,
    vehicleId,
    vehicleOwnerId,
    agreedPrice,
    applicationId
  } = req.body;

  // Validate required fields
  if (!loadId || !vehicleId || !vehicleOwnerId || !agreedPrice) {
    throw new ApiError(400, 'Missing required fields');
  }

  // Check if assignment already exists for this load
  const existingAssignment = await LoadAssignment.findOne({ loadId });
  if (existingAssignment) {
    throw new ApiError(400, 'Assignment already exists for this load');
  }

  // Verify load exists and belongs to the user
  const load = await Load.findById(loadId);
  if (!load) {
    throw new ApiError(404, 'Load not found');
  }

  if (load.loadProviderId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to assign this load');
  }

  // Verify vehicle exists
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }

  // Create assignment
  const assignment = await LoadAssignment.create({
    loadId,
    vehicleId,
    loadProviderId: req.user._id,
    vehicleOwnerId,
    applicationId,
    agreedPrice,
    status: 'assigned'
  });

  // Update load status
  load.status = 'assigned';
  load.assignedVehicleId = vehicleId;
  await load.save();

  // Update vehicle status
  vehicle.status = 'assigned';
  await vehicle.save();

  // Populate the created assignment
  const populatedAssignment = await LoadAssignment.findById(assignment._id)
    .populate({
      path: 'loadId',
      select: 'loadingLocation unloadingLocation loadingDate loadingTime materials vehicleRequirement'
    })
    .populate({
      path: 'vehicleId',
      select: 'vehicleNumber vehicleType vehicleSize photos ownerName'
    })
    .populate({
      path: 'vehicleOwnerId',
      select: 'name email phone'
    });

  res.status(201).json(
    new ApiResponse(201, populatedAssignment, 'Load assignment created successfully')
  );
});

// @desc    Get assignment statistics
// @route   GET /api/load-assignments/stats
// @access  Private
export const getAssignmentStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  let matchCondition = {};
  
  if (userRole === 'vehicle_owner') {
    matchCondition = { vehicleOwnerId: userId };
  } else if (userRole === 'load_provider') {
    matchCondition = { loadProviderId: userId };
  }

  const stats = await LoadAssignment.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$agreedPrice' }
      }
    }
  ]);

  const totalAssignments = await LoadAssignment.countDocuments(matchCondition);
  const completedAssignments = await LoadAssignment.countDocuments({
    ...matchCondition,
    status: 'completed'
  });

  const completionRate = totalAssignments > 0 ? 
    ((completedAssignments / totalAssignments) * 100).toFixed(2) : 0;

  res.status(200).json(
    new ApiResponse(200, {
      statusBreakdown: stats,
      totalAssignments,
      completedAssignments,
      completionRate: parseFloat(completionRate)
    }, 'Assignment statistics fetched successfully')
  );
});