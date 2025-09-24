// Common interfaces
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates: Coordinates;
  pincode: string;
  district: string;
  place: string;
}

export interface Dimensions {
  length: number | string;
  width: number | string;
  height: number | string;
}

// Photo interfaces
export interface MaterialPhoto {
  publicId: string;
  url: string;
  _id: string;
}

export interface VehiclePhoto {
  type: string;
  file: File | null;
  preview: string;
  cloudinaryUrl?: string;
  publicId?: string;
  uploading?: boolean;
}

// Material interface
export interface Material {
  id?: string;
  name: string;
  packType: string;
  totalCount: number;
  dimensions: Dimensions;
  singleWeight: number;
  totalWeight: number;
  photos: MaterialPhoto[];
}

// Vehicle Requirement interface
export interface VehicleRequirement {
  vehicleType: string;
  size: number;
  trailerType: string;
  type?: string; // For backward compatibility
  trailer?: string; // For backward compatibility
}

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'load_provider' | 'vehicle_owner' | 'admin';
  isApproved: boolean;
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'expired';
  subscriptionEndDate?: string;
  trialDays?: number;
  companyName?: string;
  totalLoadsPosted?: number;
  totalVehicles?: number;
  preferredOperatingState?: string;
  preferredOperatingDistrict?: string;
  createdAt: string;
}

// Load interface
export interface Load {
  _id: string; 
  loadId: string; // Unique load identifier (could be same as _id)
  loadProviderId: string;
  loadProviderName: string;
  title?: string;
  description?: string;
  loadingLocation: {
    pincode: string;
    state: string;
    district: string;
    place: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    address?: string;
    city?: string;
    zipCode?: string;
  };
  unloadingLocation: {
    pincode: string;
    state: string;
    district: string;
    place: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    address?: string;
    city?: string;
    zipCode?: string;
  };
  pickupDate?: string;
  deliveryDate?: string;
  photos: MaterialPhoto[];
  weight?: string;
  dimensions?: {
    length: string;
    width: string;
    height: string;
  };
  specialRequirements?: string;
  rate?: string;
  vehicleRequirement: {
    vehicleType: string;
    size: number;
    trailerType: string;
  };
  materials?: Material[];
  loadingDate: string;
  loadingTime: string;
  paymentTerms: string;
  withXBowSupport?: boolean;
  status: string;
  assignedVehicleId?: string;
  commissionApplicable?: boolean;
  commissionAmount?: number;
  createdAt: string;
}

// Helper type to distinguish between saved and unsaved loads
export interface SavedLoad extends Load {
  _id: string; // This will be a valid MongoDB ObjectId (24-character hex string)
}

export interface UnsavedLoad extends Omit<Load, '_id'> {
  _id: 'new-load-id'; // Specific placeholder for unsaved loads
}

// Type guard to check if a load is saved (has valid ObjectId)
export const isSavedLoad = (load: Load): load is SavedLoad => {
  return /^[0-9a-fA-F]{24}$/.test(load._id);
};

