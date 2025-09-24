import express from 'express';
import {
  createLoad,
  getMyLoads,
  getAvailableLoads,
  getLoad,
  uploadMaterialPhotos,
  updateLoadStatus,
  deleteLoad,
  
} from '../controllers/loadController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/multer.js';

const router = express.Router();

router.post('/', protect, authorize('load_provider'), upload.array('images', 20), createLoad);
router.get('/', protect, authorize('load_provider'), getMyLoads);
router.get('/available', protect, authorize('vehicle_owner'), getAvailableLoads);
router.get('/:id', protect, getLoad);
router.post('/:id/materials/:materialIndex/photos', protect, uploadMaterialPhotos);
router.put('/:id/status', protect, updateLoadStatus);
router.delete('/:id', protect, authorize('load_provider'), deleteLoad);

export default router;
