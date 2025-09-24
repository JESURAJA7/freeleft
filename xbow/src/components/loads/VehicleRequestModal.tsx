import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TruckIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { Modal } from '../common/Modal';
import { Button } from '../common/CustomButton';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { vehicleMatchingAPI } from '../../services/api';
import type { VehicleRequest } from '../../types/index';
import toast from 'react-hot-toast';

interface VehicleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestResponded: () => void;
}

export const VehicleRequestModal: React.FC<VehicleRequestModalProps> = ({
  isOpen,
  onClose,
  onRequestResponded
}) => {
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchVehicleRequests();
    }
  }, [isOpen]);

  const fetchVehicleRequests = async () => {
    try {
      setLoading(true);
      const response = await vehicleMatchingAPI.getVehicleRequests();
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicle requests:', error);
      toast.error('Failed to fetch vehicle requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      setResponding(requestId);
      await vehicleMatchingAPI.respondToVehicleRequest(requestId, status);
      toast.success(`Request ${status} successfully!`);
      
      setRequests(prev => prev.map(req => 
        req._id === requestId 
          ? { ...req, status, respondedAt: new Date().toISOString() }
          : req
      ));
      
      onRequestResponded();
    } catch (error: any) {
      console.error('Error responding to request:', error);
      toast.error(error.response?.data?.message || `Failed to ${status} request`);
    } finally {
      setResponding(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return ClockIcon;
      case 'accepted': return CheckCircleIcon;
      case 'rejected': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl" fullScreen>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Vehicle Requests</h2>
              <p className="text-emerald-100">
                Load providers requesting your vehicles
              </p>
            </div>
            <div className="text-right">
              <p className="text-emerald-100 text-sm">Total Requests</p>
              <p className="text-white font-semibold text-2xl">{requests.length}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="xl" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16">
              <TruckIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Vehicle Requests</h3>
              <p className="text-slate-600">You haven't received any vehicle requests yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Pending Requests ({pendingRequests.length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {pendingRequests.map((request) => (
                      <RequestCard
                        key={request._id}
                        request={request}
                        onRespond={handleRespondToRequest}
                        responding={responding}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Requests */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  All Requests ({requests.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {requests.map((request) => (
                    <RequestCard
                      key={request._id}
                      request={request}
                      onRespond={handleRespondToRequest}
                      responding={responding}
                      showActions={request.status === 'pending'}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

interface RequestCardProps {
  request: VehicleRequest;
  onRespond: (requestId: string, status: 'accepted' | 'rejected') => void;
  responding: string | null;
  showActions?: boolean;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onRespond,
  responding,
  showActions = true
}) => {
  const StatusIcon = getStatusIcon(request.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
    >
      {/* Request Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{request.loadProviderName}</h3>
              <p className="text-sm text-slate-600">Load Provider</p>
            </div>
          </div>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(request.status)}`}>
            <StatusIcon className="h-3 w-3" />
            <span className="capitalize">{request.status}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Sent: {new Date(request.sentAt).toLocaleDateString()}</span>
          <span>Vehicle: {request?.vehicle?.vehicleNumber || "N/A"}</span>
        </div>
      </div>

      <div className="p-4">
        {/* Load Details */}
        <div className="mb-4">
          <h4 className="font-semibold text-slate-900 mb-3">Load Details</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPinIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-slate-900">
                {request?.load?.loadingLocation?.place} → {request?.load?.unloadingLocation?.place}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-slate-900">
                {new Date(request?.load?.loadingDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <TruckIcon className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-slate-900">
                {request?.load?.vehicleRequirement?.size}ft {request?.load?.vehicleRequirement?.vehicleType}
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        {request.message && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-blue-800">"{request.message}"</p>
          </div>
        )}

        {/* Actions */}
        {showActions && request.status === 'pending' && (
          <div className="flex space-x-3">
            <Button
              onClick={() => onRespond(request._id, 'accepted')}
              loading={responding === request._id}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              icon={<CheckCircleIcon className="h-4 w-4" />}
            >
              Accept
            </Button>
            <Button
              onClick={() => onRespond(request._id, 'rejected')}
              loading={responding === request._id}
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              icon={<XCircleIcon className="h-4 w-4" />}
            >
              Reject
            </Button>
          </div>
        )}

        {request.status !== 'pending' && (
          <div className={`text-center py-2 rounded-xl ${getStatusColor(request.status)}`}>
            <span className="text-sm font-medium capitalize">Request {request.status}</span>
            {request.respondedAt && (
              <p className="text-xs opacity-75 mt-1">
                on {new Date(request.respondedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
    case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return ClockIcon;
    case 'accepted': return CheckCircleIcon;
    case 'rejected': return XCircleIcon;
    default: return ClockIcon;
  }
};
