// routes/profile.js
import express from 'express';
import {
  getCompletionStatus,
  getProfile,
  updateProfile,
  uploadImage,
  deleteImage,
  getCompletionStats
} from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.use(protect); // All profile routes require authentication

// Profile completion routes
router.get('/completion-status', getCompletionStatus);
router.get('/profile',  getProfile);
router.put('/profile', updateProfile);

// Image upload routes
router.post('/upload-image',  upload.single('image'), uploadImage);
router.delete('/delete-image',  deleteImage);

// Admin routes
router.get('/completion-stats', getCompletionStats);



export default router;
