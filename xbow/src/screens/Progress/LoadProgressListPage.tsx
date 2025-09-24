import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Truck,
  Calendar,
  Package,
  User,
  ArrowRight,
  Image as ImageIcon,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { loadAPI, vehicleAPI, loadAssignmentAPI } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { Load, Vehicle } from '../../types';
import toast from 'react-hot-toast';

interface LoadAssignment {
  _id: string;
  loadId: Load;
  vehicleId: Vehicle;
  loadProviderId: string;
  vehicleOwnerId: string;
  applicationId?: string;
  agreedPrice: number;
  status: 'assigned' | 'enroute' | 'delivered' | 'completed';
  startedAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const LoadProgressListPage: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<LoadAssignment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'vehicle_owner') {
      fetchVehicleOwnerData();
    } else {
      fetchLoadProviderData();
    }
  }, [user?.role]);

  // 🔹 Vehicle Owner: fetch assignments + vehicles
  const fetchVehicleOwnerData = async () => {
    try {
      setLoading(true);

      const [assignmentsRes, vehiclesRes] = await Promise.all([
        loadAssignmentAPI.getMyAssignments(),
        vehicleAPI.getMyVehicles(),
      ]);

      if (assignmentsRes.data.success) {
        setAssignments(assignmentsRes.data.data);
      }
      if (vehiclesRes.data.success) {
        setVehicles(vehiclesRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching vehicle owner data:", error);
      toast.error("Failed to load vehicle/assignments");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Load Provider: fetch loads
  const fetchLoadProviderData = async () => {
    try {
      setLoading(true);
      const response = await loadAPI.getMyLoads();
      if (response.data.success) {
        setLoads(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching loads:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Update assignment status (for vehicle owners)
  const updateAssignmentStatus = async (assignmentId: string, newStatus: string) => {
    try {
      const response = await loadAssignmentAPI.updateAssignmentStatus(assignmentId, newStatus);
      if (response.data.success) {
        fetchVehicleOwnerData(); // refresh
        toast.success(`Status updated to ${newStatus}`);
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating assignment status:', error);
      toast.error('Failed to update status');
    }
  };

  // 🔹 Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'enroute': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // 🔹 Assigned vehicles (with active assignment merged)
  const getAssignedVehicles = () => {
    const activeAssignments = assignments.filter(a =>
      ['assigned', 'enroute', 'delivered'].includes(a.status)
    );

    return vehicles
      .map(vehicle => {
        const assignment = activeAssignments.find(a => a.vehicleId?._id === vehicle._id);
        return assignment ? { vehicle, assignment } : null;
      })
      .filter(Boolean) as { vehicle: Vehicle; assignment: LoadAssignment }[];
  };

  // 🔹 Assigned loads for providers
  const getAssignedLoads = () => {
    return loads.filter(load =>
      ['assigned', 'enroute', 'delivered'].includes(load.status) &&
      load.assignedVehicleId
    );
  };

  const displayData =
    user?.role === 'vehicle_owner' ? getAssignedVehicles() : getAssignedLoads();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {user?.role === 'vehicle_owner' ? 'My Assigned Vehicles' : 'Assigned Loads'}
          </h1>
          <p className="text-slate-600">
            {displayData.length} active {user?.role === 'vehicle_owner' ? 'vehicle' : 'load'}{displayData.length !== 1 ? 's' : ''} in progress
          </p>
        </div>

        {/* Empty State */}
        {displayData.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No Active {user?.role === 'vehicle_owner' ? 'Assignments' : 'Loads'}
              </h3>
              <p className="text-slate-600 mb-4">
                You don't have any active {user?.role === 'vehicle_owner' ? 'assigned vehicles' : 'loads'} at the moment.
              </p>
              <Link
                to="/loads"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                Browse available loads <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {user?.role === 'vehicle_owner' ? (
              // 🔹 Vehicle Owner View: Assigned Vehicles
              getAssignedVehicles().map(({ vehicle, assignment }, index) => (
                <motion.div
                  key={vehicle._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:scale-105">
                    {/* Vehicle Image */}
                    <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                      {vehicle.photos?.[0]?.url ? (
                        <img
                          src={vehicle.photos[0].url}
                          alt={`Vehicle ${vehicle.vehicleNumber}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
                          <Truck className="h-10 w-10 text-blue-500 mb-2" />
                          <p className="text-sm font-semibold">{vehicle.vehicleNumber}</p>
                          <p className="text-xs text-slate-600">
                            {vehicle.vehicleSize}ft {vehicle.vehicleType}
                          </p>
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${getStatusColor(assignment.status)}`}>
                          {assignment.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Price Badge */}
                      <div className="absolute top-4 left-4">
                        <div className="bg-green-100 border-2 border-green-200 px-3 py-1 rounded-full">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3 text-green-700" />
                            <span className="text-xs font-medium text-green-800">
                              ₹{assignment.agreedPrice?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle + Load Info */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{vehicle.vehicleNumber}</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        {vehicle.vehicleSize}ft {vehicle.vehicleType}
                      </p>

                      {/* Route */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-slate-900 text-sm">Route</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-700 truncate">{assignment.loadId?.loadingLocation?.place}</span>
                          <ArrowRight className="h-4 w-4 text-slate-400 mx-2" />
                          <span className="text-slate-700 truncate">{assignment.loadId?.unloadingLocation?.place}</span>
                        </div>
                      </div>

                      {/* Loading Date */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-slate-700">Loading Date</span>
                        </div>
                        <p className="text-sm text-slate-600 ml-6">
                          {assignment.loadId?.loadingDate ? new Date(assignment.loadId.loadingDate).toLocaleDateString() : 'Not specified'}
                          {assignment.loadId?.loadingTime && (
                            <span className="ml-2 text-xs">• {assignment.loadId.loadingTime}</span>
                          )}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex flex-col space-y-3 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-slate-500" />
                            <span className="text-sm text-slate-700">Load Provider</span>
                          </div>
                          <Link
                            to={`/load-progress/${assignment.loadId?._id}`}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                          >
                            <span className="text-sm font-medium">View Progress</span>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          {assignment.status === 'assigned' && (
                            <button
                              onClick={() => updateAssignmentStatus(assignment._id, 'enroute')}
                              className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 flex-1"
                            >
                              Start Journey
                            </button>
                          )}
                          {assignment.status === 'enroute' && (
                            <button
                              onClick={() => updateAssignmentStatus(assignment._id, 'delivered')}
                              className="px-3 py-1 rounded bg-orange-600 text-white text-xs hover:bg-orange-700 flex-1"
                            >
                              Mark Delivered
                            </button>
                          )}
                          {assignment.status === 'delivered' && (
                            <button
                              onClick={() => updateAssignmentStatus(assignment._id, 'completed')}
                              className="px-3 py-1 rounded bg-emerald-600 text-white text-xs hover:bg-emerald-700 flex-1"
                            >
                              Complete Load
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              // 🔹 Load Provider View (keep your existing load rendering)
              getAssignedLoads().map((load, index) => (
                <motion.div
                  key={load._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:scale-105">

                    {/* Header with Material */}
                    <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                      {load.photos?.[0]?.url ? (
                        <img
                          src={load.photos[0].url}
                          alt={load.materials?.[0]?.name || 'Load material'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                          <ImageIcon className="h-12 w-12 text-slate-400" />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${getStatusColor(load.status)}`}>
                          {load.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Route */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-slate-900 text-sm">Route</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-700 truncate">{load.loadingLocation.place}</span>
                          <ArrowRight className="h-4 w-4 text-slate-400 mx-2" />
                          <span className="text-slate-700 truncate">{load.unloadingLocation.place}</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex flex-col space-y-3 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-slate-500" />
                            <span className="text-sm text-slate-700">Vehicle Owner</span>
                          </div>
                          <Link
                            to={`/load-progress/${load._id}`}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                          >
                            <span className="text-sm font-medium">View Progress</span>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
