import api from './api';

export interface LoadApplication {
  id: string;
  loadId: string;
  vehicleId: string;
  vehicleOwnerId: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
  message?: string;
}

export interface LoadStatusUpdate {
  loadId: string;
  status: string;
  message?: string;
  timestamp: string;
}

export const loadApplicationAPI = {
  // Apply for a load with selected vehicle
  applyForLoad: (loadId: string, vehicleId: string, message?: string) =>
    api.post('/load-applications', { loadId, vehicleId, message }),

  // Get applications for a specific load (for load providers)
  getLoadApplications: (loadId: string) =>
    api.get(`/load-applications/load/${loadId}`),

  // Get my applications (for vehicle owners)
  getMyApplications: () =>
    api.get('/load-applications/my-applications'),

  // Accept/reject an application (for load providers)
  updateApplicationStatus: (applicationId: string, status: 'accepted' | 'rejected', message?: string) =>
    api.put(`/load-applications/${applicationId}`, { status, message }),

  // Update load status
  updateLoadStatus: (loadId: string, status: string, message?: string) =>
    api.put(`/loads/${loadId}/status`, { status, message }),

  // Send message to load provider
  sendMessage: (loadId: string, message: string) =>
    api.post(`/loads/${loadId}/messages`, { message }),

  // Get messages for a load
  getLoadMessages: (loadId: string) =>
    api.get(`/loads/${loadId}/messages`),

  // Get load status history
  getLoadStatusHistory: (loadId: string) =>
    api.get(`/loads/${loadId}/status-history`)
};