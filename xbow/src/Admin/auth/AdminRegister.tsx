import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserIcon,
  EnvelopeIcon, 
  LockClosedIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { adminAPI } from '../services/adminApi';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

interface AdminRegisterProps {
  onLoginRedirect?: () => void;
  onRegisterSuccess?: () => void;
}

export const AdminRegister: React.FC<AdminRegisterProps> = ({ 
  onLoginRedirect, 
  onRegisterSuccess 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    companyName: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.register({ 
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        companyName: formData.companyName,
        role: 'admin'
      });
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        Cookies.set('xbow_admin_token', token, { expires: 7 });
        Cookies.set('xbow_admin_user', JSON.stringify(user), { expires: 7 });
        
        toast.success('Registration successful!');
        onRegisterSuccess?.();
        window.location.href = '/admin/dashboard';
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <ShieldCheckIcon className="h-10 w-10 text-white" />
          </motion.div>
          <h2 className="mt-6 text-4xl font-bold text-white">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">XBOW</span> Admin
          </h2>
          <p className="mt-2 text-lg text-slate-300">
            Create Admin Account
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={(value) => handleChange('name', value)}
                placeholder="Enter your full name"
                leftIcon={<UserIcon className="w-5 h-5 text-slate-400" />}
                required
                className="bg-white/90"
              />
            </div>

            <div>
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(value) => handleChange('email', value)}
                placeholder="Enter admin email"
                leftIcon={<EnvelopeIcon className="w-5 h-5 text-slate-400" />}
                required
                className="bg-white/90"
              />
            </div>

            <div>
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(value) => handleChange('phone', value)}
                placeholder="Enter phone number"
                leftIcon={<PhoneIcon className="w-5 h-5 text-slate-400" />}
                required
                className="bg-white/90"
              />
            </div>

            <div>
              <Input
                label="Company Name (Optional)"
                type="text"
                value={formData.companyName}
                onChange={(value) => handleChange('companyName', value)}
                placeholder="Enter company name"
                leftIcon={<BuildingOfficeIcon className="w-5 h-5 text-slate-400" />}
                className="bg-white/90"
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(value) => handleChange('password', value)}
                placeholder="Create a password"
                leftIcon={<LockClosedIcon className="w-5 h-5 text-slate-400" />}
                required
                className="bg-white/90"
              />
            </div>

            <div>
              <Input
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(value) => handleChange('confirmPassword', value)}
                placeholder="Confirm your password"
                leftIcon={<LockClosedIcon className="w-5 h-5 text-slate-400" />}
                required
                className="bg-white/90"
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Create Admin Account
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-sm text-slate-300 text-center">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onLoginRedirect}
                className="font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                Sign in here
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};