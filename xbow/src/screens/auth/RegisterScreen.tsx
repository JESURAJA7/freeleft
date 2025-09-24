import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TruckIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon, 
  PhoneIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import toast from 'react-hot-toast';
import logo from '../../assets/WhatsApp Image 2025-09-08 at 00.16.58_e20dd409.jpg';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    password: '',
    confirmPassword: '',
    role: 'load_provider' as 'load_provider' | 'vehicle_owner',
    companyName: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { name, email, phone, whatsappNumber, password, confirmPassword, role, companyName } = formData;

    if (!name || !email || !phone || !whatsappNumber || !password || !confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Please enter a valid Indian phone number');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(whatsappNumber)) {
      toast.error('Please enter a valid Indian WhatsApp number');
      return;
    }

    setLoading(true);
    const success = await register({ 
      name, 
      email, 
      phone, 
      whatsappNumber,
      password, 
      role,
      ...(role === 'load_provider' && companyName && { companyName })
    });
    setLoading(false);

    if (success) {
      navigate('/dashboard');
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-lg w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            className="mx-auto  flex items-center justify-center shadow-xl"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
             <img src={logo} alt="Free Left" className='h-40 w-100'  />
          </motion.div>
          <h2 className="mt-6 text-4xl font-bold text-slate-900">
            Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">Free Left</span>
          </h2>
          <p className="mt-2 text-lg text-slate-600">
            Create your logistics account
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(value) => updateFormData('name', value)}
              placeholder="Enter your full name"
              leftIcon={<UserIcon className="w-5 h-5" />}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(value) => updateFormData('email', value)}
              placeholder="Enter your email"
              leftIcon={<EnvelopeIcon className="w-5 h-5" />}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(value) => updateFormData('phone', value)}
              placeholder="Enter your phone number"
              leftIcon={<PhoneIcon className="w-5 h-5" />}
              required
            />

            <Input
              label="WhatsApp Number"
              type="tel"
              value={formData.whatsappNumber}
              onChange={(value) => updateFormData('whatsappNumber', value)}
              placeholder="Enter your WhatsApp number"
              leftIcon={<PhoneIcon className="w-5 h-5" />}
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Account Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  type="button"
                  onClick={() => updateFormData('role', 'load_provider')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.role === 'load_provider'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <BuildingOfficeIcon className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-semibold">Load Provider</div>
                    <div className="text-sm text-slate-500">Post loads</div>
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => updateFormData('role', 'vehicle_owner')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.role === 'vehicle_owner'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <TruckIcon className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-semibold">Vehicle Owner</div>
                    <div className="text-sm text-slate-500">Manage vehicles</div>
                  </div>
                </motion.button>
              </div>
            </div>

            {formData.role === 'load_provider' && (
              <Input
                label="Company Name"
                value={formData.companyName}
                onChange={(value) => updateFormData('companyName', value)}
                placeholder="Enter your company name"
                leftIcon={<BuildingOfficeIcon className="w-5 h-5" />}
              />
            )}

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(value) => updateFormData('password', value)}
              placeholder="Create a password"
              leftIcon={<LockClosedIcon className="w-5 h-5" />}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(value) => updateFormData('confirmPassword', value)}
              placeholder="Confirm your password"
              leftIcon={<LockClosedIcon className="w-5 h-5" />}
              required
            />

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-8"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};