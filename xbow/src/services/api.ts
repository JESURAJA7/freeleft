import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { BiddingSession } from '../types/index';


const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('xbow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('xbow_token');
      Cookies.remove('xbow_user');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.message || 'Something went wrong';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData: any) => api.post(`${API_BASE_URL}/auth/register`, userData),
  login: (credentials: any) => api.post(`${API_BASE_URL}/auth/login`, credentials),
  getProfile: () => api.get('/auth/me'),
};

export const loadAPI = {
 createLoad: (data: FormData, config?: any) => 
    api.post(`${API_BASE_URL}/loads`, data, config),
  getMyLoads: () => api.get(`${API_BASE_URL}/loads`),
  getAvailableLoads: (params?: any) => api.get('/loads/available', { params }),
  getLoad: (id: string) => api.get(`${API_BASE_URL}/loads/${id}`),
  uploadMaterialPhotos: (loadId: string, materialIndex: number, formData: FormData) =>
  api.post(
    `${API_BASE_URL}/loads/materials/${materialIndex}/photos`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  ),
  updateLoadStatus: (loadId: string, status: string) =>
    api.put(`/loads/${loadId}/status`, { status }),
  deleteLoad: (loadId: string) => api.delete(`/loads/${loadId}`),
   // Apply for a load with selected vehicle
  applyForLoad: (loadId: string, vehicleId: string, message?: string) =>
    api.post('/load-applications', { loadId, vehicleId, message }),

  // Get applications for a specific load (for load providers)
  getLoadApplications: (loadId: string) =>
    api.get(`${API_BASE_URL}/vehicles/load/${loadId}/applications`),

  // Get my applications (for vehicle owners)
  getMyApplications: () =>
    api.get(`${API_BASE_URL}/vehicles/my-applications`),

  // Accept/reject an application (for load providers)
  updateApplicationStatus: (applicationId: string, status: 'accepted' | 'rejected', message?: string) =>
    api.put(`/load-applications/${applicationId}`, { status, message }),


  // Send message to load provider
  sendMessage: (loadId: string, message: string) =>
    api.post(`${API_BASE_URL}/vehicles/${loadId}/messages`, { message }),

  // Get messages for a load
  getLoadMessages: (loadId: string) =>
    api.get(`/loads/${loadId}/messages`),

  // Get load status history
  getLoadStatusHistory: (loadId: string) =>
    api.get(`/loads/${loadId}/status-history`)
};

export const vehicleAPI = {
 createVehicle: (data: any, config = {}) =>
    api.post(`${API_BASE_URL}/vehicles`, data, config),
 getVehicleOwnerProfile: (ownerId: any) => {
    // Extract the actual ID from the object
    let actualId: string;
    
    if (typeof ownerId === 'string') {
      actualId = ownerId;
    } else if (typeof ownerId === 'object' && ownerId !== null) {
      actualId = ownerId._id || ownerId.id || ownerId.vehicleOwnerId;
    } else {
      console.error('Invalid ownerId:', ownerId);
      return Promise.reject(new Error('Invalid owner ID'));
    }
    
    return api.get(`${API_BASE_URL}/vehicles/owner/${actualId}/profile`);
  },
  getMyVehicles: () => api.get(`${API_BASE_URL}/vehicles`),
  getAvailableVehicles: (params?: any) => api.get(`${API_BASE_URL}/vehicles/available`, { params }),
 getVehicle: (vehicleId: any) => {
    // Extract the actual ID from the object
    let actualId: string;
    
    if (typeof vehicleId === 'string') {
      actualId = vehicleId;
    } else if (typeof vehicleId === 'object' && vehicleId !== null) {
      actualId = vehicleId._id || vehicleId.id || vehicleId.vehicleId;
    } else {
      console.error('Invalid vehicleId:', vehicleId);
      return Promise.reject(new Error('Invalid vehicle ID'));
    }
    
    return api.get(`${API_BASE_URL}/vehicles/${actualId}`);
  },
  uploadVehiclePhotos: (vehicleId: string, photos: any[]) =>
    api.post(`/vehicles/${vehicleId}/photos`, { photos }),
  updateVehicleStatus: (vehicleId: string, status: string) =>
    api.put(`${API_BASE_URL}/vehicles/${vehicleId}/status`, { status }),
};

export const paymentAPI = {
  createOrder: (orderData: any) => api.post('/payments/create-order', orderData),
  verifyPayment: (paymentData: any) => api.post('/payments/verify', paymentData),
  getPaymentHistory: () => api.get('/payments/history'),
};

export const podAPI = {
  uploadPOD: (podData: any) => api.post('/pods', podData),
  getMyPODs: () => api.get('/pods/my-pods'),
  getPODsByLoad: (loadId: string) => api.get(`/pods/load/${loadId}`),
};


