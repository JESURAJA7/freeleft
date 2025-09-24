import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  DocumentTextIcon,
  TruckIcon,
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  GlobeAltIcon,
  ChartBarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { loadAPI } from '../../services/api';
import type { Load, DashboardStats } from '../../types/index';
import { Button } from '../../components/common/CustomButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const LoadProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const loadsResponse = await loadAPI.getMyLoads();
      if (loadsResponse.data.success) {
        setLoads(loadsResponse.data.data);
        
        // Calculate stats from loads data
        const loadData = loadsResponse.data.data;
        const dashboardStats: DashboardStats = {
          totalLoads: loadData.length,
          totalVehicles: 0, // Not applicable for load providers
          activeLoads: loadData.filter((load: Load) => ['posted', 'assigned', 'enroute'].includes(load.status)).length,
          completedLoads: loadData.filter((load: Load) => load.status === 'completed').length,
          pendingApprovals: loadData.filter((load: Load) => load.status === 'posted').length,
          monthlyRevenue: loadData.filter((load: Load) => load.commissionApplicable).reduce((sum: number, load: Load) => sum + (load.commissionAmount || 0), 0)
        };
        setStats(dashboardStats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-blue-100 text-blue-700';
      case 'assigned': return 'bg-yellow-100 text-yellow-700';
      case 'enroute': return 'bg-orange-100 text-orange-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-slate-100 text-slate-700';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Animated Load Provider Banner */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 mb-8 shadow-2xl"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating Documents */}
            <motion.div
              animate={{ 
                x: [0, 120, 0],
                y: [0, -25, 0],
                rotate: [0, 10, 0]
              }}
              transition={{ 
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-6 left-16 opacity-20"
            >
              <DocumentTextIcon className="h-14 w-14 text-white" />
            </motion.div>
            
            <motion.div
              animate={{ 
                x: [0, -90, 0],
                y: [0, 20, 0],
                rotate: [0, -15, 0]
              }}
              transition={{ 
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 3
              }}
              className="absolute bottom-8 right-24 opacity-15"
            >
              <ChartBarIcon className="h-18 w-18 text-white" />
            </motion.div>

            {/* Network Connections */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <GlobeAltIcon className="h-32 w-32 text-white opacity-10" />
            </motion.div>

            {/* Floating Stars */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -40, 0],
                  opacity: [0.2, 0.8, 0.2],
                  scale: [0.8, 1.3, 0.8],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 4 + i * 0.3,
                  repeat: Infinity,
                  delay: i * 0.6
                }}
                className="absolute"
                style={{
                  left: `${15 + i * 12}%`,
                  top: `${25 + (i % 3) * 25}%`
                }}
              >
                <StarIcon className="h-5 w-5 text-white opacity-30" />
              </motion.div>
            ))}

            {/* Animated Gradient Overlay */}
            <motion.div
              animate={{ 
                background: [
                  'linear-gradient(45deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                  'linear-gradient(45deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)'
                ]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0"
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
                      animate={{ 
                        boxShadow: [
                          '0 0 0 0 rgba(34, 197, 94, 0.7)',
                          '0 0 0 10px rgba(34, 197, 94, 0)',
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-3 h-3 bg-green-400 rounded-full"
                    />
                    <span className="text-sm font-medium">Smart Matching</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <motion.div
                      animate={{ 
                        boxShadow: [
                          '0 0 0 0 rgba(59, 130, 246, 0.7)',
                          '0 0 0 10px rgba(59, 130, 246, 0)',
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="w-3 h-3 bg-blue-400 rounded-full"
                    />
                    <span className="text-sm font-medium">Real-time Tracking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <motion.div
                      animate={{ 
                        boxShadow: [
                          '0 0 0 0 rgba(251, 191, 36, 0.7)',
                          '0 0 0 10px rgba(251, 191, 36, 0)',
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      className="w-3 h-3 bg-yellow-400 rounded-full"
                    />
                    <span className="text-sm font-medium">Cost Optimization</span>
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
                    y: [0, -15, 0],
                    rotateX: [0, 5, 0]
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <DocumentTextIcon className="h-16 w-16 text-white mx-auto mb-3" />
                    </motion.div>
                    <div className="text-white font-bold text-2xl">
                      {stats?.totalLoads || 0}
                    </div>
                    <div className="text-white/80 text-sm">Total Loads</div>
                  </div>
                </motion.div>

                {/* Floating Revenue Card */}
                <motion.div
                  animate={{ 
                    x: [0, 10, 0],
                    y: [0, -5, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="absolute -bottom-4 -right-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-3 shadow-lg"
                >
                  <div className="text-center">
                    <CurrencyRupeeIcon className="h-8 w-8 text-white mx-auto mb-1" />
                    <div className="text-white font-bold text-sm">
                      ₹{((stats?.monthlyRevenue || 0) / 1000).toFixed(0)}K
                    </div>
                    <div className="text-white/80 text-xs">Revenue</div>
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
            Manage your loads and track your logistics operations
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
                  <p className="text-slate-600 text-sm font-medium">Total Loads</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalLoads}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Active Loads</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.activeLoads}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <TruckIcon className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.completedLoads}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Commission</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">₹{(stats.monthlyRevenue ?? 0).toLocaleString()}</p>
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
            <Link to="/post-load">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <PlusIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Post New Load</h3>
                    <p className="text-blue-100 text-sm">Create a new load posting</p>
                  </div>
                </div>
              </motion.div>
            </Link>

            <Link to="/my-loads">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-6 text-white cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Manage Loads</h3>
                    <p className="text-emerald-100 text-sm">View and track your loads</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* Recent Loads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200"
        >
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Recent Loads</h2>
              <Link to="/my-loads">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {loads.slice(0, 5).map((load) => (
              <motion.div
                key={load._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="font-semibold text-slate-900">
                        {load.loadingLocation.place} → {load.unloadingLocation.place}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(load.status)}`}>
                        {load.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-slate-600">
                    <span>Vehicle: {load.vehicleRequirement.size}ft {load.vehicleRequirement.vehicleType}</span>

                     <span>Materials: {load.materials?.length ?? 0}</span>

                      <span>Posted: {new Date(load.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" icon={<EyeIcon className="h-4 w-4" />}>
                    View
                  </Button>
                </div>
              </motion.div>
            ))}

            {loads.length === 0 && (
              <div className="p-12 text-center">
                <DocumentTextIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No loads posted yet</h3>
                <p className="text-slate-600 mb-6">Start by posting your first load to connect with vehicle owners</p>
                <Link to="/post-load">
                  <Button icon={<PlusIcon className="h-4 w-4" />}>
                    Post Your First Load
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};