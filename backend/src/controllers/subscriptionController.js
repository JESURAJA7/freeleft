import crypto from 'crypto';
import Razorpay from 'razorpay';

import User from '../models/User.js';
import Payment from '../models/Payment.js';

// Initialize Razorpay
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET
// });

// @desc    Get subscription details
// @route   GET /api/subscription
// @access  Private
export const getSubscriptionDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    let subscriptionFee = 1000; // Default ₹1,000
    if (user.role === 'vehicle_owner') {
      subscriptionFee = user.totalVehicles * 1000; // ₹1,000 per vehicle
    }

    const subscriptionDetails = {
      currentStatus: user.subscriptionStatus,
      subscriptionEndDate: user.subscriptionEndDate,
      monthlyFee: subscriptionFee,
      totalVehicles: user.totalVehicles || 0,
      paymentMethods: {
        qrCode: `upi://pay?pa=9176622222@paytm&pn=XBOW Logistics&am=${subscriptionFee}&cu=INR`,
        bankDetails: {
          accountNumber: '1234567890',
          ifscCode: 'SBIN0001234',
          bankName: 'State Bank of India',
          accountHolderName: 'XBOW Logistics Pvt Ltd'
        },
        upiId: '9176622222@paytm'
      }
    };

    res.status(200).json({
      success: true,
      data: subscriptionDetails
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create subscription payment order
// @route   POST /api/subscription/create-order
// @access  Private
export const createSubscriptionOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    let amount = 1000; // Default ₹1,000 for load providers
    if (user.role === 'vehicle_owner') {
      amount = user.totalVehicles * 1000; // ₹1,000 per vehicle
    }

    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `subscription_${req.user._id}_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    const payment = await Payment.create({
      userId: req.user._id,
      userName: req.user.name,
      amount,
      type: 'subscription',
      status: 'pending',
      paymentMethod: 'razorpay',
      razorpayOrderId: order.id
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        paymentId: payment._id,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify subscription payment
// @route   POST /api/subscription/verify
// @access  Private
export const verifySubscriptionPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId
    } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: 'completed',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    await User.findByIdAndUpdate(payment.userId, {
      subscriptionStatus: 'active',
      subscriptionEndDate,
      $push: {
        paymentHistory: {
          amount: payment.amount,
          paymentId: razorpay_payment_id,
          status: 'completed',
          date: new Date()
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Subscription activated successfully',
      data: payment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
