import { useState, useEffect } from 'react';
import type{ DashboardStats, User, Load, Vehicle, POD } from '../types/index';

// Mock data - replace with actual API calls
const mockStats: DashboardStats = {
  totalLoads: 1247,
  totalVehicles: 892,
  activeSubscriptions: {
    loadProviders: 156,
    vehicleOwners: 234
  },
  paymentsReceived: {
    today: 45000,
    thisMonth: 890000,
    total: 12450000
  },
  pendingApprovals: {
    users: 23,
    vehicles: 15,
    pods: 8
  },
  commission: {
    thisMonth: 125000,
    total: 2340000
  },
  monthlyRevenue: 500000
};

const mockUsers: User[] = [
  {
    id: '1',
    email: 'provider1@example.com',
    phone: '9876543210',
    name: 'ABC Logistics',
    role: 'load_provider',
    subscriptionStatus: 'active',
    subscriptionEndDate: '2025-02-28',
    createdAt: '2024-12-15',
    isApproved: true
  },
  {
    id: '2',
    email: 'owner1@example.com',
    phone: '9876543211',
    name: 'XYZ Transport',
    role: 'vehicle_owner',
    subscriptionStatus: 'trial',
    trialDays: 5,
    createdAt: '2024-12-20',
    isApproved: false
  }
];

const mockLoads: Load[] = [
  {
    id: '1',
    loadProviderId: '1',
    loadProviderName: 'ABC Logistics',
    loadingLocation: {
      pincode: '560001',
      state: 'Karnataka',
      district: 'Bangalore Urban',
      place: 'Bangalore',
       coordinates: { latitude: 0, longitude: 0 },
    },
    unloadingLocation: {
      pincode: '400001',
      state: 'Maharashtra',
      district: 'Mumbai',
      place: 'Mumbai',
      coordinates: { latitude: 0, longitude: 0 }
    },
    vehicleRequirement: {
      size: 14,
      vehicleType: '10-wheel',
      trailerType: 'Semi-Lowbed'
    },
    materials: [
      {
        id: '1',
        name: 'Steel Pipes',
        dimensions: { length: 20, width: 2, height: 2 },
        packType: 'multi',
        totalCount: 50,
        singleWeight: 25,
        totalWeight: 1250,
        photos: []
      }
    ],
    loadingDate: '2025-01-10',
    loadingTime: '10:00',
    paymentTerms: 'COD',
    status: 'posted',
    createdAt: '2024-12-28',
    commissionApplicable: true,
    commissionAmount: 2500
  }
];

const mockVehicles: Vehicle[] = [
  {
  id: '1',
  ownerId: '2',
  ownerName: 'XYZ Transport',
  vehicleType: '14 ft',
  vehicleNumber: 'KA01AB1234',
  passingLimit: 15,
  vehicleSize: 14, // ✅ added
  vehicleWeight: 8000, // ✅ added (in kg for example)
  availability: 'today',
  isOpen: false,
  tarpaulin: 'two',
  preferredOperatingArea: {
    state: 'Karnataka',
    district: 'Bangalore Urban',
    place: 'Bangalore'
  },
  dimensions: {
    length: 14, // ✅ added
    breadth: 6  // ✅ added
  },
  trailerType: 'Flatbed', // ✅ added
  photos: [], // ✅ still valid
  status: 'available',
  rating: 4.5, // optional
  totalTrips: 120, // optional
  bidPrice: 1500, // optional (example: INR)
  publicId: 'veh_123abc', // optional (e.g. Cloudinary or DB ID)
  isApproved: false,
  createdAt: '2024-12-20',
  updatedAt: '2025-08-20' // optional
  }
];

export const useApi = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getDashboardStats = async (): Promise<DashboardStats> => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    return mockStats;
  };

  const getUsers = async (role?: string): Promise<User[]> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsLoading(false);
    return role ? mockUsers.filter(user => user.role === role) : mockUsers;
  };

  const getLoads = async (): Promise<Load[]> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsLoading(false);
    return mockLoads;
  };

  const getVehicles = async (): Promise<Vehicle[]> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsLoading(false);
    return mockVehicles;
  };

  const approveUser = async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    return true;
  };

  const rejectUser = async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    return true;
  };

  const approveVehicle = async (vehicleId: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    return true;
  };

  const rejectVehicle = async (vehicleId: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    return true;
  };

  return {
    isLoading,
    getDashboardStats,
    getUsers,
    getLoads,
    getVehicles,
    approveUser,
    rejectUser,
    approveVehicle,
    rejectVehicle
  };
};