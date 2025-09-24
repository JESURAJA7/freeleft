import express from 'express';
import {
  createVehicle,
  getMyVehicles,
  getVehicle,
  uploadVehiclePhotos,
  updateVehicleStatus,
  getAvailableVehicles,
  getMatchingVehicles,
  applyForLoad,
  getLoadApplications,
  respondToApplication,
  getMyApplications,
  updateAssignmentStatus,
  sendMessage,
  getMessages,
  submitRating,
  getUserRatings,
  selectVehicle,
   sendVehicleRequest,
  getVehicleRequests,
  respondToVehicleRequest,
  getMatchingVehiclesForLoad,
  updateLoadStatus,
  getVehicleOwnerProfile

} from '../controllers/vehicleController.js';
import { protect, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Load from '../models/Load.js';
import upload from '../middleware/multer.js';

const router = express.Router();

router.post('/', protect, authorize('vehicle_owner'),  upload.array("images", 8),createVehicle);
router.get('/', protect, authorize('vehicle_owner'), getMyVehicles);
router.get('/available', protect, getAvailableVehicles);
router.get('/:id', protect, getVehicle);
router.post('/:id/photos', protect, authorize('vehicle_owner'), uploadVehiclePhotos);
router.put('/:id/status', protect, authorize('vehicle_owner'), updateVehicleStatus);
router.get('/owner/:ownerId/profile',protect, getVehicleOwnerProfile);

// Vehicle matching routes
router.get('/load/:loadId/vehicles', getMatchingVehicles);
router.get('/vehicle-matching/load/:loadId/vehicles',protect, getMatchingVehiclesForLoad);

router.post('/apply',protect, applyForLoad);
router.get('/load/:loadId/applications',protect, getLoadApplications);
router.patch('/application/:applicationId/respond',protect, respondToApplication);
router.get('/my-applications',protect, authorize("vehicle_owner"), getMyApplications);

// Assignment management
router.patch('/assignment/:assignmentId/status', updateAssignmentStatus);
router.post('/select-vehicle', selectVehicle);

// Vehicle request routes (for load providers to request vehicles)
router.post('/send-vehicle-request',protect, sendVehicleRequest);
router.get(`/v0/my-vehicle-requests`, protect, getVehicleRequests);
router.patch('/vehicle-request/:requestId/respond',protect, respondToVehicleRequest);
router.patch('/load/v0/:loadId/status',protect, updateLoadStatus);

// Messaging
router.post('/:loadId/message',protect, sendMessage);
router.get('/messages/:loadId/:vehicleId?', getMessages);

// Rating system
router.post('/v0/rating',protect, submitRating);
router.get('/ratings/:userId', getUserRatings);
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate match score based on various factors
 */
function calculateMatchScore(vehicle, loadRequirements) {
  let score = 0;

  // Vehicle size compatibility (30% weight)
  if (vehicle.vehicleSize >= loadRequirements.size) {
    score += 30;
  }

  // Weight capacity (25% weight)
  const weightRatio = loadRequirements.totalWeight / (vehicle.passingLimit * 1000);
  if (weightRatio <= 0.8) {
    score += 25;
  } else if (weightRatio <= 1.0) {
    score += 15;
  }

  // Vehicle type match (20% weight)
  if (vehicle.vehicleType === loadRequirements.vehicleType) {
    score += 20;
  }

  // Rating bonus (15% weight)
  if (vehicle.rating) {
    score += (vehicle.rating / 5) * 15;
  }

  // Distance factor (10% weight)
  const distance = calculateDistance(
    vehicle.currentLocation?.latitude || vehicle.preferredOperatingArea.coordinates?.latitude || 0,
    vehicle.currentLocation?.longitude || vehicle.preferredOperatingArea.coordinates?.longitude || 0,
    loadRequirements.pickupLocation.coordinates.latitude,
    loadRequirements.pickupLocation.coordinates.longitude
  );

  if (distance <= 50) {
    score += 10;
  } else if (distance <= 100) {
    score += 5;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Generate competitive bid price based on various factors
 */
function generateBidPrice(vehicle, loadRequirements, distance) {
  const baseRate = 15; // Base rate per km
  const distanceKm = calculateDistance(
    loadRequirements.pickupLocation.coordinates.latitude,
    loadRequirements.pickupLocation.coordinates.longitude,
    loadRequirements.deliveryLocation.coordinates.latitude,
    loadRequirements.deliveryLocation.coordinates.longitude
  );

  let price = baseRate * distanceKm;

  // Vehicle size factor
  price *= (vehicle.vehicleSize / 20);

  // Weight factor
  const weightFactor = (loadRequirements.totalWeight / 1000) / vehicle.passingLimit;
  price *= (1 + weightFactor * 0.3);

  // Rating premium
  if (vehicle.rating >= 4.5) {
    price *= 1.15;
  } else if (vehicle.rating >= 4.0) {
    price *= 1.1;
  }

  // Availability urgency
  if (vehicle.availability === 'immediate') {
    price *= 1.05;
  }

  // Add random variation (±10%)
  const variation = (Math.random() - 0.5) * 0.2;
  price *= (1 + variation);

  return Math.round(price);
}

/**
 * Generate personalized message from vehicle owner
 */
function generateOwnerMessage(vehicle, loadRequirements) {
  const messages = [
    `Experienced driver with ${vehicle.ownerId.totalTrips || 100}+ trips. Vehicle is well-maintained and ready for immediate dispatch.`,
    `Premium service with GPS tracking. Specialized in ${loadRequirements.vehicleType} transport with excellent safety record.`,
    `Reliable and punctual service. Our vehicle is perfect for your ${loadRequirements.totalWeight}kg load with proper securing equipment.`,
    `Professional transport service with insurance coverage. Vehicle regularly serviced and driver has clean driving record.`,
    `Quick turnaround time guaranteed. Vehicle available ${vehicle.availability} with experienced crew for safe delivery.`
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * POST /api/matchVehicles/:loadId
 */
router.post('/matchVehicles/:loadId', authorize('load_provider'), async (req, res) => {
  try {
    const { loadId } = req.params;
    const { loadRequirements } = req.body;

    const load = await Load.findById(loadId).populate('loadProviderId');
    if (!load) {
      return res.status(404).json({ success: false, message: 'Load not found' });
    }

    if (load.loadProviderId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to load' });
    }

    const matchingCriteria = {
      isApproved: true,
      status: 'available',
      vehicleSize: { $gte: loadRequirements.size },
      passingLimit: { $gte: loadRequirements.totalWeight / 1000 }
    };

    if (loadRequirements.vehicleType && loadRequirements.vehicleType !== 'any') {
      matchingCriteria.vehicleType = loadRequirements.vehicleType;
    }

    const vehicles = await Vehicle.find(matchingCriteria)
      .populate('ownerId', 'name email phone whatsapp companyName rating totalTrips')
      .lean();

    const enhancedVehicles = vehicles.map(vehicle => {
      const distance = calculateDistance(
        vehicle.preferredOperatingArea.coordinates?.latitude || 0,
        vehicle.preferredOperatingArea.coordinates?.longitude || 0,
        loadRequirements.pickupLocation.coordinates.latitude,
        loadRequirements.pickupLocation.coordinates.longitude
      );

      const matchScore = calculateMatchScore(vehicle, loadRequirements);
      const bidPrice = generateBidPrice(vehicle, loadRequirements, distance);

      const estimatedHours = Math.ceil(distance / 60);
      const estimatedDeliveryTime = estimatedHours <= 24
        ? `${estimatedHours} hours`
        : `${Math.ceil(estimatedHours / 24)} days`;

      return {
        ...vehicle,
        ownerName: vehicle.ownerId.name,
        contactInfo: {
          phone: vehicle.ownerId.phone,
          email: vehicle.ownerId.email,
          whatsapp: vehicle.ownerId.whatsapp
        },
        bidPrice,
        matchScore,
        estimatedDeliveryTime,
        distanceFromPickup: Math.round(distance),
        ownerMessage: generateOwnerMessage(vehicle, loadRequirements)
      };
    });

    enhancedVehicles.sort((a, b) => b.bidPrice - a.bidPrice);

    await Load.findByIdAndUpdate(loadId, {
      $set: {
        matchingResults: {
          totalVehicles: enhancedVehicles.length,
          lastMatched: new Date(),
          averagePrice: enhancedVehicles.reduce((sum, v) => sum + v.bidPrice, 0) / enhancedVehicles.length
        }
      }
    });

    res.json({
      success: true,
      vehicleCount: enhancedVehicles.length,
      vehicles: enhancedVehicles,
      loadInfo: {
        id: load._id,
        route: `${load.loadingLocation.place} → ${load.unloadingLocation.place}`,
        requirements: loadRequirements
      }
    });
  } catch (error) {
    console.error('Error matching vehicles:', error);
    res.status(500).json({ success: false, message: 'Failed to match vehicles', error: error.message });
  }
});

/**
 * GET /api/matchVehicles/:loadId
 */
router.get('/matchVehicles/:loadId', protect, async (req, res) => {
  try {
    const { loadId } = req.params;
    console.log('Fetching matched vehicles for loadId:', loadId);
    
    // Find the load with populated provider info
    const load = await Load.findById(loadId).populate('loadProviderId');
    if (!load) {
      return res.status(404).json({ success: false, message: 'Load not found' });
    }

    // Extract load requirements for matching
    const loadRequirements = {
      vehicleType: load.vehicleRequirement.vehicleType,
      vehicleSize: load.vehicleRequirement.size,
      trailerType: load.vehicleRequirement.trailerType,
      totalWeight: load.materials.reduce((sum, material) => sum + material.totalWeight, 0),
      pickupLocation: load.loadingLocation,
      deliveryLocation: load.unloadingLocation,
      loadingDate: load.loadingDate
    };

    console.log('Load requirements:', loadRequirements);

    // Find available vehicles that match the requirements
    const matchedVehicles = await Vehicle.find({
      status: 'available',
      isApproved: true,
      isOpen: true,
      vehicleType: loadRequirements.vehicleType,
      vehicleSize: { $gte: loadRequirements.vehicleSize }, // Vehicle size should be equal or larger
      passingLimit: { $gte: loadRequirements.totalWeight }, // Vehicle capacity should handle the weight
      trailerType: loadRequirements.trailerType === 'none' ? 'none' : { $in: ['lowbed', 'semi-lowbed'] },
      availability: { $in: ['immediate', 'today', 'tomorrow'] }
    }).populate('ownerId', 'name email phone companyName');

    console.log(`Found ${matchedVehicles.length} potential matches`);

    // Calculate match score and prepare response
    const vehiclesWithScores = matchedVehicles.map(vehicle => {
      // Calculate match score (0-100)
      let matchScore = 100;

      // Deduct points for size mismatch
      const sizeDifference = vehicle.vehicleSize - loadRequirements.vehicleSize;
      if (sizeDifference < 0) {
        matchScore -= 20; // Vehicle too small
      } else if (sizeDifference > 5) {
        matchScore -= 10; // Vehicle much larger than needed
      }

      // Deduct points for weight capacity mismatch
      const weightDifference = vehicle.passingLimit - loadRequirements.totalWeight;
      if (weightDifference < 0) {
        matchScore -= 25; // Vehicle can't handle the weight
      } else if (weightDifference > 10) {
        matchScore -= 5; // Vehicle has much more capacity than needed
      }

      // Deduct points for trailer type mismatch
      if (loadRequirements.trailerType !== 'none' && vehicle.trailerType !== loadRequirements.trailerType) {
        matchScore -= 15;
      }

      // Ensure score is within 0-100 range
      matchScore = Math.max(0, Math.min(100, matchScore));

      // Generate bid price based on distance and vehicle specs
      const baseRatePerKm = 15; // ₹15 per km
      const distance = calculateDistance(
        loadRequirements.pickupLocation.coordinates,
        loadRequirements.deliveryLocation.coordinates
      );
      
      const basePrice = distance * baseRatePerKm;
      const vehiclePremium = vehicle.vehicleSize * 50; // Larger vehicles cost more
      const trailerPremium = vehicle.trailerType !== 'none' ? 2000 : 0;
      
      const bidPrice = Math.round(basePrice + vehiclePremium + trailerPremium);

      // Calculate estimated delivery time
      const averageSpeed = 50; // km/h
      const loadingUnloadingTime = 4; // hours
      const estimatedHours = (distance / averageSpeed) + loadingUnloadingTime;
      const estimatedDeliveryTime = estimatedHours <= 24 
        ? 'Within 24 hours' 
        : `${Math.ceil(estimatedHours / 24)} days`;

      return {
        id: vehicle._id,
        ownerId: vehicle.ownerId._id,
        ownerName: vehicle.ownerId.name || vehicle.ownerId.companyName,
        vehicleType: vehicle.vehicleType,
        vehicleNumber: vehicle.vehicleNumber,
        vehicleSize: vehicle.vehicleSize,
        vehicleWeight: vehicle.vehicleWeight,
        passingLimit: vehicle.passingLimit,
        dimensions: vehicle.dimensions,
        preferredOperatingArea: vehicle.preferredOperatingArea,
        availability: vehicle.availability,
        rating: Math.random() * 2 + 3, // Random rating between 3-5 for demo
        totalTrips: Math.floor(Math.random() * 50) + 10, // Random trips for demo
        photos: vehicle.photos,
        bidPrice,
        matchScore,
        estimatedDeliveryTime,
        contactInfo: {
          phone: vehicle.ownerId.phone,
          email: vehicle.ownerId.email,
          whatsapp: vehicle.ownerId.phone // Assuming WhatsApp is same as phone
        },
        ownerMessage: getRandomOwnerMessage()
      };
    });

    // Filter vehicles with good match score (>= 70) and sort by bid price (low to high)
    const filteredVehicles = vehiclesWithScores
      .filter(vehicle => vehicle.matchScore >= 70)
      .sort((a, b) => a.bidPrice - b.bidPrice);

    console.log(`Final matched vehicles: ${filteredVehicles.length}`);

    res.json({
      success: true,
      vehicles: filteredVehicles,
      loadInfo: {
        id: load._id,
        route: `${load.loadingLocation.place} → ${load.unloadingLocation.place}`,
        totalWeight: loadRequirements.totalWeight,
        vehicleRequirements: loadRequirements
      }
    });

  } catch (error) {
    console.error('Error fetching matched vehicles:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch matched vehicles', 
      error: error.message 
    });
  }
});

// Helper function to calculate distance between two coordinates (Haversine formula)
// function calculateDistance(coord1, coord2) {
//   const R = 6371; // Earth's radius in km
//   const dLat = deg2rad(coord2.latitude - coord1.latitude);
//   const dLon = deg2rad(coord2.longitude - coord1.longitude);
  
//   const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
//             Math.cos(deg2rad(coord1.latitude)) * Math.cos(deg2rad(coord2.latitude)) *
//             Math.sin(dLon/2) * Math.sin(dLon/2);
  
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//   const distance = R * c; // Distance in km
  
//   return Math.round(distance);
// }

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// Helper function for random owner messages
function getRandomOwnerMessage() {
  const messages = [
    "I can pickup immediately and deliver on time. 10+ years experience.",
    "Available for immediate dispatch. GPS tracking available.",
    "Experienced driver with good safety record. Can handle delicate cargo.",
    "Clean vehicle with regular maintenance. Available for long distance.",
    "Refrigerated container available. Temperature control maintained.",
    "Flatbed with tie-downs. Experienced in heavy machinery transport.",
    "Can accommodate special requirements. Flexible with timing.",
    "Professional service with insurance coverage. Safe and reliable."
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
//  * POST /api/selectVehicle/:loadId
//  */
router.post('/selectVehicle/:loadId', authorize('load_provider'), async (req, res) => {
  try {
    const { loadId } = req.params;
    const { vehicleId, bidPrice } = req.body;

    const load = await Load.findByIdAndUpdate(
      loadId,
      {
        $set: {
          assignedVehicleId: vehicleId,
          status: 'assigned',
          finalPrice: bidPrice,
          assignedAt: new Date()
        }
      },
      { new: true }
    );

    if (!load) {
      return res.status(404).json({ success: false, message: 'Load not found' });
    }

    await Vehicle.findByIdAndUpdate(vehicleId, {
      $set: { status: 'assigned', currentLoadId: loadId }
    });

    res.json({ success: true, message: 'Vehicle selected successfully', load });
  } catch (error) {
    console.error('Error selecting vehicle:', error);
    res.status(500).json({ success: false, message: 'Failed to select vehicle', error: error.message });
  }
});

export default router;


