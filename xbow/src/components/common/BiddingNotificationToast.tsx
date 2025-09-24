import React from 'react';
import { motion } from 'framer-motion';
import { FireIcon, MapPinIcon, TruckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface BiddingNotificationToastProps {
  session: {
    _id: string;
    loadId: {
      loadingLocation: { place: string; state: string };
      unloadingLocation: { place: string; state: string };
      vehicleRequirement: { vehicleType: string; size: number };
    };
    endTime: string;
  };
  onClose: () => void;
}

export const BiddingNotificationToast: React.FC<BiddingNotificationToastProps> = ({
  session,
  onClose
}) => {
  const timeRemaining = new Date(session.endTime).getTime() - new Date().getTime();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 50 }}
      className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-xl shadow-2xl max-w-sm mx-auto"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <FireIcon className="h-6 w-6" />
          </motion.div>
          <span className="font-bold text-lg">Live Bidding Started!</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <MapPinIcon className="h-4 w-4" />
          <span>{session.loadId.loadingLocation.place} → {session.loadId.unloadingLocation.place}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <TruckIcon className="h-4 w-4" />
          <span>{session.loadId.vehicleRequirement.size}ft {session.loadId.vehicleRequirement.vehicleType}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <ClockIcon className="h-4 w-4" />
          <span>{hoursRemaining}h {minutesRemaining}m remaining</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <Link
          to="/live-bidding"
          onClick={onClose}
          className="flex-1 bg-white text-red-500 px-4 py-2 rounded-lg font-medium text-center hover:bg-red-50 transition-colors"
        >
          View All Sessions
        </Link>
        <Link
          to={`/bidding/${session.loadId}`}
          onClick={onClose}
          className="flex-1 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-lg font-medium text-center hover:bg-white/30 transition-colors"
        >
          Join Bidding
        </Link>
      </div>
    </motion.div>
  );
};