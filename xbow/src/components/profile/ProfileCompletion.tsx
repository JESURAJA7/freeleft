import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  UserIcon,
  BanknotesIcon,
  TruckIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/CustomButton';
import { Input } from '../common/CustomInput';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { profileAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
}

interface ImageUpload {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded?: {
    url: string;
    public_id: string;
  };
}

export const ProfileCompletion: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [completionStatus, setCompletionStatus] = useState<ProfileCompletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [vehicleOwnerType, setVehicleOwnerType] = useState<'owner' | 'owner_with_driver'>('owner');
  const [imageUploads, setImageUploads] = useState<{[key: string]: ImageUpload}>({});

  useEffect(() => {
    fetchCompletionStatus();
    fetchProfile();
  }, []);

  const fetchCompletionStatus = async () => {
    try {
      const response = await profileAPI.getCompletionStatus();
      if (response.data.success) {
        setCompletionStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching completion status:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await profileAPI.getProfile();
      if (response.data.success) {
        setFormData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (field: string, file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    
    setImageUploads(prev => ({
      ...prev,
      [field]: {
        file,
        preview,
        uploading: true
      }
    }));

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'profile_documents');

      const response = await profileAPI.uploadImage(formData);
      
      if (response.data.success) {
        setImageUploads(prev => ({
          ...prev,
          [field]: {
            ...prev[field],
            uploading: false,
            uploaded: response.data.data
          }
        }));
        toast.success('Image uploaded successfully');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
      
      setImageUploads(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const removeImage = (field: string) => {
    if (imageUploads[field]?.preview) {
      URL.revokeObjectURL(imageUploads[field].preview);
    }
    
    setImageUploads(prev => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      // Prepare form data with uploaded images
      const submitData = { ...formData };
      
      if (user?.role === 'vehicle_owner') {
        submitData.ownerType = vehicleOwnerType;
        submitData.documents = {};
        
        // Add uploaded images to form data
        Object.keys(imageUploads).forEach(field => {
          if (imageUploads[field].uploaded) {
            submitData.documents[field] = imageUploads[field].uploaded;
          }
        });
      }

      const response = await profileAPI.updateProfile(submitData);
      if (response.data.success) {
        toast.success('Profile updated successfully!');
        await refreshUser();
        await fetchCompletionStatus();
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedFormData = (parent: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const ImageUploadField: React.FC<{
    field: string;
    label: string;
    required?: boolean;
  }> = ({ field, label, required = false }) => {
    const upload = imageUploads[field];
    
    return (
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label} {required && '*'}
        </label>
        
        {!upload ? (
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(field, file);
              }}
              className="hidden"
              id={`upload-${field}`}
            />
            <label
              htmlFor={`upload-${field}`}
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <PhotoIcon className="h-8 w-8 text-slate-400" />
              <span className="text-sm text-slate-600">Click to upload image</span>
              <span className="text-xs text-slate-500">PNG, JPG up to 5MB</span>
            </label>
          </div>
        ) : (
          <div className="relative">
            <div className="border-2 border-slate-200 rounded-xl p-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={upload.preview}
                    alt={label}
                    className="h-20 w-20 object-cover rounded-lg"
                  />
                  {upload.uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{upload.file.name}</p>
                  <p className="text-sm text-slate-600">
                    {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {upload.uploading && (
                    <p className="text-sm text-blue-600">Uploading...</p>
                  )}
                  {upload.uploaded && (
                    <p className="text-sm text-green-600">✓ Uploaded successfully</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(field)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (completionStatus?.isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Profile Complete!</h2>
          <p className="text-slate-600 mb-6">
            Your profile is fully set up. You can now access all platform features.
          </p>
          <Button onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Complete Your Profile</h1>
          <p className="text-slate-600">
            Please complete your profile to access all platform features
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {user?.role === 'load_provider' ? (
              <>
                {/* Address Information */}
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-semibold text-slate-900">Address Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Street Address"
                      value={formData.address?.street || ''}
                      onChange={(value) => updateNestedFormData('address', 'street', value)}
                      required
                    />
                    <Input
                      label="City"
                      value={formData.address?.city || ''}
                      onChange={(value) => updateNestedFormData('address', 'city', value)}
                      required
                    />
                    <Input
                      label="State"
                      value={formData.address?.state || ''}
                      onChange={(value) => updateNestedFormData('address', 'state', value)}
                      required
                    />
                    <Input
                      label="Pincode"
                      value={formData.address?.pincode || ''}
                      onChange={(value) => updateNestedFormData('address', 'pincode', value)}
                      required
                    />
                    <Input
                      label="Landmark (Optional)"
                      value={formData.address?.landmark || ''}
                      onChange={(value) => updateNestedFormData('address', 'landmark', value)}
                    />
                  </div>
                </div>

                {/* Business Details */}
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-semibold text-slate-900">Business Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Company Name"
                      value={formData.businessDetails?.companyName || ''}
                      onChange={(value) => updateNestedFormData('businessDetails', 'companyName', value)}
                      required
                    />
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Business Type *
                      </label>
                      <select
                        value={formData.businessDetails?.businessType || ''}
                        onChange={(e) => updateNestedFormData('businessDetails', 'businessType', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
                        required
                      >
                        <option value="">Select Business Type</option>
                        <option value="manufacturer">Manufacturer</option>
                        <option value="trader">Trader</option>
                        <option value="logistics">Logistics</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <Input
                      label="GST Number (Optional)"
                      value={formData.businessDetails?.gstNumber || ''}
                      onChange={(value) => updateNestedFormData('businessDetails', 'gstNumber', value)}
                    />
                    <Input
                      label="PAN Number"
                      value={formData.businessDetails?.panNumber || ''}
                      onChange={(value) => updateNestedFormData('businessDetails', 'panNumber', value)}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Vehicle Owner Type Selection */}
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <TruckIcon className="h-6 w-6 text-emerald-600" />
                    <h3 className="text-xl font-semibold text-slate-900">Owner Type</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setVehicleOwnerType('owner')}
                      className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                        vehicleOwnerType === 'owner'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-center">
                        <UserIcon className="h-8 w-8 mx-auto mb-3 text-emerald-600" />
                        <h4 className="font-semibold text-slate-900 mb-2">Owner</h4>
                        <p className="text-sm text-slate-600">
                          I am the owner and I drive the vehicle myself
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setVehicleOwnerType('owner_with_driver')}
                      className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                        vehicleOwnerType === 'owner_with_driver'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* <div className="text-center">
                        <div className="flex justify-center space-x-1 mb-3">
                          <UserIcon className="h-6 w-6 text-emerald-600" />
                          <UserIcon className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h4 className="font-semibold text-slate-900 mb-2">Owner with Driver</h4>
                        <p className="text-sm text-slate-600">
                          I am the owner but I have a separate driver
                        </p>
                      </div> */}
                    </motion.div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <UserIcon className="h-6 w-6 text-emerald-600" />
                    <h3 className="text-xl font-semibold text-slate-900">Address Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Street Address"
                      value={formData.address?.street || ''}
                      onChange={(value) => updateNestedFormData('address', 'street', value)}
                      required
                    />
                    <Input
                      label="City"
                      value={formData.address?.city || ''}
                      onChange={(value) => updateNestedFormData('address', 'city', value)}
                      required
                    />
                    <Input
                      label="State"
                      value={formData.address?.state || ''}
                      onChange={(value) => updateNestedFormData('address', 'state', value)}
                      required
                    />
                    <Input
                      label="Pincode"
                      value={formData.address?.pincode || ''}
                      onChange={(value) => updateNestedFormData('address', 'pincode', value)}
                      required
                    />
                    <Input
                      label="Landmark (Optional)"
                      value={formData.address?.landmark || ''}
                      onChange={(value) => updateNestedFormData('address', 'landmark', value)}
                    />
                  </div>
                </div>

                {/* Owner Documents */}
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <DocumentTextIcon className="h-6 w-6 text-emerald-600" />
                    <h3 className="text-xl font-semibold text-slate-900">
                      {vehicleOwnerType === 'owner' ? 'Your Documents' : 'Owner Documents'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImageUploadField
                      field="ownerAadharFront"
                      label="Owner Aadhar Card (Front)"
                      required
                    />
                    <ImageUploadField
                      field="ownerAadharBack"
                      label="Owner Aadhar Card (Back)"
                      required
                    />
                
                       <ImageUploadField
                      field="ownerpanCard"
                      label="Owner PAN Card Front"
                      required
                    />
                       <ImageUploadField
                      field="ownerpassbook"
                      label="Bank passbook or cancel cheque scan copy"
                      required
                    />
                  </div>
                </div>

                {/* Driver Documents (only if owner with driver) */}
                {vehicleOwnerType === 'owner_with_driver' && (
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                      <h3 className="text-xl font-semibold text-slate-900">Driver Documents</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ImageUploadField
                        field="driverAadharFront"
                        label="Driver Aadhar Card (Front)"
                        required
                      />
                      <ImageUploadField
                        field="driverAadharBack"
                        label="Driver Aadhar Card (Back)"
                        required
                      />
                      <ImageUploadField
                        field="driverLicense"
                        label="Driver License"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* License Information */}
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <DocumentTextIcon className="h-6 w-6 text-emerald-600" />
                    <h3 className="text-xl font-semibold text-slate-900">License Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="License Number"
                      value={formData.licenseNumber || ''}
                      onChange={(value) => updateFormData('licenseNumber', value)}
                      required
                    />
                    <Input
                      label="License Expiry Date"
                      type="date"
                      value={formData.licenseExpiry ? new Date(formData.licenseExpiry).toISOString().split('T')[0] : ''}
                      onChange={(value) => updateFormData('licenseExpiry', value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end pt-6 border-t border-slate-200">
              <Button
                type="submit"
                loading={updating}
                size="lg"
                className="px-8"
                disabled={Object.values(imageUploads).some(upload => upload.uploading)}
              >
                Complete Profile
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};