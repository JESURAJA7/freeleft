import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
  getPayment
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);
router.get('/history', protect, getPaymentHistory);
router.get('/:id', protect, getPayment);

export default router;
