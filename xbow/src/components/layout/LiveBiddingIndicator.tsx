import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FireIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useBiddingNotifications } from '../../hooks/useBiddingNotifications';
import { useAuth } from '../../contexts/AuthContext';

export const LiveBiddingIndicator: React.FC = () => {
  const { user } = useAuth();
  const { activeSessions } = useBiddingNotifications();

  if (!user || activeSessions === 0) return null;

  return (
    <Link to="/live-bidding" className="relative">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <FireIcon className="h-4 w-4" />
        </motion.div>
        <span>Live Bidding</span>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="bg-white text-red-500 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold"
        >
          {activeSessions}
        </motion.div>
      </motion.div>
      
      {/* Pulsing effect */}
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full -z-10"
      />
    </Link>
  );
};