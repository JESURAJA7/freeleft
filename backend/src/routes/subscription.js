import express from 'express';
import {
  getSubscriptionDetails,
  createSubscriptionOrder,
  verifySubscriptionPayment
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All subscription routes require authentication

router.get('/', getSubscriptionDetails);
router.post('/create-order', createSubscriptionOrder);
router.post('/verify', verifySubscriptionPayment);

export default router;
