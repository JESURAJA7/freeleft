import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  TruckIcon, 
  Bars3Icon, 
  XMarkIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/CustomButton';
import Logo from '../../assets/freeleft_logo.png';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
      if (!target.closest('.mobile-menu')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigation = user?.role === 'load_provider' 
    ? [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Post Load', href: '/post-load' },
        { name: 'My Loads', href: '/my-loads' },
        { name: 'Bidding', href: '/bidding-info' },
        { name: 'Live Bidding', href: '/live-bidding' },
        { name: 'Load Progress', href: '/load-progress-list' },
      ]
    : [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Find Loads', href: '/find-loads' },
        { name: 'Add Vehicle', href: '/add-vehicle' },
        { name: 'My Vehicles', href: '/my-vehicles' },
        { name: 'Bidding', href: '/bidding-info' },
        { name: 'Live Bidding', href: '/live-bidding' },
        { name: 'Vehicle Progress', href: '/load-progress-list' },
      ];

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  // Restart animation when route changes
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [location.pathname]);

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
      {/* Animated Truck Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none h-20">
        <motion.div
          key={animationKey}
          initial={{ x: '-100%' }}
          animate={{ x: '100vw' }}
          transition={{
            duration: 15,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop"
          }}
          className="absolute top-1/2 -translate-y-1/2"
        >
          <div className="relative">
            {/* Truck with container */}
            <div className="flex items-center">
              {/* Truck cabin */}
              <div className="relative z-10">
                <TruckIcon className="h-8 w-12 text-blue-600" />
              </div>
              
              {/* Container */}
              <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-6 w-16 -ml-2 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">FREE LEFT</span>
              </div>
            </div>
            
            {/* Road line effect */}
            <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gray-300"></div>
          </div>
        </motion.div>

        {/* Additional decorative elements */}
        <div className="absolute top-1/4 left-1/4 opacity-10">
          <TruckIcon className="h-16 w-16 text-blue-400 rotate-45" />
        </div>
        <div className="absolute bottom-1/4 right-1/4 opacity-10">
          <TruckIcon className="h-20 w-20 text-emerald-400 -rotate-45" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3">
            <img src={Logo} alt="Free Left" className="h-[100px] w-[180px]" />
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
              Free Left
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors relative z-10 ${
                  location.pathname === item.href
                    ? 'text-blue-600 bg-blue-50/80 backdrop-blur-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50/80 backdrop-blur-sm'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Admin Login Link - Only show if user is not logged in or is admin */}
            {(!user || user.role === 'admin') && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center relative z-10 ${
                  location.pathname === '/admin'
                    ? 'text-purple-600 bg-purple-50/80 backdrop-blur-sm'
                    : 'text-slate-700 hover:text-purple-600 hover:bg-slate-50/80 backdrop-blur-sm'
                }`}
              >
                <ShieldCheckIcon className="h-4 w-4 mr-1" />
                Admin
              </Link>
            )}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4 relative">
            <button className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100/80 backdrop-blur-sm transition-colors">
              <BellIcon className="h-6 w-6" />
            </button>
            
            {user ? (
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100/80 backdrop-blur-sm transition-colors border border-transparent hover:border-slate-200"
                >
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-600 capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                  <UserCircleIcon className="h-8 w-8 text-slate-600" />
                  <ChevronDownIcon className={`h-4 w-4 text-slate-600 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 py-2 z-50"
                      style={{ position: 'fixed' }}
                    >
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50/80 backdrop-blur-sm transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      <Link
                        to="/subscription"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50/80 backdrop-blur-sm transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Subscription
                      </Link>
                      <hr className="my-2 border-slate-200" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50/80 backdrop-blur-sm flex items-center space-x-2 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/admin"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors flex items-center relative z-10"
              >
                <ShieldCheckIcon className="h-4 w-4 mr-1" />
                Admin Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden relative z-10 mobile-menu">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 backdrop-blur-sm transition-colors"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white/95 backdrop-blur-sm border-t border-slate-200 relative z-50 mobile-menu"
          >
            <div className="px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'text-blue-600 bg-blue-50/80 backdrop-blur-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50/80 backdrop-blur-sm'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Admin Login Link in Mobile Menu */}
              {(!user || user.role === 'admin') && (
                <Link
                  to="/admin"
                  className={`block px-3 py-2 rounded-lg text-base font-medium flex items-center transition-colors ${
                    location.pathname === '/admin'
                      ? 'text-purple-600 bg-purple-50/80 backdrop-blur-sm'
                      : 'text-slate-700 hover:text-purple-600 hover:bg-slate-50/80 backdrop-blur-sm'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  Admin
                </Link>
              )}
              
              <hr className="my-4 border-slate-200" />
              {user ? (
                <>
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-600 capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50/80 backdrop-blur-sm transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile Settings
                  </Link>
                  <Link
                    to="/subscription"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50/80 backdrop-blur-sm transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Subscription
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full mt-4 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-base font-medium transition-colors flex items-center justify-center border border-red-200"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/admin"
                  className="block w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors text-center flex items-center justify-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShieldCheckIcon className="h-4 w-4 mr-1" />
                  Admin Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};