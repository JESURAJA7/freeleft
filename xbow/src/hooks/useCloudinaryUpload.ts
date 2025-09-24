import { useState } from 'react';
import { cloudinaryService, CloudinaryUploadResponse } from '../services/cloudinary';
import toast from 'react-hot-toast';

interface UploadProgress {
  [key: string]: number;
}

export const useCloudinaryUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({});

  const uploadSingle = async (
    file: File,
    type: string,
    folder: string = 'vehicle-photos'
  ): Promise<CloudinaryUploadResponse | null> => {
    try {
      setUploading(true);
      setProgress(prev => ({ ...prev, [type]: 0 }));

      const result = await cloudinaryService.uploadImage(file, `${folder}/${type}`, {
        width: 800,
        height: 600,
        crop: 'limit',
        quality: 'auto',
        fetch_format: 'auto'
      });

      setProgress(prev => ({ ...prev, [type]: 100 }));
      return result;
    } catch (error) {
      console.error(`Upload failed for ${type}:`, error);
      toast.error(`Failed to upload ${type} image`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadMultiple = async (
    files: { file: File; type: string }[],
    folder: string = 'vehicle-photos'
  ): Promise<Array<CloudinaryUploadResponse & { type: string }>> => {
    try {
      setUploading(true);
      
      // Initialize progress for all files
      const initialProgress: UploadProgress = {};
      files.forEach(({ type }) => {
        initialProgress[type] = 0;
      });
      setProgress(initialProgress);

      const results = await Promise.all(
        files.map(async ({ file, type }) => {
          try {
            const result = await cloudinaryService.uploadImage(file, `${folder}/${type}`, {
              width: 800,
              height: 600,
              crop: 'limit',
              quality: 'auto',
              fetch_format: 'auto'
            });
            
            setProgress(prev => ({ ...prev, [type]: 100 }));
            return { ...result, type };
          } catch (error) {
            console.error(`Upload failed for ${type}:`, error);
            setProgress(prev => ({ ...prev, [type]: -1 })); // -1 indicates error
            throw error;
          }
        })
      );

      return results;
    } catch (error) {
      toast.error('Some images failed to upload. Please try again.');
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const resetProgress = () => {
    setProgress({});
  };

  return {
    uploadSingle,
    uploadMultiple,
    uploading,
    progress,
    resetProgress
  };
};