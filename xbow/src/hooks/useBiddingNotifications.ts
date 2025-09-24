import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from './useSocket';
import { biddingAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useBiddingNotifications = () => {
  const { user } = useAuth();
  const { socket, onNewBiddingSession, onBiddingClosed, offNewBiddingSession, offBiddingClosed } = useSocket();
  const [activeSessions, setActiveSessions] = useState<number>(0);

  useEffect(() => {
    if (user?.role === 'vehicle_owner') {
      // Fetch initial active sessions count
      fetchActiveSessionsCount();

      // Listen for new bidding sessions
      onNewBiddingSession((session: any) => {
        setActiveSessions(prev => prev + 1);
        
        // Show toast notification
        toast.success(
          `🔥 Live bidding started!\n${session.loadId?.loadingLocation?.place} → ${session.loadId?.unloadingLocation?.place}`,
          {
            duration: 5000,
            style: {
              background: '#10B981',
              color: 'white',
              fontWeight: 'bold',
            },
            icon: '🚛',
          }
        );
      });

      // Listen for closed bidding sessions
      onBiddingClosed((sessionId: string) => {
        setActiveSessions(prev => Math.max(0, prev - 1));
        toast('A bidding session has ended', {
          duration: 3000,
          icon: '⏰',
        });
      });

      return () => {
        offNewBiddingSession();
        offBiddingClosed();
      };
    }
  }, [user]);

  const fetchActiveSessionsCount = async () => {
    try {
      const response = await biddingAPI.getActiveBiddingSessions();
      if (response.data.success) {
        setActiveSessions(response.data.data.length);
      }
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    }
  };

  return {
    activeSessions,
    refreshActiveSessions: fetchActiveSessionsCount
  };
};