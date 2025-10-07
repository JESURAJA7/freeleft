import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CurrencyRupeeIcon,
    CheckCircleIcon,
    TruckIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    ClockIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/CustomButton';
import qrcode from '../../assets/xbowlogisticsindianbk[2]_page-0001.jpg';

const vehicleOwnerPlans = [
    {
        type: 'Two-Wheeler',
        icon: '🏍️',
        yearly: 1000,
        monthly: 200,
        validity: '30 Days',
        color: 'from-blue-500 to-blue-600'
    },
    {
        type: 'Three-Wheeler',
        icon: '🛺',
        yearly: 1500,
        monthly: 250,
        validity: '30 Days',
        color: 'from-emerald-500 to-emerald-600'
    },
    {
        type: 'LCV (Light Commercial Vehicle)',
        icon: '🚚',
        yearly: 2000,
        monthly: 300,
        validity: '30 Days',
        color: 'from-orange-500 to-orange-600'
    },
    {
        type: 'HCV / Crane',
        icon: '🚛',
        yearly: 3000,
        monthly: 350,
        validity: '30 Days',
        color: 'from-purple-500 to-purple-600'
    }
];

const loadProviderPlan = {
    price: 1500,
    loads: 100,
    features: [
        'Post up to 100 loads',
        'Smart vehicle matching',
        'Real-time tracking',
        'Priority support',
        'Analytics dashboard'
    ]
};

const biddingDeposit = {
    amount: 5000,
    description: 'Per Vehicle Owner Or Per Company'
};

