import api from './api';

export interface VehicleMatchRequest {
  loadRequirements: {
    vehicleType: string;
    size: number;
    trailerType: string;
    totalWeight: number;
    pickupLocation: {
      coordinates: {
        latitude: number;
        longitude: number;
      };
      state: string;
      district: string;
      place: string;
    };
    deliveryLocation: {
      coordinates: {
        latitude: number;
        longitude: number;
      };
      state: string;
      district: string;
      place: string;
    };
    loadingDate: string;
  };
}

export interface MatchedVehicleResponse {
  id: string;
  ownerName: string;
  vehicleType: string;
  vehicleNumber: string;
  vehicleSize: number;
  passingLimit: number;
  bidPrice: number;
  matchScore: number;
  estimatedDeliveryTime: string;
  contactInfo: {
    phone: string;
    email: string;
    whatsapp?: string;
  };
  ownerMessage?: string;
  distanceFromPickup: number;
  rating?: number;
  totalTrips?: number;
  availability: string;
  photos: Array<{
    type: string;
    url: string;
  }>;
}

export const vehicleMatchingAPI = {
  // Get matching vehicles for a load
  getMatchingVehicles: (loadId: string) =>
    api.get(`/vehicle-matching/load/${loadId}/vehicles`),

  // Apply for a load with a vehicle
  applyForLoad: (loadId: string, vehicleId: string, bidPrice?: number, message?: string) =>
    api.post(`/vehicle-matching/apply`, {
      loadId,
      vehicleId,
      bidPrice,
      message
    }),

  // Get applications for a load (for load providers)
  getLoadApplications: (loadId: string) =>
    api.get(`/vehicle-matching/load/${loadId}/applications`),

  // Accept/reject vehicle application
  respondToApplication: (applicationId: string, status: 'accepted' | 'rejected', agreedPrice?: number) =>
    api.patch(`/vehicle-matching/application/${applicationId}/respond`, {
      status,
      agreedPrice
    }),

  // Get my vehicle applications (for vehicle owners)
  getMyApplications: () =>
    api.get('/vehicle-matching/my-applications'),

  // Update load assignment status
  updateAssignmentStatus: (assignmentId: string, status: string) =>
    api.patch(`/vehicle-matching/assignment/${assignmentId}/status`, { status }),

  // Send message between load provider and vehicle owner
  sendMessage: (loadId: string, vehicleId: string, message: string) =>
    api.post('/vehicle-matching/message', {
      loadId,
      vehicleId,
      message
    }),

  // Get messages for a load/vehicle combination
  getMessages: (loadId: string, vehicleId?: string) =>
    api.get(`/vehicle-matching/messages/${loadId}${vehicleId ? `/${vehicleId}` : ''}`),

  // Submit rating and review
  submitRating: (loadId: string, vehicleId: string, rating: number, comment?: string) =>
    api.post('/v0/rating', {
      loadId,
      vehicleId,
      rating,
      comment
    }),

  // Get ratings for a user
  getUserRatings: (userId: string) =>
    api.get(`/vehicle-matching/ratings/${userId}`),

  // Select vehicle for load (for load providers)
  selectVehicle: (loadId: string, vehicleId: string, agreedPrice: number) =>
    api.post(`/vehicle-matching/select-vehicle`, {
      loadId,
      vehicleId,
      agreedPrice
    })
};