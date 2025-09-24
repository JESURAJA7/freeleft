import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  EnvelopeIcon, 
  LockClosedIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { adminAPI } from '../services/adminApi';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

interface AdminLoginProps {
  onRegisterRedirect?: () => void;
  onLoginSuccess?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ 
  onRegisterRedirect, 
  onLoginSuccess 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.login({ email, password });
      console.log("Login Response:", response.data);
      if (response.data.success) {
        const { token, data: user } = response.data; 
        
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          toast.error('Access denied. Admin privileges required.');
          return;
        }
        
        Cookies.set('xbow_admin_token', token, { expires: 7 });
        Cookies.set('xbow_admin_user', JSON.stringify(user), { expires: 7 });
        
        toast.success('Login successful!');
        window.location.href = '/admin';
        onLoginSuccess?.();
        
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
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
            Secure admin access portal
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="Admin Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Enter admin email"
                leftIcon={<EnvelopeIcon className="w-5 h-5 text-slate-400" />}
                required
                className="bg-white/90"
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Enter admin password"
                leftIcon={<LockClosedIcon className="w-5 h-5 text-slate-400" />}
                required
                className="bg-white/90"
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              onClick={handleSubmit}
              fullWidth
              size="lg"
              className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Access Admin Panel
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-sm text-slate-300 text-center">
              Need an admin account?{' '}
              <button
                type="button"
                onClick={onRegisterRedirect}
                className="font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                Register here
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};