export const PaymentPage: React.FC = () => {
    const { user } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [selectedDuration, setSelectedDuration] = useState<'monthly' | 'yearly'>('yearly');

    const isVehicleOwner = user?.role === 'vehicle_owner';
    const isLoadProvider = user?.role === 'load_provider';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center space-x-2 mb-4">
                        <SparklesIcon className="h-8 w-8 text-blue-600" />
                        <h1 className="text-4xl font-bold text-slate-900">Choose Your Plan</h1>
                        <SparklesIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-xl text-slate-600">Select the perfect plan for your business needs</p>
                </motion.div>

                {/* Vehicle Owner Plans */}
                {isVehicleOwner && (
                    <div className="mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-center mb-8"
                        >
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Vehicle Owner Plans</h2>
                            <div className="inline-flex items-center space-x-4 bg-white rounded-full px-6 py-3 shadow-lg border-2 border-blue-200">
                                <button
                                    onClick={() => setSelectedDuration('yearly')}
                                    className={`px-6 py-2 rounded-full font-semibold transition-all ${selectedDuration === 'yearly'
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                                        : 'text-slate-600 hover:text-blue-600'
                                        }`}
                                >
                                    Yearly (Save More!)
                                </button>
                                <button
                                    onClick={() => setSelectedDuration('monthly')}
                                    className={`px-6 py-2 rounded-full font-semibold transition-all ${selectedDuration === 'monthly'
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                                        : 'text-slate-600 hover:text-blue-600'
                                        }`}
                                >
                                    Monthly
                                </button>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            {vehicleOwnerPlans.map((plan, index) => (
                                <motion.div
                                    key={plan.type}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + index * 0.1 }}
                                    onClick={() => setSelectedPlan(plan.type)}
                                    className={`relative bg-white rounded-3xl shadow-xl border-2 overflow-hidden cursor-pointer transition-all duration-300 ${selectedPlan === plan.type
                                        ? 'border-blue-500 scale-105'
                                        : 'border-slate-200 hover:border-blue-300 hover:scale-102'
                                        }`}
                                >
                                    {/* Header with Icon */}
                                    <div className={`bg-gradient-to-r ${plan.color} p-6 text-white`}>
                                        <div className="text-5xl mb-3 text-center">{plan.icon}</div>
                                        <h3 className="text-xl font-bold text-center">{plan.type}</h3>
                                    </div>

                                    {/* Pricing */}
                                    <div className="p-6">
                                        <div className="text-center mb-6">
                                            <div className="flex items-center justify-center mb-2">
                                                <CurrencyRupeeIcon className="h-8 w-8 text-slate-700" />
                                                <span className="text-4xl font-bold text-slate-900">
                                                    {selectedDuration === 'yearly' ? plan.yearly : plan.monthly}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 font-medium">
                                                {selectedDuration === 'yearly' ? 'Per Year' : 'Per Month'}
                                            </p>
                                            <div className="mt-3 inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                                                <ClockIcon className="h-4 w-4 text-emerald-600" />
                                                <span className="text-sm font-medium text-emerald-700">
                                                    Validity: {selectedDuration === 'yearly' ? 365 : 30} Days
                                                </span>
                                            </div>
                                        </div>


                                        {selectedDuration === 'yearly' && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                                                <p className="text-sm text-blue-800 text-center font-semibold">
                                                    Save ₹{Number(plan.monthly) * 12 - Number(plan.yearly)} yearly!
                                                </p>
                                            </div>
                                        )}

                                        <Button
                                            className={`w-full ${selectedPlan === plan.type
                                                ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                                                : 'bg-slate-700'
                                                }`}
                                        >
                                            {selectedPlan === plan.type ? 'Selected' : 'Select Plan'}
                                        </Button>
                                    </div>

                                    {selectedPlan === plan.type && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute top-4 right-4 bg-blue-600 rounded-full p-2"
                                        >
                                            <CheckCircleIcon className="h-6 w-6 text-white" />
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Bidding Deposit */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl shadow-2xl p-8 text-white mb-12"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2">Bidding Deposit</h3>
                                    <p className="text-amber-50">{biddingDeposit.description}</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end mb-2">
                                        <CurrencyRupeeIcon className="h-10 w-10" />
                                        <span className="text-5xl font-bold">{biddingDeposit.amount.toLocaleString()}</span>
                                    </div>
                                    <p className="text-amber-50 font-medium">One-time deposit</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Load Provider Plan */}
                {isLoadProvider && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-16"
                    >
                        <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">Load Provider Plan</h2>
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white rounded-3xl shadow-2xl border-2 border-blue-200 overflow-hidden">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white text-center">
                                    <DocumentTextIcon className="h-16 w-16 mx-auto mb-4" />
                                    <h3 className="text-3xl font-bold mb-2">Professional Plan</h3>
                                    <p className="text-blue-100">Perfect for growing businesses</p>
                                </div>

                                {/* Pricing */}
                                <div className="p-8">
                                    <div className="text-center mb-8">
                                        <div className="flex items-center justify-center mb-3">
                                            <CurrencyRupeeIcon className="h-12 w-12 text-slate-700" />
                                            <span className="text-6xl font-bold text-slate-900">{loadProviderPlan.price}</span>
                                        </div>
                                        <p className="text-xl text-slate-600 font-semibold">for {loadProviderPlan.loads} loads</p>
                                    </div>

                                    {/* Features */}
                                    <div className="space-y-4 mb-8">
                                        {loadProviderPlan.features.map((feature, index) => (
                                            <div key={index} className="flex items-center space-x-3">
                                                <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                                                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                                </div>
                                                <span className="text-slate-700 font-medium">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-lg py-4">
                                        Get Started
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Payment QR Code Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="max-w-2xl mx-auto"
                >
                    <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white text-center">
                            <ShieldCheckIcon className="h-12 w-12 mx-auto mb-3" />
                            <h2 className="text-2xl font-bold mb-2">Complete Your Payment</h2>
                            <p className="text-slate-300">Scan & Pay using any UPI app</p>
                        </div>

                        {/* QR Code */}
                        <div className="p-8">
                            <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-6 border-2 border-blue-200 mb-6">
                                <img
                                    src={qrcode}
                                    alt="Payment QR Code"
                                    className="w-full max-w-md mx-auto rounded-xl shadow-lg"
                                />
                            </div>

                            {/* Payment Info */}
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <h3 className="font-semibold text-blue-900 mb-2">Payment Instructions:</h3>
                                    <ol className="list-decimal list-inside space-y-2 text-blue-800">
                                        <li>Open any UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
                                        <li>Scan the QR code above</li>
                                        <li>Enter the amount as per your selected plan</li>
                                        <li>Complete the payment</li>
                                        <li>Take a screenshot of the payment confirmation</li>
                                    </ol>
                                </div>

                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                    <h3 className="font-semibold text-emerald-900 mb-2">UPI ID:</h3>
                                    <p className="text-emerald-800 text-lg font-mono">xbowlogistics@indianbk</p>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <h3 className="font-semibold text-amber-900 mb-2">Important:</h3>
                                    <p className="text-amber-800">
                                        After payment, please contact support with your payment screenshot for account activation.
                                    </p>
                                </div>

                                <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-lg py-4">
                                    I Have Completed Payment
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 text-center"
                >
                    <div className="flex items-center justify-center space-x-8 flex-wrap">
                        <div className="flex items-center space-x-2 text-slate-600">
                            <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                            <span className="font-medium">100% Secure</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-600">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                            <span className="font-medium">Instant Activation</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-600">
                            <TruckIcon className="h-6 w-6 text-orange-600" />
                            <span className="font-medium">24/7 Support</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
