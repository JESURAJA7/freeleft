import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET
// });

// @desc    Create payment order
// @route   POST /api/payments/create-order
// @access  Private
export const createPaymentOrder = async (req, res) => {
  try {
    const { amount, type } = req.body; // type: 'subscription' or 'commission'

    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `${type}_${req.user._id}_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    const payment = await Payment.create({
      userId: req.user._id,
      userName: req.user.name,
      amount,
      type,
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
        paymentId: payment._id
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
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

    if (payment.type === 'subscription') {
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

      payment.subscriptionPeriod = {
        startDate: new Date(),
        endDate: subscriptionEndDate
      };
      await payment.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: payment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get payment details
// @route   GET /api/payments/:id
// @access  Private
export const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('userId', 'name email phone');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
