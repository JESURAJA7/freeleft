import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  FileText,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PhotoUploadGrid } from '../../components/vehicles/PhotoUploadGrid';
import { OperatingAreaForm } from '../../components/vehicles/OperatingAreaForm';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { vehicleAPI, profileAPI } from '../../services/api';
import { VehiclePhoto, VehicleFormData, OperatingArea } from '../../types/index';
import toast from 'react-hot-toast';

export const AddVehiclePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { uploadMultiple, uploading: cloudinaryUploading, progress } = useCloudinaryUpload();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);

  const [formData, setFormData] = useState<VehicleFormData>({
    vehicleType: '10-wheel',
    vehicleSize: 20,
    dimensions: {
      length: 14,
      breadth: 6
    },
    vehicleNumber: '',
    passingLimit: 10,
    availability: '',
    bodyType: 'open',
    tarpaulin: 'one',
    trailerType: 'none',
    operatingAreas: [{ state: '', district: '', place: '' }]
  });

  const [photos, setPhotos] = useState<VehiclePhoto[]>([
    { type: 'front', file: null, preview: '' },
    { type: 'side', file: null, preview: '' },
    { type: 'back', file: null, preview: '' },
    { type: 'rc_book', file: null, preview: '' },
    { type: 'pancard', file: null, preview: '' },
    { type: 'optional', file: null, preview: '' }
  ]);

  // Helper function to get available vehicle sizes based on vehicle type
  const getAvailableVehicleSizes = (vehicleType: string): number[] => {
    switch (vehicleType) {
      case '4-wheel':
        return [6, 8.5, 10];
      case '6-wheel':
        return [14, 17, 19, 20, 22, 24, 26, 32];
      case '10-wheel':
        return [20, 22];
      case '12-wheel':
        return [22, 24, 26];
      case '14-wheel':
        return [24, 26];
      case '16-wheel':
        return [24, 26];
      case '18-wheel':
        return [24, 26];
      case '20-wheel':
        return [32];
      case 'trailer':
        return [20, 22, 24, 26, 32, 40, 50, 60, 70, 110];
      default:
        return []; // For 2-wheel and 3-wheel, no sizes available
    }
  };

  // Helper function to check if field should be disabled
  const isFieldDisabled = (field: string): boolean => {
    const { vehicleType } = formData;
    
    switch (field) {
      case 'vehicleSize':
        return vehicleType === '2-wheel' || vehicleType === '3-wheel';
      case 'dimensions':
        return vehicleType === '2-wheel' || vehicleType === '3-wheel';
      case 'bodyType':
        return vehicleType === '2-wheel';
      case 'tarpaulin':
        return vehicleType === '2-wheel' || vehicleType === '3-wheel';
      case 'trailerType':
        return true; // Temporarily disabled as requested
      default:
        return false;
    }
  };

  // Helper function to get body type options based on vehicle type
  const getBodyTypeOptions = () => {
    if (formData.vehicleType === '3-wheel') {
      return [
        { value: 'open', label: 'Open' },
        { value: 'container', label: 'Container' }
      ];
    }
    return [
      { value: 'open', label: 'Open' },
      { value: 'container', label: 'Container' },
      { value: 'darus', label: 'Tarus' }
    ];
  };

  // Helper function to get passing limit unit
  const getPassingLimitUnit = (): string => {
    return (formData.vehicleType === '2-wheel' || formData.vehicleType === '3-wheel') ? 'kg' : 'Tons';
  };

  // Handle vehicle type change
  const handleVehicleTypeChange = (vehicleType: string) => {
    const availableSizes = getAvailableVehicleSizes(vehicleType);
    const defaultSize = availableSizes.length > 0 ? availableSizes[0] : 0;

    setFormData(prev => ({
      ...prev,
      vehicleType,
      vehicleSize: defaultSize,
      // Reset dimensions for 2-wheel and 3-wheel
      dimensions: (vehicleType === '2-wheel' || vehicleType === '3-wheel') 
        ? { length: 0, breadth: 0 }
        : prev.dimensions,
      // Reset body type for 2-wheel
      bodyType: vehicleType === '2-wheel' ? 'open' : prev.bodyType,
      // Reset tarpaulin for 2-wheel and 3-wheel
      tarpaulin: (vehicleType === '2-wheel' || vehicleType === '3-wheel') ? 'none' : prev.tarpaulin,
      // Reset passing limit unit
      passingLimit: (vehicleType === '2-wheel' || vehicleType === '3-wheel') 
        ? (prev.passingLimit * 1000) // Convert tons to kg
        : Math.round(prev.passingLimit / 1000) // Convert kg to tons
    }));
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
      toast.error('Error checking profile status');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = () => {
    const optionalPhotoCount = photos.filter(photo => 
      photo.type.startsWith('optional')
    ).length;
    
    const newPhotoType = optionalPhotoCount > 0 ? `optional_${optionalPhotoCount}` : 'optional_1';
    
    setPhotos(prev => [
      ...prev,
      { type: newPhotoType, file: null, preview: '' }
    ]);
  };

  const handlePhotoUpload = async (index: number, file: File) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index] = {
      ...updatedPhotos[index],
      file,
      preview: URL.createObjectURL(file)
    };
    setPhotos(updatedPhotos);
  };

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = [...photos];
    if (updatedPhotos[index].preview) {
      URL.revokeObjectURL(updatedPhotos[index].preview);
    }
    updatedPhotos[index] = { ...updatedPhotos[index], file: null, preview: '', cloudinaryUrl: '', publicId: '' };
    setPhotos(updatedPhotos);
  };

  const handleAreaChange = (index: number, field: keyof OperatingArea, value: string) => {
    const updated = [...formData.operatingAreas];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, operatingAreas: updated }));
  };

  const addOperatingArea = () => {
    setFormData(prev => ({
      ...prev,
      operatingAreas: [...prev.operatingAreas, { state: '', district: '', place: '' }]
    }));
  };

  const removeOperatingArea = (index: number) => {
    setFormData(prev => ({
      ...prev,
      operatingAreas: prev.operatingAreas.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    // Check required photos - adjust based on vehicle type
    const requiredPhotoTypes = ['front', 'side', 'back', 'rc_book'];
    const uploadedRequiredPhotos = photos.filter(photo =>
      requiredPhotoTypes.includes(photo.type) && photo.file
    );

    if (uploadedRequiredPhotos.length < requiredPhotoTypes.length) {
      toast.error('Please upload all required photos');
      return false;
    }

    // Check operating areas
    const validAreas = formData.operatingAreas.filter(area =>
      area.state && area.district && area.place
    );

    if (validAreas.length === 0) {
      toast.error('Please add at least one complete operating area');
      return false;
    }

    // Check vehicle size for applicable vehicle types
    if (!isFieldDisabled('vehicleSize') && !formData.vehicleSize) {
      toast.error('Please select vehicle size');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!profileComplete) {
      toast.error('Please complete your profile first');
      navigate('/profile/complete');
      return;
    }
    
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const formDataObj = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === "object") {
          formDataObj.append(key, JSON.stringify(value));
        } else {
          formDataObj.append(key, value as any);
        }
      });

      photos.forEach((photo) => {
        if (photo.file) {
          formDataObj.append("images", photo.file);
        }
      });

      const response = await vehicleAPI.createVehicle(formDataObj, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      if (response.data.success) {
        toast.success("Vehicle registered successfully!");
        navigate("/my-vehicles");
      }
    } catch (error: any) {
      console.error("Error submitting vehicle:", error);
      toast.error(error.response?.data?.message || "Failed to register vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!profileComplete) {
    return null;
  }

  const availableVehicleSizes = getAvailableVehicleSizes(formData.vehicleType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Add New Vehicle</h1>
          <p className="text-lg text-slate-600">Register your vehicle to start receiving load assignments</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
          >
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Truck className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Vehicle Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Vehicle Type *
                </label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => handleVehicleTypeChange(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                  required
                >
                  <option value="2-wheel">2-wheeler Bike</option>
                  <option value="3-wheel">3-wheeler Auto</option>
                  <option value="4-wheel">4-wheeler pickup/Dost/Tata Ace</option>
                  <option value="6-wheel">6-wheeler Eicher/Canter/JCB</option>
                  <option value="trailer">trailer/Open Truck/Crane</option>
                  <option value="10-wheel">10-wheeler Lorry</option>
                  <option value="12-wheel">12-wheeler Lorry</option>
                  <option value="14-wheel">14-wheeler Lorry</option>
                  <option value="16-wheel">16-wheeler Lorry</option>
                  <option value="18-wheel">18-wheeler Lorry</option>
                  <option value="20-wheel">20-wheeler Lorry</option>
                </select>
              </div>

              {!isFieldDisabled('vehicleSize') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Vehicle Length Size (ft) *
                  </label>
                  <select
                    value={formData.vehicleSize}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleSize: Number(e.target.value) }))}
                    className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                    required
                  >
                    {availableVehicleSizes.map(size => (
                      <option key={size} value={size}>{size} ft</option>
                    ))}
                  </select>
                </div>
              )}

              {!isFieldDisabled('dimensions') && (
                <>
                  <Input
                    label="Width (ft) *"
                    type="number"
                    value={formData.dimensions.length.toString()}
                    onChange={(value) => setFormData(prev => ({
                      ...prev,
                      dimensions: { ...prev.dimensions, length: Number(value) || 0 }
                    }))}
                    required
                  />

                  <Input
                    label="Height (ft) *"
                    type="number"
                    value={formData.dimensions.breadth.toString()}
                    onChange={(value) => setFormData(prev => ({
                      ...prev,
                      dimensions: { ...prev.dimensions, breadth: Number(value) || 0 }
                    }))}
                    required
                  />
                </>
              )}

              <Input
                label="Vehicle Number *"
                value={formData.vehicleNumber}
                onChange={(value) => setFormData(prev => ({ ...prev, vehicleNumber: value.toUpperCase() }))}
                placeholder="e.g., KA01AB1234"
                required
              />

              <Input
                label={`Passing Limit (${getPassingLimitUnit()}) *`}
                type="number"
                value={formData.passingLimit.toString()}
                onChange={(value) => setFormData(prev => ({ ...prev, passingLimit: Number(value) || 0 }))}
                required
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Availability Date *
                </label>
                <input
                  type="date"
                  value={formData.availability}
                  onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                  required
                />
              </div>

              {!isFieldDisabled('bodyType') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Vehicle Body Type *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {getBodyTypeOptions().map(option => (
                      <label key={option.value} className="relative cursor-pointer">
                        <input
                          type="radio"
                          name="bodyType"
                          value={option.value}
                          checked={formData.bodyType === option.value}
                          onChange={() => setFormData(prev => ({ ...prev, bodyType: option.value as any }))}
                          className="sr-only"
                        />
                        <div className={`
                          p-4 text-center rounded-xl border-2 transition-all duration-200
                          ${formData.bodyType === option.value
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-300'
                          }
                        `}>
                          <span className="text-sm font-medium">{option.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {!isFieldDisabled('tarpaulin') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Tarpaulin *
                  </label>
                  <select
                    value={formData.tarpaulin}
                    onChange={(e) => setFormData(prev => ({ ...prev, tarpaulin: e.target.value as any }))}
                    className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                    required
                  >
                    <option value="one">One</option>
                    <option value="two">Two</option>
                    <option value="none">None</option>
                  </select>
                </div>
              )}
            </div>
          </motion.div>

          <OperatingAreaForm
            operatingAreas={formData.operatingAreas}
            onAreaChange={handleAreaChange}
            onAddArea={addOperatingArea}
            onRemoveArea={removeOperatingArea}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
          >
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                Vehicle Documents & Photos
              </h3>
            </div>

            <PhotoUploadGrid
              photos={photos}
              onPhotoUpload={handlePhotoUpload}
              onRemovePhoto={handleRemovePhoto}
              onAddPhoto={handleAddPhoto}
              uploadProgress={progress}
            />

            <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">Important Requirements</p>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• All marked photos (*) are mandatory for vehicle registration</li>
                    <li>• Images should be clear and readable</li>
                    <li>• Maximum file size: 10MB per image</li>
                    <li>• Supported formats: JPEG, PNG, WebP</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center pt-4"
          >
            <Button
              type="submit"
              loading={submitting || cloudinaryUploading}
              size="lg"
              className="px-16 py-4 text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              {submitting ? 'Registering Vehicle...' : cloudinaryUploading ? 'Uploading Photos...' : 'Register Vehicle'}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};