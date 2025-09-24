import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  TruckIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  MapPinIcon,
  SparklesIcon,
  BoltIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { vehicleAPI, loadAPI } from '../../services/api';
import type { Vehicle, Load, DashboardStats } from '../../types/index';
import { Button } from '../../components/common/CustomButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const VehicleOwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [availableLoads, setAvailableLoads] = useState<Load[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [vehiclesResponse, loadsResponse] = await Promise.all([
        vehicleAPI.getMyVehicles(),
        loadAPI.getAvailableLoads()
      ]);

      if (vehiclesResponse.data.success) {
        setVehicles(vehiclesResponse.data.data);
      }

      if (loadsResponse.data.success) {
        setAvailableLoads(loadsResponse.data.data);
      }

      // Calculate stats
      const vehicleData = vehiclesResponse.data.data || [];
      const dashboardStats: DashboardStats = {
        totalLoads: 0, // Not applicable for vehicle owners
        totalVehicles: vehicleData.length,
        activeLoads: vehicleData.filter((vehicle: Vehicle) => vehicle.status === 'assigned').length,
        completedLoads: 0, // Would need to track completed trips
        pendingApprovals: vehicleData.filter((vehicle: Vehicle) => !vehicle.isApproved).length,
        monthlyRevenue: 0 // Would need to calculate from completed loads
      };
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'assigned': return 'bg-yellow-100 text-yellow-700';
      case 'in_transit': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Animated Vehicle Owner Banner */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 rounded-3xl p-8 mb-8 shadow-2xl"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating Trucks */}
            <motion.div
              animate={{ 
                x: [0, 100, 0],
                y: [0, -20, 0]
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-4 left-10 opacity-20"
            >
              <TruckIcon className="h-16 w-16 text-white" />
            </motion.div>
            
            <motion.div
              animate={{ 
                x: [0, -80, 0],
                y: [0, 15, 0]
              }}
              transition={{ 
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
              className="absolute bottom-4 right-20 opacity-15"
            >
              <TruckIcon className="h-20 w-20 text-white" />
            </motion.div>

            {/* Floating Sparkles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.8
                }}
                className="absolute"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 2) * 40}%`
                }}
              >
                <SparklesIcon className="h-6 w-6 text-white opacity-40" />
              </motion.div>
            ))}

            {/* Animated Lines */}
            <motion.div
              animate={{ scaleX: [0, 1, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-0 w-full h-0.5 bg-white opacity-20"
            />
          </div>

          {/* Banner Content */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <h2 className="text-4xl font-bold text-white mb-2 flex items-center">
                  <motion.span
                    animate={{ 
                      scale: [1, 1.1, 1],
                      color: ["#ffffff", "#ff6b6b", "#ffffff"]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="mr-3 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-yellow-400"
                  >
                    Free Left
                  </motion.span>
                </h2>
                <div className="flex items-center space-x-6 text-white/90 mt-4">
                  <div className="flex items-center space-x-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </motion.div>
                    <span className="text-sm font-medium">Real-time Load Matching</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    >
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    </motion.div>
                    <span className="text-sm font-medium">Instant Payments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    >
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    </motion.div>
                    <span className="text-sm font-medium">24/7 Support</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotateY: [0, 5, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      <RocketLaunchIcon className="h-16 w-16 text-white mx-auto mb-3" />
                    </motion.div>
                    <div className="text-white font-bold text-2xl">
                      {stats?.totalVehicles || 0}
                    </div>
                    <div className="text-white/80 text-sm">Active Vehicles</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-slate-600 mt-2">
            Manage your vehicles and find available loads
          </p>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">My Vehicles</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalVehicles}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TruckIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Available</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {vehicles.filter(v => v.status === 'available').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Assigned</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.activeLoads}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Available Loads</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{availableLoads.length}</p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CurrencyRupeeIcon className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-8"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/add-vehicle">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-6 text-white cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <PlusIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Add Vehicle</h3>
                    <p className="text-emerald-100 text-sm">Register a new vehicle</p>
                  </div>
                </div>
              </motion.div>
            </Link>

            <Link to="/find-loads">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Find Loads</h3>
                    <p className="text-blue-100 text-sm">Browse available loads</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Vehicles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200"
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">My Vehicles</h2>
                <Link to="/my-vehicles">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {vehicles.slice(0, 3).map((vehicle) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-semibold text-slate-900">{vehicle.vehicleNumber}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getVehicleStatusColor(vehicle.status)}`}>
                          {vehicle.status.toUpperCase()}
                        </span>
                        {!vehicle.isApproved && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            PENDING APPROVAL
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-slate-600">
                        <span>{vehicle.vehicleType}</span>
                        <span>{vehicle.passingLimit}T</span>
                        <span>{vehicle.isOpen ? 'Open' : 'Closed'}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" icon={<EyeIcon className="h-4 w-4" />}>
                      View
                    </Button>
                  </div>
                </motion.div>
              ))}

              {vehicles.length === 0 && (
                <div className="p-12 text-center">
                  <TruckIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No vehicles registered</h3>
                  <p className="text-slate-600 mb-6">Add your first vehicle to start receiving load assignments</p>
                  <Link to="/add-vehicle">
                    <Button icon={<PlusIcon className="h-4 w-4" />}>
                      Add Your First Vehicle
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Available Loads */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200"
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Available Loads</h2>
                <Link to="/find-loads">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {availableLoads.slice(0, 3).map((load) => (
                <motion.div
                  key={load._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPinIcon className="h-4 w-4 text-slate-400" />
                        <h3 className="font-semibold text-slate-900">
                          {load.loadingLocation.place} → {load.unloadingLocation.place}
                        </h3>
                        {load.commissionApplicable && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            5% Commission
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-slate-600">
                        <span>Vehicle: {load.vehicleRequirement.size}ft</span>
                        <span>Payment: {load.paymentTerms.toUpperCase()}</span>
                        <span>Posted: {new Date(load.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" icon={<EyeIcon className="h-4 w-4" />}>
                      View
                    </Button>
                  </div>
                </motion.div>
              ))}

              {availableLoads.length === 0 && (
                <div className="p-12 text-center">
                  <DocumentTextIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No loads available</h3>
                  <p className="text-slate-600">Check back later for new load postings</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};