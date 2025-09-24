import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DocumentArrowUpIcon,
  PhotoIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  TruckIcon,
  MapPinIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { podAPI, loadAPI } from '../../services/api';
import type{ POD, Load } from '../../types/index';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { PhotoUpload } from '../../components/common/PhotoUpload';
import toast from 'react-hot-toast';
import { mockPODs, mockLoads } from '../../data/mockData';

export const PODManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [pods, setPods] = useState<POD[]>([]);
  const [assignedLoads, setAssignedLoads] = useState<Load[]>([]);
  const [selectedPOD, setSelectedPOD] = useState<POD | null>(null);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const [uploadData, setUploadData] = useState({
    type: 'photo' as 'photo' | 'pdf',
    file: null as File | null,
    preview: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Using mock data for demonstration
     setPods(mockPODs as POD[]);
      const assignedLoads = mockLoads
        .filter((load) => 'isXBOWResponsible' in load && typeof (load as any).isXBOWResponsible !== 'undefined')
        .filter((load) => 
          ['assigned', 'enroute', 'delivered'].includes(load.status)
        );
      setAssignedLoads(assignedLoads);
    } catch (error) {
      console.error('Error fetching POD data:', error);
      toast.error('Failed to fetch POD data');
    } finally {
      setLoading(false);
    }
  };

  const filteredPODs = pods.filter(pod => 
    statusFilter === 'all' || pod.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return ClockIcon;
      case 'approved': return CheckCircleIcon;
      case 'rejected': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadData({
      ...uploadData,
      file,
      preview: URL.createObjectURL(file)
    });
  };

  const uploadPOD = async () => {
    if (!selectedLoad || !uploadData.file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64 for API
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        const podData = {
          loadId: selectedLoad.id,
          vehicleId: selectedLoad.assignedVehicleId,
          type: uploadData.type,
          file: base64
        };

        await podAPI.uploadPOD(podData);
        toast.success('POD uploaded successfully!');
        setIsUploadModalOpen(false);
        setUploadData({ type: 'photo', file: null, preview: '' });
        fetchData();
      };
      reader.readAsDataURL(uploadData.file);
    } catch (error) {
      toast.error('Failed to upload POD');
    } finally {
      setUploading(false);
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">POD Management</h1>
            <p className="text-slate-600">Upload and track Proof of Delivery documents</p>
          </div>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[
            { label: 'Total PODs', value: pods.length, color: 'blue', icon: DocumentTextIcon },
            { label: 'Pending', value: pods.filter(p => p.status === 'pending').length, color: 'yellow', icon: ClockIcon },
            { label: 'Approved', value: pods.filter(p => p.status === 'approved').length, color: 'green', icon: CheckCircleIcon },
            { label: 'Rejected', value: pods.filter(p => p.status === 'rejected').length, color: 'red', icon: XCircleIcon }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Assigned Loads for POD Upload */}
        {assignedLoads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">Upload POD for Assigned Loads</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedLoads.map((load) => (
                <div key={load.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-slate-900">Load #{load.id.slice(-6)}</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {load.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600 mb-4">
                    <p>{load.loadingLocation.place} → {load.unloadingLocation.place}</p>
                    <p>Loading: {new Date(load.loadingDate).toLocaleDateString()}</p>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedLoad(load);
                      setIsUploadModalOpen(true);
                    }}
                    size="sm"
                    className="w-full"
                    icon={<DocumentArrowUpIcon className="h-4 w-4" />}
                  >
                    Upload POD
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
        >
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <p className="text-sm text-slate-600">
              Showing {filteredPODs.length} of {pods.length} PODs
            </p>
          </div>
        </motion.div>

        {/* PODs Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredPODs.map((pod, index) => {
              const StatusIcon = getStatusIcon(pod.status);
              return (
                <motion.div
                  key={pod.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* POD Preview */}
                  <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                    {pod.type === 'photo' ? (
                      <img
                        src={pod.url}
                        alt="POD"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <DocumentTextIcon className="h-16 w-16 text-slate-400" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border backdrop-blur-sm ${getStatusColor(pod.status)}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-sm font-medium capitalize">{pod.status}</span>
                      </div>
                    </div>

                    {/* Type Badge */}
                    <div className="absolute top-4 right-4">
                      <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full">
                        <span className="text-xs font-medium uppercase">{pod.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* POD Header */}
                    <div className="mb-4">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">POD #{pod.id.slice(-6)}</h3>
                      <p className="text-slate-600">Uploaded {new Date(pod.uploadedAt).toLocaleDateString()}</p>
                    </div>

                    {/* Load Information */}
                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <h4 className="font-medium text-slate-900 mb-2 flex items-center">
                        <TruckIcon className="h-4 w-4 mr-2" />
                        Associated Load
                      </h4>
                      <div className="text-sm text-slate-600">
                        <p>Load ID: #{pod.loadId.slice(-6)}</p>
                        <p>Vehicle: {pod.vehicleId.slice(-6)}</p>
                      </div>
                    </div>

                    {/* Status Information */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 text-sm">Status:</span>
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(pod.status)}`}>
                          <StatusIcon className="h-4 w-4" />
                          <span className="text-sm font-medium capitalize">{pod.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 text-sm">Type:</span>
                        <span className="font-medium text-slate-900 uppercase">{pod.type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 text-sm">Uploaded:</span>
                        <span className="font-medium text-slate-900">{new Date(pod.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Comments */}
                    {pod.comments && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                          Admin Comments
                        </h4>
                        <p className="text-blue-700 text-sm">{pod.comments}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => {
                          setSelectedPOD(pod);
                          setIsViewModalOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        icon={<EyeIcon className="h-4 w-4" />}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredPODs.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <DocumentArrowUpIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {pods.length === 0 ? 'No PODs uploaded yet' : 'No PODs match your filter'}
            </h3>
            <p className="text-slate-600 mb-6">
              {pods.length === 0 
                ? 'Upload PODs for your completed deliveries'
                : 'Try changing the status filter'
              }
            </p>
          </motion.div>
        )}

        {/* POD Upload Modal */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Upload POD"
          size="lg"
        >
          {selectedLoad && (
            <div className="space-y-6">
              {/* Load Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Load Information</h3>
                <div className="text-blue-700 text-sm space-y-1">
                  <p>Load ID: #{selectedLoad.id.slice(-6)}</p>
                  <p>Route: {selectedLoad.loadingLocation.place} → {selectedLoad.unloadingLocation.place}</p>
                  <p>Provider: {selectedLoad.loadProviderName}</p>
                </div>
              </div>

              {/* POD Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  POD Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    type="button"
                    onClick={() => setUploadData(prev => ({ ...prev, type: 'photo' }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      uploadData.type === 'photo'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <PhotoIcon className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-semibold">Photo</div>
                    <div className="text-sm text-slate-500">Delivery photo</div>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => setUploadData(prev => ({ ...prev, type: 'pdf' }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      uploadData.type === 'pdf'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <DocumentTextIcon className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-semibold">Document</div>
                    <div className="text-sm text-slate-500">Signed POD</div>
                  </motion.button>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Upload {uploadData.type === 'photo' ? 'Photo' : 'Document'} *
                </label>
                <PhotoUpload
                  onFileSelect={handleFileUpload}
                  accept={uploadData.type === 'photo' ? 'image/*' : '.pdf,.doc,.docx'}
                  preview={uploadData.preview}
                  className="h-48"
                />
              </div>

              {/* Upload Button */}
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setIsUploadModalOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={uploadPOD}
                  loading={uploading}
                  disabled={!uploadData.file}
                  icon={<DocumentArrowUpIcon className="h-4 w-4" />}
                >
                  Upload POD
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* POD Details Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="POD Details"
          size="lg"
        >
          {selectedPOD && (
            <div className="space-y-6">
              {/* POD Preview */}
              <div className="text-center">
                {selectedPOD.type === 'photo' ? (
                  <img
                    src={selectedPOD.url}
                    alt="POD"
                    className="max-w-full h-64 object-contain mx-auto rounded-lg border border-slate-200"
                  />
                ) : (
                  <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                    <div className="text-center">
                      <DocumentTextIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">PDF Document</p>
                      <Button
                        onClick={() => window.open(selectedPOD.url, '_blank')}
                        variant="outline"
                        size="sm"
                        className="mt-4"
                      >
                        Open Document
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* POD Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">POD Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">POD ID:</span>
                      <span className="font-medium">#{selectedPOD.id.slice(-6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Type:</span>
                      <span className="font-medium uppercase">{selectedPOD.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getStatusColor(selectedPOD.status)}`}>
                        <MapPinIcon className="h-3 w-3" />
                        <span className="text-xs font-medium capitalize">{selectedPOD.status}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Uploaded:</span>
                      <span className="font-medium">{new Date(selectedPOD.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Load Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Load ID:</span>
                      <span className="font-medium">#{selectedPOD.loadId.slice(-6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Vehicle:</span>
                      <span className="font-medium">#{selectedPOD.vehicleId.slice(-6)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Comments */}
              {selectedPOD.comments && (
                <div className={`border rounded-xl p-4 ${
                  selectedPOD.status === 'approved' 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}>
                  <h3 className={`font-semibold mb-2 ${
                    selectedPOD.status === 'approved' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Admin Comments
                  </h3>
                  <p className={`text-sm ${
                    selectedPOD.status === 'approved' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {selectedPOD.comments}
                  </p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};