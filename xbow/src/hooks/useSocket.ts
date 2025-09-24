import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      socketRef.current = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      // Join user room for personalized notifications
      socketRef.current.emit('join-user-room', user.id);

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user]);

  const joinBiddingRoom = (sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-bidding-room', sessionId);
    }
  };

  const leaveBiddingRoom = (sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-bidding-room', sessionId);
    }
  };

  const onNewBid = (callback: (bid: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('new-bid', callback);
    }
  };

  const onBiddingClosed = (callback: (sessionId: string) => void) => {
    if (socketRef.current) {
      socketRef.current.on('bidding-closed', callback);
    }
  };

  const onTransportRequest = (callback: (request: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('transport-request', callback);
    }
  };

  const onNewBiddingSession = (callback: (session: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('new-bidding-session', callback);
    }
  };
  const offNewBid = () => {
    if (socketRef.current) {
      socketRef.current.off('new-bid');
    }
  };

  const offBiddingClosed = () => {
    if (socketRef.current) {
      socketRef.current.off('bidding-closed');
    }
  };

  const offTransportRequest = () => {
    if (socketRef.current) {
      socketRef.current.off('transport-request');
    }
  };

  const offNewBiddingSession = () => {
    if (socketRef.current) {
      socketRef.current.off('new-bidding-session');
    }
  };
  return {
    socket: socketRef.current,
    joinBiddingRoom,
    leaveBiddingRoom,
    onNewBid,
    onBiddingClosed,
    onTransportRequest,
    onNewBiddingSession,
    offNewBid,
    offBiddingClosed,
    offTransportRequest,
    offNewBiddingSession
  };
};