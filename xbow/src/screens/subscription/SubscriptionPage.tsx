import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCardIcon, 
  QrCodeIcon, 
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/CustomButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { subscriptionAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface SubscriptionDetails {
  currentStatus: string;
  subscriptionEndDate?: string;
  monthlyFee: number;
  totalVehicles: number;
  paymentMethods: {
    qrCode: string;
    bankDetails: {
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      accountHolderName: string;
    };
    upiId: string;
  };
}

export const SubscriptionPage: React.FC = () => {
  const { user } = useAuth();
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptionDetails();
  }, []);

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await subscriptionAPI.getSubscriptionDetails();
      if (response.data.success) {
        setSubscriptionDetails(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      setPaymentLoading(true);
      
      // Create order
      const orderResponse = await subscriptionAPI.createSubscriptionOrder();
      if (!orderResponse.data.success) {
        throw new Error('Failed to create payment order');
      }

      const { orderId, amount, key } = orderResponse.data.data;

      // Initialize Razorpay
      const options = {
        key,
        amount,
        currency: 'INR',
        name: 'XBOW Logistics',
        description: 'Monthly Subscription',
        order_id: orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await subscriptionAPI.verifySubscriptionPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId: orderResponse.data.data.paymentId
            });

            if (verifyResponse.data.success) {
              toast.success('Subscription activated successfully!');
              fetchSubscriptionDetails();
            }
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone
        },
        theme: {
          color: '#2563EB'
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error('Failed to initiate payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'trial': return 'text-blue-600 bg-blue-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircleIcon;
      case 'trial': return ClockIcon;
      case 'expired': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!subscriptionDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Unable to load subscription details</h2>
          <Button onClick={fetchSubscriptionDetails}>Try Again</Button>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(subscriptionDetails.currentStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Subscription Management</h1>
          <p className="text-slate-600">Manage your XBOW Logistics subscription</p>
        </motion.div>

        {/* Current Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Current Subscription</h2>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${getStatusColor(subscriptionDetails.currentStatus)}`}>
              <StatusIcon className="h-5 w-5" />
              <span className="font-medium capitalize">{subscriptionDetails.currentStatus}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-2">Monthly Fee</h3>
              <p className="text-2xl font-bold text-blue-600">₹{subscriptionDetails.monthlyFee.toLocaleString()}</p>
              {user?.role === 'vehicle_owner' && (
                <p className="text-sm text-slate-500 mt-1">
                  ₹1,000 × {subscriptionDetails.totalVehicles} vehicle{subscriptionDetails.totalVehicles !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-2">Plan Type</h3>
              <p className="text-lg font-medium text-slate-700">
                {user?.role === 'load_provider' ? 'Unlimited Posting' : 'Per Vehicle'}
              </p>
            </div>

            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-2">Next Billing</h3>
              <p className="text-lg font-medium text-slate-700">
                {subscriptionDetails.subscriptionEndDate 
                  ? new Date(subscriptionDetails.subscriptionEndDate).toLocaleDateString()
                  : 'Not Active'
                }
              </p>
            </div>
          </div>

          {subscriptionDetails.currentStatus !== 'active' && (
            <div className="mt-6 text-center">
              <Button
                onClick={handleRazorpayPayment}
                loading={paymentLoading}
                size="lg"
                icon={<CreditCardIcon className="h-5 w-5" />}
              >
                Activate Subscription
              </Button>
            </div>
          )}
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Payment Methods</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Code Payment */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <QrCodeIcon className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">QR Code Payment</h3>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-xl mb-4">
                <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center border-2 border-slate-200">
                  <QrCodeIcon className="h-24 w-24 text-slate-400" />
                </div>
                <p className="text-sm text-slate-600 mt-4">
                  Scan QR code with any UPI app
                </p>
              </div>

              <div className="text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">UPI ID:</span>
                  <span className="font-medium">{subscriptionDetails.paymentMethods.upiId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount:</span>
                  <span className="font-medium">₹{subscriptionDetails.monthlyFee}</span>
                </div>
              </div>
            </div>

            {/* Bank Transfer */}
            <div>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <BanknotesIcon className="h-6 w-6 text-emerald-600" />
                <h3 className="text-lg font-semibold text-slate-900">Bank Transfer</h3>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Account Number:</span>
                  <span className="font-medium">{subscriptionDetails.paymentMethods.bankDetails.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">IFSC Code:</span>
                  <span className="font-medium">{subscriptionDetails.paymentMethods.bankDetails.ifscCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Bank Name:</span>
                  <span className="font-medium">{subscriptionDetails.paymentMethods.bankDetails.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Account Holder:</span>
                  <span className="font-medium">{subscriptionDetails.paymentMethods.bankDetails.accountHolderName}</span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> After bank transfer, please contact us at{' '}
                  <a href="https://wa.me/919176622222" className="text-blue-600 hover:underline">
                    +91 91766 22222
                  </a>{' '}
                  with transaction details for manual verification.
                </p>
              </div>
            </div>
          </div>

          {/* WhatsApp Support */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <span className="font-medium">WhatsApp Support: +91 91766 22222</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};