export const profileAPI = {
  // Get profile
  getProfile: () => api.get('/profile/profile'),

  // Update profile
  updateProfile: (profileData: any) => api.put('/profile/profile', profileData),

  // Upload image
  uploadImage: (imageData: FormData) =>
    api.post('/profile/upload-image', imageData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Delete image
  deleteImage: () => api.delete('/profile/delete-image'),

  // Upload documents (⚠️ not present in backend yet)
  uploadDocuments: (documents: any[]) =>
    api.post('/profile/documents', { documents }),

  // Get profile completion status (user-level)
  getCompletionStatus: () => api.get('/profile/completion-status'),

  // Get completion stats (admin-level)
  getCompletionStats: () => api.get('/profile/completion-stats'),
};

export const subscriptionAPI = {
  getSubscriptionDetails: () => api.get('/subscription'),
  createSubscriptionOrder: () => api.post('/subscription/create-order'),
  verifySubscriptionPayment: (paymentData: any) => api.post('/subscription/verify', paymentData),
};

export const vehicleMatchingAPI = {
  // Get matching vehicles for a load
  getMatchingVehicles: (loadId: string) =>
    api.get(`${API_BASE_URL}/vehicles/vehicle-matching/load/${loadId}/vehicles`),

  // Apply for a load with a vehicle
  applyForLoad: (loadId: string, vehicleId: string, bidPrice?: number, message?: string) =>
    api.post(`${API_BASE_URL}/vehicles/apply`, {
      loadId,
      vehicleId,
      bidPrice,
      message
    }),

  // Get applications for a load (for load providers)
  getLoadApplications: (loadId: string) =>
    api.get(`${API_BASE_URL}/vehicles/load/${loadId}/applications`),

  // Accept/reject vehicle application
  respondToApplication: (applicationId: string, status: 'accepted' | 'rejected', agreedPrice?: number) =>
    api.patch(`${API_BASE_URL}/vehicles/application/${applicationId}/respond`, {
      status,
      agreedPrice
    }),

  // Get my vehicle applications (for vehicle owners)
  getMyApplications: () =>
    api.get(`${API_BASE_URL}/vehicles/vehicle-matching/my-applications`),

  // Update load assignment status
  updateAssignmentStatus: (assignmentId: string, status: string) =>
    api.patch(`${API_BASE_URL}/vehicles/vehicle-matching/assignment/${assignmentId}/status`, { status }),

  // Send message between load provider and vehicle owner
  sendMessage: (loadId: string, vehicleId: string, message: string) =>
    api.post(`${API_BASE_URL}/vehicles/vehicle-matching/message`, {
      loadId,
      vehicleId,
      message
    }),

  // Get messages for a load/vehicle combination
  getMessages: (loadId: string, vehicleId?: string) =>
    api.get(`${API_BASE_URL}/vehicles/vehicle-matching/messages/${loadId}${vehicleId ? `/${vehicleId}` : ''}`),

  // Submit rating and review
  submitRating: (loadId: string, vehicleId: string, rating: number, comment?: string) =>
    api.post(`${API_BASE_URL}/vehicles/v0/rating`, {
      loadId,
      vehicleId,
      rating,
      comment
    }),

  // Get ratings for a user
  getUserRatings: (userId: string) =>
    api.get(`${API_BASE_URL}/vehicles/vehicle-matching/ratings/${userId}`),

  // Select vehicle for load (for load providers)
  selectVehicle: (loadId: string, vehicleId: string, agreedPrice: number) =>
    api.post(`${API_BASE_URL}/vehicles/vehicle-matching/select-vehicle`, {
      loadId,
      vehicleId,
      agreedPrice
    }),

     getMatchingVehiclesForLoad: (loadId: string) =>
    api.get(`${API_BASE_URL}/vehicles/vehicle-matching/load/${loadId}/matching-vehicles`),

  // Send vehicle request to vehicle owner
  sendVehicleRequest: (loadId: string, vehicleId: string, message?: string) =>
    api.post(`${API_BASE_URL}/vehicles/send-vehicle-request`, {
      loadId,
      vehicleId,
      message
    }),

  // Get vehicle requests for vehicle owner
  getVehicleRequests: () =>
    api.get(`${API_BASE_URL}/vehicles/v0/my-vehicle-requests`),

  // Respond to vehicle request
  respondToVehicleRequest: (requestId: string, status: 'accepted' | 'rejected') =>
    api.patch(`${API_BASE_URL}/vehicles/vehicle-request/${requestId}/respond`, { status }),

   updateLoadStatus: (loadId: string, status: string) =>
    api.patch(`${API_BASE_URL}/vehicles/load/v0/${loadId}/status`, { status })


};

export const vehicleRequestAPI = {
  // Get vehicle requests for vehicle owner
  getVehicleRequests: () => {
    return api.get('/vehicles/requests');
  },

  // Respond to vehicle request
  respondToVehicleRequest: (requestId: string, status: 'accepted' | 'rejected') => {
    return api.put(`/vehicles/requests/${requestId}/respond`, { status });
  },

  // Get my assignments (for vehicle owners)
  getMyAssignments: () => {
    return api.get('/vehicles/assignments');
  },

  // Update assignment status
  updateAssignmentStatus: (assignmentId: string, status: string) => {
    return api.put(`/vehicles/assignments/${assignmentId}/status`, { status });
  },

  // Send message in assignment
  sendAssignmentMessage: (assignmentId: string, message: string) => {
    return api.post(`/vehicles/assignments/${assignmentId}/message`, { message });
  }
};

export const biddingAPI = {
  // Bidding Session Management
  createBiddingSession: (loadId: string, startTime: string, endTime: string, minBidAmount?: number, maxBidAmount?: number) =>
    api.post(`${API_BASE_URL}/bidding/sessions`, {
      loadId,
      startTime,
      endTime,
      minBidAmount,
      maxBidAmount
    }),

  getBiddingSession: (sessionId: string) =>
    api.get(`${API_BASE_URL}/bidding/sessions/${sessionId}`),

  getBiddingSessionWithDetails: (sessionId: string) =>
    api.get(`${API_BASE_URL}/bidding/sessions/${sessionId}/details`),

  getBiddingSessionByLoad: (loadId: string) =>
    api.get(`${API_BASE_URL}/bidding/sessions/load/${loadId}`),

  updateBiddingSession: (sessionId: string, data: Partial<BiddingSession>) =>
    api.patch(`${API_BASE_URL}/bidding/sessions/${sessionId}`, data),

  closeBiddingSession: (sessionId: string) =>
    api.patch(`${API_BASE_URL}/bidding/sessions/${sessionId}/close`),

  // Bid Management
  placeBid: (sessionId: string, vehicleId: string, bidAmount: number, message?: string) =>
    api.post(`${API_BASE_URL}/bidding/bids`, {
      biddingSessionId: sessionId,
      vehicleId,
      bidAmount,
      message
    }),

  updateBid: (bidId: string, bidAmount: number, message?: string) =>
    api.patch(`${API_BASE_URL}/bidding/bids/${bidId}`, {
      bidAmount,
      message
    }),

  withdrawBid: (bidId: string) =>
    api.patch(`${API_BASE_URL}/bidding/bids/${bidId}/withdraw`),

  getBidsForSession: (sessionId: string) =>
    api.get(`${API_BASE_URL}/bidding/sessions/${sessionId}/bids`),

  getMyBids: () =>
    api.get(`${API_BASE_URL}/bidding/my-bids`),

  selectWinningBid: (sessionId: string, bidId: string) =>
    api.patch(`${API_BASE_URL}/bidding/sessions/${sessionId}/select-bid`, { bidId }),

  // Accept bid and assign vehicle owner
  acceptBidAndAssign: (bidId: string, message?: string) =>
    api.post(`${API_BASE_URL}/bidding/bids/${bidId}/accept`, { message }),

  // Start journey
  startJourney: (loadId: string, vehicleId: string) =>
    api.post(`${API_BASE_URL}/bidding/loads/${loadId}/start-journey`, { vehicleId }),

  // Transport Request Management
  sendTransportRequest: (bidId: string, message?: string) =>
    api.post(`${API_BASE_URL}/bidding/transport-requests`, {
      bidId,
      message
    }),

  getTransportRequests: () =>
    api.get(`${API_BASE_URL}/bidding/transport-requests`),

  respondToTransportRequest: (requestId: string, status: 'accepted' | 'rejected') =>
    api.patch(`${API_BASE_URL}/bidding/transport-requests/${requestId}/respond`, { status }),

  // Active Bidding Sessions
  getActiveBiddingSessions: () =>
    api.get(`${API_BASE_URL}/bidding/sessions/active`),

  // Vehicle Owner Profile
  getVehicleOwnerProfile: (ownerId: string) =>
    api.get(`${API_BASE_URL}/bidding/vehicle-owners/${ownerId}/profile`),

  // Statistics
  getBiddingStats: () =>
    api.get(`${API_BASE_URL }/bidding/stats`)
};

// NEW: Load Assignment API for working with the LoadAssignment model
export const loadAssignmentAPI = {
  // Get my load assignments (for vehicle owners)
  getMyAssignments: () =>
    api.get(`${API_BASE_URL}/load-assignments/my-assignments`),

  // Get assignments for my loads (for load providers)
  getMyLoadAssignments: () =>
    api.get(`${API_BASE_URL}/load-assignments/my-load-assignments`),

  // Get specific assignment by load ID
  getAssignmentByLoad: (loadId: string) =>
    api.get(`${API_BASE_URL}/load-assignments/load/${loadId}`),

  // Update assignment status (updates both load and vehicle status)
  updateAssignmentStatus: (assignmentId: string, status: string, notes?: string) =>
    api.put(`${API_BASE_URL}/load-assignments/${assignmentId}/status`, { status, notes }),

  // Get assignment details with populated load and vehicle info
  getAssignmentDetails: (assignmentId: string) =>
    api.get(`${API_BASE_URL}/load-assignments/${assignmentId}/details`),

  // Update assignment notes
  updateAssignmentNotes: (assignmentId: string, notes: string) =>
    api.put(`${API_BASE_URL}/load-assignments/${assignmentId}/notes`, { notes }),

  // Complete assignment
  completeAssignment: (assignmentId: string) =>
    api.put(`${API_BASE_URL}/load-assignments/${assignmentId}/complete`)
};

export default api;