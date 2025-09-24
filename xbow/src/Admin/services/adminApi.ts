import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL;
console.log("API_BASE_URL:", API_BASE_URL);

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
adminApi.interceptors.request.use(
  (config) => {
    const token = Cookies.get('xbow_admin_token');
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
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('xbow_admin_token');
      Cookies.remove('xbow_admin_user');
      window.location.href = '/admin/login';
    }
    
    const message = error.response?.data?.message || 'Something went wrong';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

export const adminAPI = {
  // Auth
  login: (credentials: any) => adminApi.post(`${API_BASE_URL}/admin/login`, credentials),
  register: (adminData: any) => adminApi.post(`${API_BASE_URL}/admin/register`, adminData),
  
  // Profile Management
  getProfile: () => adminApi.get(`${API_BASE_URL}/admin/profile`),
  updateProfile: (data: any) => adminApi.put(`${API_BASE_URL}/admin/profile`, data),
  changePassword: (data: any) => adminApi.put(`${API_BASE_URL}/admin/change-password`, data),
  
  // Dashboard
  getDashboardStats: () => adminApi.get(`${API_BASE_URL}/admin/dashboard`),

  // User Management
  getUsers: (params?: any) => adminApi.get(`${API_BASE_URL}/admin/users`, { params }),
  approveUser: (userId: string, data: any) => adminApi.put(`${API_BASE_URL}/admin/users/${userId}/approve`, data),
  rejectUser: (userId: string, data: any) => adminApi.put(`${API_BASE_URL}/admin/users/${userId}/reject`, data),
  toggleUserAccess: (userId: string) => adminApi.put(`${API_BASE_URL}/admin/users/${userId}/toggle-access`),

  // Load Management
  getLoads: (params?: any) => adminApi.get(`${API_BASE_URL}/admin/loads`, { params }),
  matchLoadWithVehicle: (data: any) => adminApi.post(`${API_BASE_URL}/admin/match-loads`, data),

  // Vehicle Management
  getVehicles: (params?: any) => adminApi.get(`${API_BASE_URL}/admin/vehicles`, { params }),
  approveVehicle: (vehicleId: string) => adminApi.put(`${API_BASE_URL}/admin/vehicles/${vehicleId}/approve`),
  rejectVehicle: (vehicleId: string, data: any) => adminApi.put(`${API_BASE_URL}/admin/vehicles/${vehicleId}/reject`, data),

  // POD Management
  getPODs: (params?: any) => adminApi.get(`${API_BASE_URL}/admin/pods`, { params }),
  approvePOD: (podId: string, data: any) => adminApi.put(`${API_BASE_URL}/admin/pods/${podId}/approve`, data),
  rejectPOD: (podId: string, data: any) => adminApi.put(`${API_BASE_URL}/admin/pods/${podId}/reject`, data),

  // Payment Management
  getPayments: (params?: any) => adminApi.get(`${API_BASE_URL}/admin/payments`, { params }),

  // Commission Management
  getCommissionReports: (params?: any) => adminApi.get(`${API_BASE_URL}/admin/commission`, { params }),

  // Settings
  getAdminSettings: () => adminApi.get(`${API_BASE_URL}/admin/settings`),
  updateAdminSettings: (data: any) => adminApi.put(`${API_BASE_URL}/admin/settings`, data),

  // Reports
  generateReport: (type: string, params?: any) =>
    adminApi.get(`${API_BASE_URL}/admin/reports/${type}`, { params }),
};

export default adminApi;