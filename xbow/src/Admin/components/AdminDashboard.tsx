import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TruckIcon,
  DocumentTextIcon,
  CreditCardIcon,
  BanknotesIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/CustomButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { adminAPI } from '../services/adminApi';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalLoads: number;
  totalVehicles: number;
  activeSubscriptions: {
    loadProviders: number;
    vehicleOwners: number;
  };
  paymentsReceived: {
    today: number;
    thisMonth: number;
    total: number;
  };
  pendingApprovals: {
    users: number;
    vehicles: number;
    pods: number;
  };
  commission: {
    thisMonth: number;
    total: number;
  };
  trialUsers: number;
}

interface AdminSettings {
  subscriptionEnabled: boolean;
  trialEnabled: boolean;
  trialDays: number;
  loadProviderAccess: boolean;
  vehicleOwnerAccess: boolean;
  loadProviderFee: number;
  vehicleOwnerFee: number;
  commissionRate: number;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, settingsResponse] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getAdminSettings()
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (settingsResponse.data.success) {
        setSettings(settingsResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async () => {
    if (!settings) return;

    setUpdatingSettings(true);
    try {
      const response = await adminAPI.updateAdminSettings(settings);
      if (response.data.success) {
        toast.success('Settings updated successfully');
        setIsSettingsModalOpen(false);
      }
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const downloadReport = async (type: string) => {
    try {
      const response = await adminAPI.generateReport(type);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate report');
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900">XBOW Admin Dashboard</h1>
            <p className="text-slate-600 mt-2">Welcome back, {user?.name}</p>
          </div>
          <Button
            onClick={() => setIsSettingsModalOpen(true)}
            variant="outline"
            icon={<CogIcon className="h-5 w-5" />}
          >
            Settings
          </Button>
        </motion.div>

        {/* Stats Grid */}
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
                  <p className="text-slate-600 text-sm font-medium">Total Vehicles</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalVehicles}</p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <TruckIcon className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Active Subscriptions</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {stats.activeSubscriptions.loadProviders + stats.activeSubscriptions.vehicleOwners}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <CreditCardIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    ₹{(stats.paymentsReceived.thisMonth / 100000).toFixed(1)}L
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <BanknotesIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending Approvals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-orange-500" />
              Pending Approvals
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">New Users</span>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                  {stats?.pendingApprovals.users || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Vehicles</span>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                  {stats?.pendingApprovals.vehicles || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">PODs</span>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                  {stats?.pendingApprovals.pods || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white">
            <h3 className="text-lg font-semibold mb-4">Revenue Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Today</span>
                <span className="font-semibold">₹{stats?.paymentsReceived.today.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-100">This Month</span>
                <span className="font-semibold">₹{stats?.paymentsReceived.thisMonth.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between border-t border-blue-400 pt-3">
                <span className="text-blue-100">Total</span>
                <span className="font-bold text-lg">₹{((stats?.paymentsReceived.total || 0) / 10000000).toFixed(1)}Cr</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white">
            <h3 className="text-lg font-semibold mb-4">Commission Earned</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-emerald-100">This Month</span>
                <span className="font-semibold">₹{stats?.commission.thisMonth.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between border-t border-emerald-400 pt-3">
                <span className="text-emerald-100">Total</span>
                <span className="font-bold text-lg">₹{((stats?.commission.total || 0) / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-8"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => window.location.href = '/admin/users'}
              variant="outline"
              className="h-20 flex-col"
              icon={<UsersIcon className="h-6 w-6" />}
            >
              Manage Users
            </Button>
            <Button
              onClick={() => window.location.href = '/admin/vehicles'}
              variant="outline"
              className="h-20 flex-col"
              icon={<TruckIcon className="h-6 w-6" />}
            >
              Manage Vehicles
            </Button>
            <Button
              onClick={() => window.location.href = '/admin/loads'}
              variant="outline"
              className="h-20 flex-col"
              icon={<DocumentTextIcon className="h-6 w-6" />}
            >
              Manage Loads
            </Button>
            <Button
              onClick={() => window.location.href = '/admin/commission'}
              variant="outline"
              className="h-20 flex-col"
              icon={<ChartBarIcon className="h-6 w-6" />}
            >
              Commission Reports
            </Button>
          </div>
        </motion.div>

        {/* Reports Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-6">Download Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => downloadReport('subscription')}
              variant="secondary"
              icon={<CreditCardIcon className="h-4 w-4" />}
            >
              Subscription Report
            </Button>
            <Button
              onClick={() => downloadReport('commission')}
              variant="secondary"
              icon={<ChartBarIcon className="h-4 w-4" />}
            >
              Commission Report
            </Button>
            <Button
              onClick={() => downloadReport('load-history')}
              variant="secondary"
              icon={<DocumentTextIcon className="h-4 w-4" />}
            >
              Load History
            </Button>
            <Button
              onClick={() => downloadReport('pod-status')}
              variant="secondary"
              icon={<CheckCircleIcon className="h-4 w-4" />}
            >
              POD Status Report
            </Button>
          </div>
        </motion.div>

        {/* Settings Modal */}
        <Modal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          title="Admin Settings"
          size="lg"
        >
          {settings && (
            <div className="space-y-6">
              {/* Subscription Settings */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Subscription Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.subscriptionEnabled}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, subscriptionEnabled: e.target.checked } : null)}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-slate-700 font-medium">Enable Subscriptions</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.trialEnabled}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, trialEnabled: e.target.checked } : null)}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-slate-700 font-medium">Enable Free Trial</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Trial Days</label>
                    <input
                      type="number"
                      value={settings.trialDays}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, trialDays: Number(e.target.value) } : null)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Commission Rate (%)</label>
                    <input
                      type="number"
                      value={settings.commissionRate}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, commissionRate: Number(e.target.value) } : null)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Access Control */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Access Control</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.loadProviderAccess}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, loadProviderAccess: e.target.checked } : null)}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-slate-700 font-medium">Load Provider Access</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.vehicleOwnerAccess}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, vehicleOwnerAccess: e.target.checked } : null)}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-slate-700 font-medium">Vehicle Owner Access</span>
                  </label>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Load Provider Fee (₹/month)</label>
                    <input
                      type="number"
                      value={settings.loadProviderFee}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, loadProviderFee: Number(e.target.value) } : null)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Owner Fee (₹/vehicle/month)</label>
                    <input
                      type="number"
                      value={settings.vehicleOwnerFee}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, vehicleOwnerFee: Number(e.target.value) } : null)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
                <Button
                  onClick={() => setIsSettingsModalOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateSettings}
                  loading={updatingSettings}
                >
                  Save Settings
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};