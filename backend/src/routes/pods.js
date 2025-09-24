import express from 'express';
import {
  uploadPOD,
  getPODsByLoad,
  getMyPODs,
  getPOD
} from '../controllers/podController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('vehicle_owner'), uploadPOD);
router.get('/load/:loadId', protect, getPODsByLoad);
router.get('/my-pods', protect, authorize('vehicle_owner'), getMyPODs);
router.get('/:id', protect, getPOD);

export default router;
