import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, X, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { VehiclePhoto } from '../../types/index';

interface PhotoUploadGridProps {
  photos: VehiclePhoto[];
  onPhotoUpload: (index: number, file: File) => void;
  onRemovePhoto: (index: number) => void;
  onAddPhoto: () => void; // New prop for adding photos
  uploadProgress: { [key: string]: number };
  maxPhotos?: number; // Optional max photos limit
}

export const PhotoUploadGrid: React.FC<PhotoUploadGridProps> = ({
  photos,
  onPhotoUpload,
  onRemovePhoto,
  onAddPhoto,
  uploadProgress,
  maxPhotos = 10 // Default max photos
}) => {
  const getPhotoDisplayName = (type: string): string => {
    const names: { [key: string]: string } = {
      front: 'Front View',
      side: 'Side View', 
      back: 'Back View',
      rc_book: 'RC Book',
      aadhaar_front: 'Aadhaar Front',
      aadhaar_back: 'Aadhaar Back',
      optional: 'Additional Photo',
      optional_1: 'Additional Photo 1',
      optional_2: 'Additional Photo 2',
      optional_3: 'Additional Photo 3',
      // Add more as needed
    };
    return names[type] || type;
  };

  const isRequired = (type: string): boolean => {
    return ['front', 'side', 'back', 'license', 'rc_book', 'aadhaar_front', 'aadhaar_back'].includes(type);
  };

  const isOptional = (type: string): boolean => {
    return type.startsWith('optional');
  };

  const getUploadStatus = (photo: VehiclePhoto) => {
    const progress = uploadProgress[photo.type];
    if (progress === undefined) return 'idle';
    if (progress === -1) return 'error';
    if (progress === 100) return 'complete';
    if (progress > 0) return 'uploading';
    return 'idle';
  };

  const canAddMorePhotos = photos.length < maxPhotos;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {photos.map((photo, index) => {
        const status = getUploadStatus(photo);
        const progress = uploadProgress[photo.type] || 0;
        
        return (
          <motion.div
            key={`${photo.type}-${index}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div className={`
              relative w-full h-48 border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-300
              ${photo.preview ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-25'}
              ${status === 'error' ? 'border-red-500 bg-red-50' : ''}
            `}>
              {photo.preview ? (
                <div className="relative w-full h-full">
                  <img
                    src={photo.preview}
                    alt={getPhotoDisplayName(photo.type)}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Upload progress overlay */}
                  {status === 'uploading' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-white text-sm font-medium">{progress}%</span>
                      </div>
                    </div>
                  )}

                  {/* Status indicators */}
                  <div className="absolute top-2 left-2">
                    {status === 'complete' && (
                      <CheckCircle className="w-6 h-6 text-emerald-500 bg-white rounded-full" />
                    )}
                    {status === 'error' && (
                      <AlertCircle className="w-6 h-6 text-red-500 bg-white rounded-full" />
                    )}
                  </div>

                  {/* Remove button - show for all photos except required ones */}
                  {(isOptional(photo.type) || !isRequired(photo.type)) && (
                    <button
                      type="button"
                      onClick={() => onRemovePhoto(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer">
                  <Camera className="w-8 h-8 mb-2" />
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Click to upload</span>
                </div>
              )}

              {/* File input */}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onPhotoUpload(index, file);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Photo label */}
            <div className="mt-3 text-center">
              <h4 className="text-sm font-semibold text-slate-700">
                {getPhotoDisplayName(photo.type)}
                {isRequired(photo.type) && <span className="text-red-500 ml-1">*</span>}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {isRequired(photo.type) ? 'Required' : 'Optional'}
              </p>
            </div>
          </motion.div>
        );
      })}

      {/* Add Photo Button */}
      {canAddMorePhotos && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: photos.length * 0.1 }}
          className="relative"
        >
          <button
            type="button"
            onClick={onAddPhoto}
            className="relative w-full h-48 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden transition-all duration-300 hover:border-emerald-400 hover:bg-emerald-25 group cursor-pointer"
          >
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
              <Plus className="w-12 h-12 mb-2" />
              <span className="text-sm font-medium">Add More Photos</span>
              <span className="text-xs mt-1">(Optional)</span>
            </div>
          </button>
        </motion.div>
      )}
    </div>
  );
};