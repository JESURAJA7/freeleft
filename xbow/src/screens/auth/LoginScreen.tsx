import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TruckIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  XMarkIcon,
  UserIcon,
  BuildingStorefrontIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import toast from 'react-hot-toast';
import logo from '../../assets/WhatsApp Image 2025-09-08 at 00.16.58_e20dd409.jpg';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (success) {
      navigate('/dashboard');
    }
  };

  // Function to handle demo login with specific role
  const handleDemoLogin = (role: string) => {
    let demoEmail = '';
    let demoPassword = 'admin@4345';
    
    switch(role) {
      case 'load_provider':
        demoEmail = 'xbow@gmail.com';
        break;
      case 'vehicle_owner':
        demoEmail = 'owner@gmail.com';
        break;
      case 'parcel&courier':
        demoEmail = 'xbow@gmail.com';
        break;
      default:
        demoEmail = 'xbow@gmail.com';
    }
    
    setEmail(demoEmail);
    setPassword(demoPassword);
    setShowDemoModal(false);
    
    // Submit the form programmatically after a small delay
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
    }, 100);
  };

  // Demo role options
  const demoRoles = [
    {
      id: 'load_provider',
      title: 'Load Provider',
      description: 'Post loads and find vehicles for transportation',
      icon: <TruckIcon className="w-8 h-8" />
    },
    {
      id: 'vehicle_owner',
      title: 'Vehicle Owner',
      description: 'Find loads for your available vehicles',
      icon: <UserIcon className="w-8 h-8" />
    },
    {
      id: 'parcel&courier',
      title: 'Parcel & Courier',
      description: 'Manage parcel deliveries and courier services',
      icon: <BuildingStorefrontIcon className="w-8 h-8" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            className="mx-auto flex items-center justify-center shadow-xl"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img src={logo} alt="Free Left" className='h-40 w-150'  />
          </motion.div>
          <h2 className="mt-6 text-4xl font-bold text-slate-900">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">Free Left </span>
          </h2>
          <p className="mt-2 text-lg text-slate-600">
            Sign in to your logistics account
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
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="Enter your email"
              leftIcon={<EnvelopeIcon className="w-5 h-5" />}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
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
              Sign In
            </Button>
          </form>

          <div className="mt-6">
            <Button
              onClick={() => setShowDemoModal(true)}
              fullWidth
              variant="outline"
              size="lg"
              className="bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              Use Demo Account
            </Button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>

          {/* Admin Login Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500">
              Are you an admin?{' '}
              <Link
                to="/admin_login"
                className="font-semibold text-purple-600 hover:text-purple-700 transition-colors"
              >
                Admin Login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Demo Account Selection Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDemoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800">Select Role</h3>
                <button
                  onClick={() => setShowDemoModal(false)}
                  className="text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <p className="text-slate-600 mb-6">
                Choose a demo role to experience XBOW from different perspectives
              </p>

              <div className="space-y-4">
                {demoRoles.map((role) => (
                  <motion.button
                    key={role.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-start p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left"
                    onClick={() => handleDemoLogin(role.id)}
                  >
                    <div className="bg-blue-100 p-3 rounded-lg text-blue-600 mr-4">
                      {role.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{role.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{role.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-6 text-center text-sm text-slate-500">
              
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};