// Type guard to check if a load is unsaved
export const isUnsavedLoad = (load: Load): load is UnsavedLoad => {
  return load._id === 'new-load-id';
};
// Vehicle interface
export interface Vehicle {
  _id: string;
  id: string;
  ownerId: string;
  ownerName: string;
  vehicleType: string;
  vehicleNumber: string;
  vehicleSize: number;
  vehicleWeight: number;
  passingLimit: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  preferredOperatingArea: {
    place: string;
    state: string;
    district: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  availability: string;
  rating: number;
  totalTrips: number;
  photos: Array<{
    
    type: string;
    url: string;
    publicId: string;
  }>;
  bidPrice: number;
  matchScore: number;
  estimatedDeliveryTime: string;
  distanceFromPickup?: number;
  contactInfo: {
    phone: string;
    email: string;
    whatsapp: string;
  };
  ownerMessage: string;
  status: string;
  isApproved: boolean;
  isOpen: boolean;
  trailerType: string;
  tarpaulin: boolean;
  createdAt: string;
  updatedAt: string;
}

// POD (Proof of Delivery) interface
export interface POD {
  id: string;
  loadId: string;
  vehicleId: string;
  uploadedBy: string;
  type: 'photo' | 'pdf';
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  uploadedAt: string;
}

// Dashboard statistics interface
export interface DashboardStats {
  totalLoads: number;
  totalVehicles: number;
  activeLoads?: number;
  completedLoads?: number;
  pendingApprovals: {
    users: number;
    vehicles: number;
    pods: number;
  };
  monthlyRevenue?: number;
  activeSubscriptions?: {
    loadProviders: number;
    vehicleOwners: number;
  };
  paymentsReceived?: {
    today: number;
    thisMonth: number;
    total: number;
  };
  commission?: {
    thisMonth: number;
    total: number;
  };
}

// Form Data interface (for your PostLoadPage component)
export interface FormData {
  title: string;
  description: string;
  loadingLocation: Location;
  unloadingLocation: Location;
  pickupDate: string;
  deliveryDate: string;
  weight: string;
  dimensions: Dimensions;
  specialRequirements: string;
  rate: string;
  vehicleRequirement: VehicleRequirement;
  materials: Material[];
  loadingDate: string;
  loadingTime: string;
  paymentTerms: 'advance' | 'cod' | 'after_pod' | 'to_pay' | 'credit';
  withXBowSupport: boolean;
}

//location Data interface (for location suggestions)
export interface LocationData {
  pincode: string;
  state: string;
  district: string;
  place: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface OperatingArea {
  state: string;
  district: string;
  place: string;
}

export interface VehicleFormData {
  vehicleType: string;
  vehicleSize: number;
 
  dimensions: {
    length: number;
    breadth: number;
  };
  vehicleNumber: string;
  passingLimit: number;
  availability: string;
  bodyType: string;
  tarpaulin: 'one' | 'two' | 'none';
  trailerType: 'lowbed' | 'semi-lowbed' | 'high-bed' | 'hydraulic-axle-8' | 'crane-14t' | 'crane-25t' | 'crane-50t' | 'crane-100t' | 'crane-200t' | 'none';
  operatingAreas: OperatingArea[];
}

export interface VehicleApplication {
  _id: string;
  vehicleId: string;
  loadId: string;
  vehicleOwnerId: string;
  vehicleOwnerName: string;
  vehicle: Vehicle;
  bidPrice?: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
  respondedAt?: string;
}

export interface LoadAssignment {
  _id: string;
  loadId: string;
  vehicleId: string;
  loadProviderId: string;
  vehicleOwnerId: string;
  agreedPrice?: number;
  status: 'assigned' | 'in_progress' | 'delivered' | 'completed';
  startedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rating {
  _id: string;
  fromUserId: string;
  toUserId: string;
  loadId: string;
  vehicleId?: string;
  rating: number;
  comment?: string;
  type: 'load_provider_to_vehicle_owner' | 'vehicle_owner_to_load_provider';
  createdAt: string;
}

export interface BiddingSession {
  _id: string;
  loadId: Load;
  loadProviderId: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'closed' | 'completed';
  minBidAmount?: number;
  maxBidAmount?: number;
  winningBidAmount?: number;
  winningBidId?: string;
  totalBids: number;
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  _id: string;
  biddingSessionId: string;
  loadId: string;
  vehicleId: string;
  vehicleOwnerId: string;
  vehicleOwnerName: string;
  bidAmount: number;
  message?: string;
  isWinning: boolean;
  status: 'active' | 'withdrawn' | 'selected';
  createdAt: string;
  updatedAt: string;
  vehicle?: Vehicle;
}

export interface TransportRequest {
  _id: string;
  loadId: string;
  vehicleId: string;
  loadProviderId: string;
  vehicleOwnerId: string;
  bidId: string;
  agreedPrice: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  sentAt: string;
  respondedAt?: string;
}


export interface Message {
  _id: string;
  fromUserId: string;
  toUserId: string;
  loadId: string;
  vehicleId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface VehicleRequest {
  _id: string;
  loadId: string;
  vehicleId: string;
  loadProviderId: string;
  vehicleOwnerId: string;
  loadProviderName: string;
  load: Load;
  vehicle: Vehicle;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  sentAt: string;
  respondedAt?: string;
}

export interface MatchedVehicle extends Vehicle {
  compatibilityScore: number;
  distance?: number;
  isRequested?: boolean;
  requestStatus?: 'pending' | 'accepted' | 'rejected';
}
