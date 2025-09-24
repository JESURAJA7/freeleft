import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  MapPinIcon,
  TruckIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MapLocationSelector } from '../../components/MapModal/MapLocationSelector';
import { RouteMapPreview } from '../../components/MapModal/RouteMapPreview';
import { loadAPI, profileAPI } from '../../services/api';
import toast from 'react-hot-toast';
import type { Material, MaterialPhoto, LocationData, Load } from '../../types/index';
import { VehicleMatchingModal } from '../../screens/Bidding/VehicleMatchingModal';
import { BiddingPage } from '../../screens/Bidding/BiddingPage';

interface MaterialWithFiles extends Omit<Material, 'photos'> {
  photos: Array<{
    type: string;
    file: File | null;
    preview: string;
  }>;
}

interface FormData {
  loadingLocation: LocationData;
  unloadingLocation: LocationData;
  vehicleRequirement: {
    vehicleType: string;
    size: number;
    trailerType: string;
  };
  materials: Material[];
  loadingDate: string;
  loadingTime: string;
  paymentTerms: string;
  withXBowSupport: boolean;
}

export const PostLoadPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [mapSelector, setMapSelector] = useState<{
    isOpen: boolean;
    type: 'loading' | 'unloading';
  }>({ isOpen: false, type: 'loading' });

  // New states for vehicle matching and bidding
  const [showVehicleMatching, setShowVehicleMatching] = useState(false);
  const [showBiddingPage, setShowBiddingPage] = useState(false);
  const [matchingVehicles, setMatchingVehicles] = useState(false);
  const [currentLoad, setCurrentLoad] = useState<Load | null>(null);

  const [formData, setFormData] = useState<FormData>({
    loadingLocation: {
      pincode: '',
      state: '',
      district: '',
      place: '',
      coordinates: { latitude: 0, longitude: 0 }
    },
    unloadingLocation: {
      pincode: '',
      state: '',
      district: '',
      place: '',
      coordinates: { latitude: 0, longitude: 0 }
    },
    vehicleRequirement: {
      vehicleType: '10-wheel',
      size: 20,
      trailerType: 'none'
    },
    materials: [],
    loadingDate: '',
    loadingTime: '',
    paymentTerms: 'advance',
    withXBowSupport: false,
  });

  const [materials, setMaterials] = useState<MaterialWithFiles[]>([
    {
      name: '',
      packType: 'single',
      totalCount: 1,
      dimensions: { length: 0, width: 0, height: 0 },
      singleWeight: 0,
      totalWeight: 0,
      photos: [
        { type: 'material_front', file: null, preview: '' },
        { type: 'material_side', file: null, preview: '' },
        { type: 'material_top', file: null, preview: '' },
        { type: 'packing_style', file: null, preview: '' }
      ]
    }
  ]);

  // Helper function to validate MongoDB ObjectId
  const isValidObjectId = (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  useEffect(() => {
    checkProfileCompletion();
  }, []);

  const checkProfileCompletion = async () => {
    try {
      const response = await profileAPI.getCompletionStatus();
      if (response.data.success) {
        setProfileComplete(response.data.data.isComplete);
        if (!response.data.data.isComplete) {
          toast.error('Please complete your profile first');
          navigate('/profile/complete');
          return;
        }
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle photo upload - store file locally like vehicle upload
  const handlePhotoUpload = (materialIndex: number, photoType: string, file: File) => {
    const updatedMaterials = [...materials];
    const photoIndex = updatedMaterials[materialIndex].photos.findIndex(p => p.type === photoType);
    
    if (photoIndex !== -1) {
      // Clean up previous preview URL
      if (updatedMaterials[materialIndex].photos[photoIndex].preview) {
        URL.revokeObjectURL(updatedMaterials[materialIndex].photos[photoIndex].preview);
      }
      
      updatedMaterials[materialIndex].photos[photoIndex] = {
        type: photoType,
        file,
        preview: URL.createObjectURL(file)
      };
    }
    
    setMaterials(updatedMaterials);
  };

  const handleRemovePhoto = (materialIndex: number, photoType: string) => {
    const updatedMaterials = [...materials];
    const photoIndex = updatedMaterials[materialIndex].photos.findIndex(p => p.type === photoType);
    
    if (photoIndex !== -1) {
      // Clean up preview URL
      if (updatedMaterials[materialIndex].photos[photoIndex].preview) {
        URL.revokeObjectURL(updatedMaterials[materialIndex].photos[photoIndex].preview);
      }
      
      updatedMaterials[materialIndex].photos[photoIndex] = {
        type: photoType,
        file: null,
        preview: ''
      };
    }
    
    setMaterials(updatedMaterials);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleLocationChange = (locationType: 'loadingLocation' | 'unloadingLocation', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [locationType]: {
        ...prev[locationType],
        [field]: value
      }
    }));
  };

  const addMaterial = () => {
    if (materials.length < 5) {
      setMaterials([...materials, {
        name: '',
        packType: 'single',
        totalCount: 1,
        dimensions: { length: 0, width: 0, height: 0 },
        singleWeight: 0,
        totalWeight: 0,
        photos: [
          { type: 'material_front', file: null, preview: '' },
          { type: 'material_side', file: null, preview: '' },
          { type: 'material_top', file: null, preview: '' },
          { type: 'packing_style', file: null, preview: '' }
        ]
      }]);
    }
  };

  const removeMaterial = (index: number) => {
    // Clean up preview URLs
    materials[index].photos.forEach(photo => {
      if (photo.preview) {
        URL.revokeObjectURL(photo.preview);
      }
    });
    
    const updatedMaterials = materials.filter((_, i) => i !== index);
    setMaterials(updatedMaterials);
  };

  const updateMaterial = (index: number, field: string, value: any) => {
    const updatedMaterials = materials.map((material, i) =>
      i === index ? {
        ...material,
        ...(field.includes('.') ? {
          [field.split('.')[0]]: {
            ...((material[field.split('.')[0] as keyof MaterialWithFiles] || {}) as object),
            [field.split('.')[1]]: value
          }
        } : { [field]: value })
      } : material
    );
    setMaterials(updatedMaterials);
  };

  const handleLocationSelect = (location: any, type: 'loading' | 'unloading') => {
    setFormData(prev => ({
      ...prev,
      [`${type}Location`]: {
        ...location,
        pincode: location.zipCode || '',
        place: location.address || ''
      }
    }));
  };

  const openMapSelector = (type: 'loading' | 'unloading') => {
    setMapSelector({ isOpen: true, type });
  };

  const closeMapSelector = () => {
    setMapSelector({ isOpen: false, type: 'loading' });
  };

  const hasValidCoordinates = (location: any) => {
    return location.coordinates.latitude !== 0 && location.coordinates.longitude !== 0;
  };

  const validateForm = (): boolean => {
    // Check if all materials have required photos
    for (let i = 0; i < materials.length; i++) {
      const material = materials[i];
      const requiredPhotoTypes = ['material_front', 'material_side', 'material_top', 'packing_style'];
      
      for (const photoType of requiredPhotoTypes) {
        const hasPhoto = material.photos.some(photo => photo.type === photoType && photo.file);
        if (!hasPhoto) {
          toast.error(`Please upload ${photoType.replace('_', ' ')} photo for material ${i + 1}`);
          return false;
        }
      }
      
      if (!material.name.trim()) {
        toast.error(`Please enter name for material ${i + 1}`);
        return false;
      }
    }

    if (!formData.loadingLocation.state || !formData.unloadingLocation.state) {
      toast.error('Please fill in all location details');
      return false;
    }

    return true;
  };

  const handleMatchVehicles = async () => {
    if (!currentLoad || !isValidObjectId(currentLoad._id)) {
      toast.error('Please save the load first to match vehicles');
      return;
    }

    setMatchingVehicles(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/vehicles/matchVehicles/${currentLoad._id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Found ${data.vehicleCount} matching vehicles!`);
        setShowBiddingPage(true);
      } else {
        throw new Error('Failed to match vehicles');
      }
    } catch (error) {
      console.error('Error matching vehicles:', error);
      toast.error('Failed to match vehicles');
    } finally {
      setMatchingVehicles(false);
    }
  };

  const handleVehicleSelect = (vehicleId: string) => {
    toast.success('Vehicle assigned successfully!');
    setShowBiddingPage(false);
    setShowVehicleMatching(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileComplete) {
      toast.error('Please complete your profile before creating loads');
      navigate('/profile');
      return;
    }

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      // Create FormData like vehicle creation
      const formDataObj = new FormData();

      // Append load details
      formDataObj.append('loadingLocation', JSON.stringify(formData.loadingLocation));
      formDataObj.append('unloadingLocation', JSON.stringify(formData.unloadingLocation));
      formDataObj.append('vehicleRequirement', JSON.stringify(formData.vehicleRequirement));
      formDataObj.append('loadingDate', formData.loadingDate);
      formDataObj.append('loadingTime', formData.loadingTime);
      formDataObj.append('paymentTerms', formData.paymentTerms);
      formDataObj.append('withXBowSupport', formData.withXBowSupport.toString());

      // Prepare materials without files for JSON
      const materialsForJSON = materials.map(material => ({
        name: material.name,
        packType: material.packType,
        totalCount: material.totalCount,
        dimensions: material.dimensions,
        singleWeight: material.singleWeight,
        totalWeight: material.totalWeight,
        photos: [] // Will be populated by backend after upload
      }));
      
      formDataObj.append('materials', JSON.stringify(materialsForJSON));

      // Append all material photos with descriptive field names
      materials.forEach((material, materialIndex) => {
        material.photos.forEach((photo) => {
          if (photo.file) {
            // Use field name that indicates material index and photo type
            formDataObj.append('images', photo.file);
            formDataObj.append('photoTypes', `${materialIndex}-${photo.type}`);
          }
        });
      });

      const response = await loadAPI.createLoad(formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Load created successfully!');
        const savedLoad: Load = response.data.data;
        setCurrentLoad(savedLoad);
        setShowVehicleMatching(true);
      }
    } catch (error: any) {
      console.error('Error creating load:', error);
      toast.error(error.response?.data?.message || 'Failed to create load');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (showBiddingPage && currentLoad) {
    return (
      <BiddingPage
        load={currentLoad}
        onBack={() => setShowBiddingPage(false)}
        onVehicleSelect={handleVehicleSelect}
      />
    );
  }

  if (!profileComplete) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center"
          >
            <DocumentTextIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Complete Your Profile First
            </h2>
            <p className="text-slate-600 mb-6">
              Before you can create loads, please complete your company profile with all required information.
            </p>
            <Button
              onClick={() => navigate('/profile')}
              className="w-full sm:w-auto"
            >
              Complete Profile
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Create New Load</h1>
          <p className="text-lg text-slate-600">Post a new load for carriers to bid on</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Locations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
          >
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-blue-100 rounded-xl">
                <MapPinIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Pickup & Delivery Locations</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Loading Location */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-slate-900">Loading Location</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openMapSelector('loading')}
                    icon={<GlobeAltIcon className="h-4 w-4" />}
                  >
                    Select on Map
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Input
                      label="Place"
                      value={formData.loadingLocation.place}
                      onChange={(value: string) => handleLocationChange('loadingLocation', 'place', value)}
                      placeholder="Connaught Place"
                      required
                    />
                  </div>
                  <Input
                    label="District"
                    value={formData.loadingLocation.district}
                    onChange={(value: string) => handleLocationChange('loadingLocation', 'district', value)}
                    placeholder="Central Delhi"
                    required
                  />
                  <Input
                    label="State"
                    value={formData.loadingLocation.state}
                    onChange={(value: string) => handleLocationChange('loadingLocation', 'state', value)}
                    placeholder="Delhi"
                    required
                  />
                  <Input
                    label="Pin Code"
                    value={formData.loadingLocation.pincode}
                    onChange={(value: string) => handleLocationChange('loadingLocation', 'pincode', value)}
                    placeholder="110001"
                    required
                  />
                </div>
              </div>

              {/* Unloading Location */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-slate-900">Unloading Location</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openMapSelector('unloading')}
                    icon={<GlobeAltIcon className="h-4 w-4" />}
                  >
                    Select on Map
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Input
                      label="Place"
                      value={formData.unloadingLocation.place}
                      onChange={(value: string) => handleLocationChange('unloadingLocation', 'place', value)}
                      placeholder="Noida Sector 62"
                      required
                    />
                  </div>
                  <Input
                    label="District"
                    value={formData.unloadingLocation.district}
                    onChange={(value: string) => handleLocationChange('unloadingLocation', 'district', value)}
                    placeholder="Gautam Buddh Nagar"
                    required
                  />
                  <Input
                    label="State"
                    value={formData.unloadingLocation.state}
                    onChange={(value: string) => handleLocationChange('unloadingLocation', 'state', value)}
                    placeholder="Uttar Pradesh"
                    required
                  />
                  <Input
                    label="Pin Code"
                    value={formData.unloadingLocation.pincode}
                    onChange={(value: string) => handleLocationChange('unloadingLocation', 'pincode', value)}
                    placeholder="201301"
                    required
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Route Preview */}
          {hasValidCoordinates(formData.loadingLocation) && hasValidCoordinates(formData.unloadingLocation) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <RouteMapPreview
                loadingLocation={formData.loadingLocation}
                unloadingLocation={formData.unloadingLocation}
              />
            </motion.div>
          )}

          {/* Vehicle Requirements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
          >
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-blue-100 rounded-xl">
                <TruckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Vehicle Requirements</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Vehicle Type *
                </label>
                <select
                  value={formData.vehicleRequirement.vehicleType}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    vehicleRequirement: { ...prev.vehicleRequirement, vehicleType: e.target.value }
                  }))}
                  className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  required
                >
                  <option value="2-wheel">2-wheel Bike</option>
                  <option value="3-wheel">3-wheel Auto</option>
                  <option value="4-wheel">4-wheel pickup/ Dost / Tata Ace</option>
                  <option value="6-wheel">6-wheel Eicher /Canter/Jcb</option>
                  <option value="trailer">trailer/Open Truck/Crane</option>
                  <option value="10-wheel">10-wheel Lorry</option>
                  <option value="12-wheel">12-wheel Lorry</option>
                  <option value="14-wheel">14-wheel Lorry</option>
                  <option value="16-wheel">16-wheel Lorry</option>
                  <option value="18-wheel">18-wheel Lorry</option>
                  <option value="20-wheel">20-wheel Lorry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Vehicle Length Size (ft) *
                </label>
                <select
                  value={formData.vehicleRequirement.size}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    vehicleRequirement: { ...prev.vehicleRequirement, size: Number(e.target.value) }
                  }))}
                  className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  required
                >
                  {[20,40,50,60,70,110].map(size => (
                    <option key={size} value={size}>{size} ft</option>
                  ))}
                </select>
              </div>
                  </div>
               <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Trailer Type
                </label>
                <select
                  value={formData.vehicleRequirement.trailerType}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    vehicleRequirement: { ...prev.vehicleRequirement, trailerType: e.target.value }
                  }))}
                  className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                >
                  <option value="none">None</option>
                  <option value="lowbed">Lowbed</option>
                  <option value="semi-lowbed">Semi-Lowbed</option>
                  <option value="high-bed">High Bed Trailer</option>
                  <option value="hydraulic-axle-8">Hydraulic Axle (8 Axle)</option>
                  <option value="flatbed">flat bed 20 feet</option>
                  <option value="crane-14t">Crane (14T)</option>
                  <option value="crane-25t">Crane (25T)</option>
                  <option value="crane-50t">Crane (50T)</option>
                  <option value="crane-100t">Crane (100T)</option>
                  <option value="crane-200t">Crane (200T)</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Materials Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Materials ({materials.length}/5)</h3>
              </div>
              {materials.length < 5 && (
                <Button
                  type="button"
                  onClick={addMaterial}
                  variant="outline"
                  size="sm"
                  icon={<PlusIcon className="h-4 w-4" />}
                >
                  Add Material
                </Button>
              )}
            </div>

            <div className="space-y-8">
              {materials.map((material, index) => (
                <div key={index} className="border-2 border-slate-200 rounded-2xl p-8 bg-gradient-to-r from-slate-50 to-blue-50">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-bold text-slate-900">Material {index + 1}</h4>
                    {materials.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeMaterial(index)}
                        variant="ghost"
                        size="sm"
                        icon={<TrashIcon className="h-4 w-4" />}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Input
                      label="Material Name"
                      value={material.name}
                      onChange={(value) => updateMaterial(index, 'name', value)}
                      placeholder="Steel Bars"
                      required
                    />
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Pack Type *
                      </label>
                      <select
                        value={material.packType}
                        onChange={(e) => updateMaterial(index, 'packType', e.target.value)}
                        className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        required
                      >
                        <option value="single">Single Pack</option>
                        <option value="multi">Multi Pack</option>
                      </select>
                    </div>
                    <Input
                      label="Total Count"
                      type="number"
                      value={material.totalCount.toString()}
                      onChange={(value) => updateMaterial(index, 'totalCount', Number(value))}
                      required
                    />
                    <Input
                      label="Approx Single Weight (kg)"
                      type="number"
                      value={material.singleWeight.toString()}
                      onChange={(value) => updateMaterial(index, 'singleWeight', Number(value))}
                      required
                    />
                    <Input
                      label="Length (ft)"
                      type="number"
                      value={material.dimensions.length.toString()}
                      onChange={(value) => updateMaterial(index, 'dimensions.length', Number(value))}
                      required
                    />
                    <Input
                      label="Width (ft)"
                      type="number"
                      value={material.dimensions.width.toString()}
                      onChange={(value) => updateMaterial(index, 'dimensions.width', Number(value))}
                      required
                    />
                    <Input
                      label="Height (ft)"
                      type="number"
                      value={material.dimensions.height.toString()}
                      onChange={(value) => updateMaterial(index, 'dimensions.height', Number(value))}
                      required
                    />
                    <Input
                      label="Total Weight (kg)"
                      type="number"
                      value={material.totalWeight.toString()}
                      onChange={(value) => updateMaterial(index, 'totalWeight', Number(value))}
                      required
                    />
                  </div>

                  {/* Photo Upload Section */}
                  <div className="bg-white rounded-xl p-6 border-2 border-slate-100">
                    <h5 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                      <PhotoIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Material Photos *
                    </h5>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        { type: 'material_front', label: 'Front View' },
                        { type: 'material_side', label: 'Side View' },
                        { type: 'material_top', label: 'Top View' },
                        { type: 'packing_style', label: 'Packing Style' }
                      ].map((photoConfig) => {
                        const photo = material.photos.find(p => p.type === photoConfig.type);

                        return (
                          <div key={photoConfig.type} className="text-center">
                            <div className="relative w-full h-40 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center mb-3 overflow-hidden group hover:border-blue-400 transition-colors duration-200">
                              {photo?.file ? (
                                <>
                                  <img
                                    src={photo.preview}
                                    alt={photoConfig.label}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhoto(index, photoConfig.type)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                  <div className="absolute bottom-2 right-2 p-1 bg-green-500 text-white rounded-full">
                                    <CheckCircleIcon className="h-4 w-4" />
                                  </div>
                                </>
                              ) : (
                                <div className="flex flex-col items-center text-slate-400">
                                  <PhotoIcon className="h-10 w-10 mb-2" />
                                  <span className="text-xs">Click to upload</span>
                                </div>
                              )}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(index, photoConfig.type, file);
                              }}
                              className="hidden"
                              id={`photo-${index}-${photoConfig.type}`}
                            />
                            <label
                              htmlFor={`photo-${index}-${photoConfig.type}`}
                              className={`block text-sm font-medium cursor-pointer transition-colors duration-200 ${
                                photo?.file
                                  ? 'text-green-600 hover:text-green-700'
                                  : 'text-blue-600 hover:text-blue-700'
                              }`}
                            >
                              {photoConfig.label}
                            </label>
                            {photo?.file && (
                              <div className="mt-1">
                                <span className="text-xs text-green-600 font-medium">✓ Selected</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                      <p className="text-sm text-blue-800">
                        <strong>Photo Requirements:</strong> Please upload clear photos of your material from all angles. 
                        This helps carriers understand the load requirements better.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Load Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
          >
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-blue-100 rounded-xl">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Load Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input
                label="Loading Date"
                type="date"
                value={formData.loadingDate}
                onChange={(value) => setFormData(prev => ({ ...prev, loadingDate: value }))}
                
                required
              />

              <Input
                label="Loading Time"
                type="time"
                value={formData.loadingTime}
                onChange={(value) => setFormData(prev => ({ ...prev, loadingTime: value }))}
                required
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Payment Terms *
                </label>
                <select
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  required
                >
                  <option value="advance">Advance payment after loading completed</option>
                  <option value="cod">COD</option>
                  <option value="after_pod">After POD</option>
                  <option value="to_pay">To Pay</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
            </div>

            <div className="mt-8">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.withXBowSupport}
                  onChange={(e) => setFormData(prev => ({ ...prev, withXBowSupport: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 border-2 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  With Xbow Logistics Pvt Ltd (5% commission applies)
                </span>
              </label>
              <p className="text-xs text-slate-500 mt-2 ml-8">
                XBow will coordinate with vehicle owners on your behalf
              </p>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center pt-4"
          >
            <Button
              type="submit"
              loading={submitting}
              size="lg"
              className="px-16 py-4 text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              {submitting ? 'Creating Load & Uploading Photos...' : 'Create Load'}
            </Button>
          </motion.div>
        </form>

        {/* Map Location Selector Modal */}
        <MapLocationSelector
          isOpen={mapSelector.isOpen}
          onClose={closeMapSelector}
          onLocationSelect={(location) => handleLocationSelect(location, mapSelector.type)}
          title={`Select ${mapSelector.type === 'loading' ? 'Loading' : 'Unloading'} Location`}
          initialLocation={
            mapSelector.type === 'loading'
              ? formData.loadingLocation
              : formData.unloadingLocation
          }
        />

        {/* Vehicle Matching Modal */}
        <VehicleMatchingModal
          isOpen={showVehicleMatching}
          onClose={() => setShowVehicleMatching(false)}
          load={currentLoad}
          onVehicleSelect={handleVehicleSelect}
        />
      </div>
    </div>
  );
};

export default PostLoadPage;