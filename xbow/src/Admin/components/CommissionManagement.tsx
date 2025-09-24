import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CurrencyRupeeIcon,
  DocumentTextIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  ChartBarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/common/CustomButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { adminAPI } from '../services/adminApi';
import toast from 'react-hot-toast';

interface Commission {
  _id: string;
  loadId: any;
  vehicleId: any;
  loadProviderId: any;
  vehicleOwnerId: any;
  commissionAmount: number;
  commissionRate: number;
  totalAmount: number;
  status: 'pending' | 'deducted' | 'paid';
  createdAt: string;
  deductedAt?: string;
  paidAt?: string;
}

export const CommissionManagement: React.FC = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const [stats, setStats] = useState({
    totalCommission: 0,
    pendingCommission: 0,
    deductedCommission: 0,
    paidCommission: 0
  });

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      const response = await adminAPI.getCommissionReports();
      if (response.data.success) {
        const commissionData = response.data.data;
        setCommissions(commissionData);
        
        // Calculate stats
        const total = commissionData.reduce((sum: number, c: Commission) => sum + c.commissionAmount, 0);
        const pending = commissionData.filter((c: Commission) => c.status === 'pending').reduce((sum: number, c: Commission) => sum + c.commissionAmount, 0);
        const deducted = commissionData.filter((c: Commission) => c.status === 'deducted').reduce((sum: number, c: Commission) => sum + c.commissionAmount, 0);
        const paid = commissionData.filter((c: Commission) => c.status === 'paid').reduce((sum: number, c: Commission) => sum + c.commissionAmount, 0);
        
        setStats({
          totalCommission: total,
          pendingCommission: pending,
          deductedCommission: deducted,
          paidCommission: paid
        });
      }
    } catch (error) {
      console.error('Error fetching commissions:', error);
      toast.error('Failed to fetch commission data');
    } finally {
      setLoading(false);
    }
  };

  const filteredCommissions = commissions.filter(commission =>
    statusFilter === 'all' || commission.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'deducted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return ClockIcon;
      case 'deducted': return BanknotesIcon;
      case 'paid': return CheckCircleIcon;
      default: return ClockIcon;
    }
  };

  const downloadCommissionReport = async () => {
    try {
      const response = await adminAPI.generateReport('commission');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commission_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Commission report downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate commission report');
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Commission Management</h1>
            <p className="text-slate-600">Track and manage 5% commission on XBOW supported loads</p>
          </div>
          <Button
            onClick={downloadCommissionReport}
            variant="outline"
            icon={<ArrowDownTrayIcon className="h-5 w-5" />}
          >
            Download Report
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Commission</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">₹{stats.totalCommission.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CurrencyRupeeIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">₹{stats.pendingCommission.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Deducted</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">₹{stats.deductedCommission.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BanknotesIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Paid</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">₹{stats.paidCommission.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
        >
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="deducted">Deducted</option>
              <option value="paid">Paid</option>
            </select>
            <p className="text-sm text-slate-600">
              Showing {filteredCommissions.length} of {commissions.length} commission records
            </p>
          </div>
        </motion.div>

        {/* Commission Records */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200"
        >
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Commission Records</h2>
          </div>

          <div className="divide-y divide-slate-200">
            {filteredCommissions.map((commission) => {
              const StatusIcon = getStatusIcon(commission.status);
              return (
                <motion.div
                  key={commission._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-semibold text-slate-900">
                          {commission.loadId.loadProviderName}
                        </h3>
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(commission.status)}`}>
                          <StatusIcon className="h-4 w-4" />
                          <span className="text-sm font-medium capitalize">{commission.status}</span>
                        </div>
                        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                          <span className="text-sm font-medium">₹{commission.commissionAmount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-slate-600">
                        <span>Vehicle: {commission.vehicleId.vehicleNumber}</span>
                        <span>Owner: {commission.vehicleOwnerId.name}</span>
                        <span>Rate: {commission.commissionRate}%</span>
                        <span>Date: {new Date(commission.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedCommission(commission);
                        setIsModalOpen(true);
                      }}
                      variant="ghost"
                      size="sm"
                      icon={<ChartBarIcon className="h-4 w-4" />}
                    >
                      View Details
                    </Button>
                  </div>
                </motion.div>
              );
            })}

            {filteredCommissions.length === 0 && (
              <div className="p-12 text-center">
                <CurrencyRupeeIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No commission records found</h3>
                <p className="text-slate-600">Commission records will appear when loads with XBOW support are completed</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Commission Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Commission Details"
          size="lg"
        >
          {selectedCommission && (
            <div className="space-y-6">
              {/* Commission Summary */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-emerald-800">Commission Summary</h3>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(selectedCommission.status)}`}>
                    <span className="text-sm font-medium capitalize">{selectedCommission.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-emerald-600 mb-1">Commission Amount</p>
                    <p className="font-bold text-emerald-800 text-xl">₹{selectedCommission.commissionAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-emerald-600 mb-1">Commission Rate</p>
                    <p className="font-semibold text-emerald-800">{selectedCommission.commissionRate}%</p>
                  </div>
                  <div>
                    <p className="text-emerald-600 mb-1">Total Load Value</p>
                    <p className="font-semibold text-emerald-800">₹{selectedCommission.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Load Information */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Load Information</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 mb-1">Load Provider</p>
                      <p className="font-medium text-slate-900">{selectedCommission.loadProviderId.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 mb-1">Route</p>
                      <p className="font-medium text-slate-900">
                        {selectedCommission.loadId.loadingLocation?.place} → {selectedCommission.loadId.unloadingLocation?.place}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Vehicle Information</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 mb-1">Vehicle Number</p>
                      <p className="font-medium text-slate-900">{selectedCommission.vehicleId.vehicleNumber}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 mb-1">Vehicle Owner</p>
                      <p className="font-medium text-slate-900">{selectedCommission.vehicleOwnerId.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Commission Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-slate-600">
                      Created: {new Date(selectedCommission.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {selectedCommission.deductedAt && (
                    <div className="flex items-center space-x-3">
                      <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-slate-600">
                        Deducted: {new Date(selectedCommission.deductedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedCommission.paidAt && (
                    <div className="flex items-center space-x-3">
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-slate-600">
                        Paid: {new Date(selectedCommission.paidAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};