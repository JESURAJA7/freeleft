import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  UserIcon,
  BuildingOfficeIcon,
  TruckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { adminAPI } from '../services/adminApi';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  role: 'load_provider' | 'vehicle_owner';
  isApproved: boolean;
  isActive: boolean;
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'expired';
  subscriptionEndDate?: string;
  trialDays?: number;
  trialEndDate?: string;
  maxLoadsAllowed?: number;
  loadsPosted?: number;
  companyName?: string;
  address?: any;
  businessDetails?: any;
  documents?: any[];
  createdAt: string;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLimitsModalOpen, setIsLimitsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    approval: 'all'
  });

  const [approvalSettings, setApprovalSettings] = useState({
    trialDays: 15,
    maxLoadsAllowed: 5
  });

  const [limitsForm, setLimitsForm] = useState({
    maxLoadsAllowed: 5,
    trialDays: 15
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers();
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (filters.search) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.phone.includes(filters.search) ||
        (user.companyName && user.companyName.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(user => user.subscriptionStatus === filters.status);
    }

    if (filters.approval !== 'all') {
      filtered = filtered.filter(user => 
        filters.approval === 'approved' ? user.isApproved : !user.isApproved
      );
    }

    setFilteredUsers(filtered);
  };

  const handleApproveUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await adminAPI.approveUser(userId, {
        trialDays: approvalSettings.trialDays,
        maxLoadsAllowed: approvalSettings.maxLoadsAllowed
      });
      if (response.data.success) {
        toast.success(`User approved with ${approvalSettings.trialDays} days trial`);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await adminAPI.rejectUser(userId, { reason: 'Documents not verified' });
      if (response.data.success) {
        toast.success('User rejected successfully');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateLimits = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(selectedUser._id);
      await adminAPI.updateUserLimits(selectedUser._id, limitsForm);
      toast.success('User limits updated successfully');
      setIsLimitsModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user limits');
    } finally {
      setActionLoading(null);
    }
  };

  const calculateRemainingDays = (trialEndDate: string) => {
    const now = new Date();
    const endDate = new Date(trialEndDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'trial': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'load_provider' ? BuildingOfficeIcon : TruckIcon;
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
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">User Management</h1>
          <p className="text-slate-600">Approve users and manage trial periods & load limits</p>
        </motion.div>

        {/* Approval Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Default Approval Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trial Days for New Users
              </label>
              <input
                type="number"
                value={approvalSettings.trialDays}
                onChange={(e) => setApprovalSettings(prev => ({ ...prev, trialDays: Number(e.target.value) }))}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
                min="1"
                max="90"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Max Loads Allowed (Load Providers)
              </label>
              <input
                type="number"
                value={approvalSettings.maxLoadsAllowed}
                onChange={(e) => setApprovalSettings(prev => ({ ...prev, maxLoadsAllowed: Number(e.target.value) }))}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
                min="1"
                max="100"
              />
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                className="pl-10"
              />
            </div>

            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="load_provider">Load Providers</option>
              <option value="vehicle_owner">Vehicle Owners</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filters.approval}
              onChange={(e) => setFilters(prev => ({ ...prev, approval: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Approvals</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-slate-600">
              Showing {filteredUsers.length} of {users.length} users
            </p>
            <Button
              onClick={() => setFilters({ search: '', role: 'all', status: 'all', approval: 'all' })}
              variant="ghost"
              size="sm"
            >
              Clear Filters
            </Button>
          </div>
        </motion.div>

        {/* Users Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredUsers.map((user, index) => {
              const RoleIcon = getRoleIcon(user.role);
              const remainingDays = user.trialEndDate ? calculateRemainingDays(user.trialEndDate) : 0;
              const isTrialExpiring = remainingDays <= 3 && user.subscriptionStatus === 'trial';
              
              return (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 ${
                    isTrialExpiring ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
                  }`}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                          user.role === 'load_provider' ? 'bg-blue-100' : 'bg-emerald-100'
                        }`}>
                          <RoleIcon className={`h-6 w-6 ${
                            user.role === 'load_provider' ? 'text-blue-600' : 'text-emerald-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{user.name}</h3>
                          <p className="text-sm text-slate-600 capitalize">{user.role.replace('_', ' ')}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        {!user.isActive && (
                          <div className="bg-red-100 text-red-700 px-2 py-1 rounded-full border border-red-200">
                            <span className="text-xs font-medium">Disabled</span>
                          </div>
                        )}
                        {user.isApproved ? (
                          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200">
                            <span className="text-xs font-medium">Approved</span>
                          </div>
                        ) : (
                          <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full border border-orange-200">
                            <span className="text-xs font-medium">Pending</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trial Status */}
                    {user.subscriptionStatus === 'trial' && user.trialEndDate && (
                      <div className={`p-3 rounded-xl border mb-4 ${
                        isTrialExpiring 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className={`h-4 w-4 ${
                              isTrialExpiring ? 'text-red-600' : 'text-blue-600'
                            }`} />
                            <span className={`text-sm font-medium ${
                              isTrialExpiring ? 'text-red-800' : 'text-blue-800'
                            }`}>
                              Trial Period
                            </span>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              isTrialExpiring ? 'text-red-600' : 'text-blue-600'
                            }`}>
                              {remainingDays} days left
                            </p>
                            <p className={`text-xs ${
                              isTrialExpiring ? 'text-red-500' : 'text-blue-500'
                            }`}>
                              Ends: {new Date(user.trialEndDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Load Limits for Load Providers */}
                    {user.role === 'load_provider' && user.isApproved && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <DocumentTextIcon className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-800">Load Limit</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600">
                              {user.loadsPosted || 0} / {user.maxLoadsAllowed || 0}
                            </p>
                            <p className="text-xs text-emerald-500">Posted / Allowed</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* User Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Email:</span>
                        <span className="font-medium text-slate-900">{user.email}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Phone:</span>
                        <span className="font-medium text-slate-900">{user.phone}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">WhatsApp:</span>
                        <span className="font-medium text-slate-900">{user.whatsappNumber}</span>
                      </div>
                      {user.companyName && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Company:</span>
                          <span className="font-medium text-slate-900">{user.companyName}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Subscription:</span>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border ${getStatusColor(user.subscriptionStatus)}`}>
                          <span className="text-xs font-medium capitalize">{user.subscriptionStatus}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Joined:</span>
                        <span className="font-medium text-slate-900">{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsModalOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        icon={<EyeIcon className="h-4 w-4" />}
                      >
                        View Details
                      </Button>

                      {user.isApproved && (
                        <Button
                          onClick={() => {
                            setSelectedUser(user);
                            setLimitsForm({
                              maxLoadsAllowed: user.maxLoadsAllowed || 5,
                              trialDays: user.trialDays || 15
                            });
                            setIsLimitsModalOpen(true);
                          }}
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          icon={<CogIcon className="h-4 w-4" />}
                        >
                          Manage Limits
                        </Button>
                      )}

                      {!user.isApproved ? (
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleApproveUser(user._id)}
                            loading={actionLoading === user._id}
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            icon={<CheckCircleIcon className="h-4 w-4" />}
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectUser(user._id)}
                            loading={actionLoading === user._id}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                            icon={<XCircleIcon className="h-4 w-4" />}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            // Toggle user access
                          }}
                          variant={user.isActive ? "outline" : "secondary"}
                          size="sm"
                          className="w-full"
                        >
                          {user.isActive ? 'Disable Access' : 'Enable Access'}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredUsers.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <UserIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No users found</h3>
            <p className="text-slate-600">Try adjusting your search criteria or filters</p>
          </motion.div>
        )}

        {/* User Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="User Details"
          size="xl"
        >
          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Basic Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Name:</span>
                      <span className="font-medium">{selectedUser.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Email:</span>
                      <span className="font-medium">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Phone:</span>
                      <span className="font-medium">{selectedUser.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">WhatsApp:</span>
                      <span className="font-medium">{selectedUser.whatsappNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Role:</span>
                      <span className="font-medium capitalize">{selectedUser.role.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Account Status</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Approved:</span>
                      <span className={`font-medium ${selectedUser.isApproved ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedUser.isApproved ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Active:</span>
                      <span className={`font-medium ${selectedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedUser.isActive ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subscription:</span>
                      <div className={`px-2 py-1 rounded-full border ${getStatusColor(selectedUser.subscriptionStatus)}`}>
                        <span className="text-xs font-medium capitalize">{selectedUser.subscriptionStatus}</span>
                      </div>
                    </div>
                    {selectedUser.trialEndDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Trial Ends:</span>
                        <span className="font-medium">{new Date(selectedUser.trialEndDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedUser.role === 'load_provider' && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Load Limit:</span>
                        <span className="font-medium">{selectedUser.loadsPosted || 0} / {selectedUser.maxLoadsAllowed || 0}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents */}
              {selectedUser.documents && selectedUser.documents.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Uploaded Documents</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedUser.documents.map((doc, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={doc.url}
                          alt={doc.type}
                          className="w-full h-24 object-cover rounded-lg border border-slate-200 group-hover:opacity-80 transition-opacity cursor-pointer"
                          onClick={() => window.open(doc.url, '_blank')}
                        />
                        <div className="absolute bottom-1 left-1 right-1">
                          <span className="text-xs bg-black bg-opacity-70 text-white px-2 py-1 rounded text-center block capitalize">
                            {doc.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!selectedUser.isApproved && (
                <div className="flex space-x-3 pt-6 border-t border-slate-200">
                  <Button
                    onClick={() => {
                      handleApproveUser(selectedUser._id);
                      setIsModalOpen(false);
                    }}
                    loading={actionLoading === selectedUser._id}
                    variant="secondary"
                    className="flex-1"
                    icon={<CheckCircleIcon className="h-4 w-4" />}
                  >
                    Approve User
                  </Button>
                  <Button
                    onClick={() => {
                      handleRejectUser(selectedUser._id);
                      setIsModalOpen(false);
                    }}
                    loading={actionLoading === selectedUser._id}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    icon={<XCircleIcon className="h-4 w-4" />}
                  >
                    Reject User
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Limits Management Modal */}
        <Modal
          isOpen={isLimitsModalOpen}
          onClose={() => setIsLimitsModalOpen(false)}
          title="Manage User Limits"
          size="md"
        >
          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-slate-900 mb-2">{selectedUser.name}</h3>
                <p className="text-slate-600 capitalize">{selectedUser.role.replace('_', ' ')}</p>
              </div>

              {/* Limits Form */}
              <div className="space-y-4">
                {selectedUser.role === 'load_provider' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Maximum Loads Allowed
                    </label>
                    <input
                      type="number"
                      value={limitsForm.maxLoadsAllowed}
                      onChange={(e) => setLimitsForm(prev => ({ ...prev, maxLoadsAllowed: Number(e.target.value) }))}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                      min="1"
                      max="100"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Current: {selectedUser.loadsPosted || 0} loads posted
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Trial Days (if extending trial)
                  </label>
                  <input
                    type="number"
                    value={limitsForm.trialDays}
                    onChange={(e) => setLimitsForm(prev => ({ ...prev, trialDays: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    min="1"
                    max="90"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <Button
                  onClick={() => setIsLimitsModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateLimits}
                  loading={actionLoading === selectedUser._id}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  icon={<CogIcon className="h-4 w-4" />}
                >
                  Update Limits
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};