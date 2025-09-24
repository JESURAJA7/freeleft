import { Cloudinary } from 'cloudinary-core';

// Initialize Cloudinary
const cloudinary = new Cloudinary({
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  secure: true
});

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export class CloudinaryService {
  private static instance: CloudinaryService;
  private uploadPreset: string;

  constructor() {
    this.uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
  }

  static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService();
    }
    return CloudinaryService.instance;
  }

  async uploadImage(
    file: File,
    folder: string = 'vehicle-photos',
    transformation?: object
  ): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', folder);
    
    if (transformation) {
      formData.append('transformation', JSON.stringify(transformation));
    }

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result as CloudinaryUploadResponse;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  }

  async uploadMultipleImages(
    files: { file: File; type: string }[],
    folder: string = 'vehicle-photos'
  ): Promise<Array<CloudinaryUploadResponse & { type: string }>> {
    const uploadPromises = files.map(async ({ file, type }) => {
      const result = await this.uploadImage(file, `${folder}/${type}`);
      return { ...result, type };
    });

    return Promise.all(uploadPromises);
  }

  getOptimizedUrl(publicId: string, options?: object): string {
    return cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: 'auto',
      ...options
    });
  }
}

export const cloudinaryService = CloudinaryService.getInstance();