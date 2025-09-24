import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  TruckIcon,
  DocumentTextIcon,
  MapPinIcon,
  LinkIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/common/CustomButton';
import { Input } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal, ConfirmationModal } from '../../components/common/Modal';
import { adminAPI } from '../services/adminApi';
import toast from 'react-hot-toast';

interface Load {
  _id: string;
  loadProviderName: string;
  loadingLocation: any;
  unloadingLocation: any;
  vehicleRequirement: any;
  materials: any[];
  loadingDate: string;
  paymentTerms: string;
  withXBowSupport: boolean;
  status: string;
  commissionApplicable: boolean;
  commissionAmount?: number;
}

interface Vehicle {
  _id: string;
  ownerName: string;
  vehicleNumber: string;
  vehicleType: string;
  vehicleSize: number;
  passingLimit: number;
  preferredOperatingArea: any;
  status: string;
  isApproved: boolean;
}

export const LoadVehicleMatching: React.FC = () => {
  const [loads, setLoads] = useState<Load[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [compatibleVehicles, setCompatibleVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  const [filters, setFilters] = useState({
    loadSearch: '',
    vehicleSearch: '',
    loadStatus: 'posted'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [loadsResponse, vehiclesResponse] = await Promise.all([
        adminAPI.getLoads({ status: 'posted' }),
        adminAPI.getVehicles({ approved: 'true', status: 'available' })
      ]);

      if (loadsResponse.data.success) {
        setLoads(loadsResponse.data.data);
      }

      if (vehiclesResponse.data.success) {
        setVehicles(vehiclesResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const findCompatibleVehicles = (load: Load) => {
    const totalWeight = load.materials.reduce((sum: number, material: any) => sum + material.totalWeight, 0);
    
    return vehicles.filter(vehicle => 
      vehicle.vehicleSize >= load.vehicleRequirement.size &&
      vehicle.passingLimit * 1000 >= totalWeight &&
      vehicle.status === 'available' &&
      vehicle.isApproved
    );
  };

  const selectLoadForMatching = (load: Load) => {
    setSelectedLoad(load);
    const compatible = findCompatibleVehicles(load);
    setCompatibleVehicles(compatible);
    setIsModalOpen(true);
  };

  const handleMatchLoadVehicle = async () => {
    if (!selectedLoad || !selectedVehicle) return;

    setMatching(true);
    try {
      const response = await adminAPI.matchLoadWithVehicle({
        loadId: selectedLoad._id,
        vehicleId: selectedVehicle._id
      });

      if (response.data.success) {
        toast.success('Load assigned to vehicle successfully!');
        setIsModalOpen(false);
        setIsConfirmModalOpen(false);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign load');
    } finally {
      setMatching(false);
    }
  };

  const filteredLoads = loads.filter(load =>
    load.loadProviderName.toLowerCase().includes(filters.loadSearch.toLowerCase()) ||
    load.loadingLocation.place.toLowerCase().includes(filters.loadSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Load-Vehicle Matching</h1>
          <p className="text-slate-600">Match available loads with compatible vehicles</p>
        </motion.div>

        {/* Search Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search loads..."
                value={filters.loadSearch}
                onChange={(value) => setFilters(prev => ({ ...prev, loadSearch: value }))}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search vehicles..."
                value={filters.vehicleSearch}
                onChange={(value) => setFilters(prev => ({ ...prev, vehicleSearch: value }))}
                className="pl-10"
              />
            </div>
          </div>
        </motion.div>

        {/* Available Loads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-8"
        >
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Available Loads ({filteredLoads.length})</h2>
          </div>

          <div className="divide-y divide-slate-200">
            {filteredLoads.map((load) => {
              const compatibleCount = findCompatibleVehicles(load).length;
              return (
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
                        {load.withXBowSupport && (
                          <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
                            <span className="text-xs font-medium">XBOW Support</span>
                          </div>
                        )}
                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                          <span className="text-xs font-medium">{compatibleCount} Compatible Vehicles</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-slate-600">
                        <span>Provider: {load.loadProviderName}</span>
                        <span>Vehicle: {load.vehicleRequirement.size}ft {load.vehicleRequirement.vehicleType}</span>
                        <span>Materials: {load.materials.length}</span>
                        <span>Payment: {load.paymentTerms.toUpperCase()}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => selectLoadForMatching(load)}
                      disabled={compatibleCount === 0}
                      variant={compatibleCount > 0 ? "primary" : "ghost"}
                      size="sm"
                      icon={<LinkIcon className="h-4 w-4" />}
                    >
                      {compatibleCount > 0 ? 'Match Vehicle' : 'No Compatible Vehicles'}
                    </Button>
                  </div>
                </motion.div>
              );
            })}

            {filteredLoads.length === 0 && (
              <div className="p-12 text-center">
                <DocumentTextIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No available loads</h3>
                <p className="text-slate-600">All loads have been assigned or no loads match your search</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Load-Vehicle Matching Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Match Load with Vehicle"
          size="xl"
        >
          {selectedLoad && (
            <div className="space-y-6">
              {/* Load Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-3">Selected Load</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600 mb-1">Route</p>
                    <p className="font-medium text-blue-800">
                      {selectedLoad.loadingLocation.place} → {selectedLoad.unloadingLocation.place}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-600 mb-1">Vehicle Required</p>
                    <p className="font-medium text-blue-800">
                      {selectedLoad.vehicleRequirement.size}ft {selectedLoad.vehicleRequirement.vehicleType}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-600 mb-1">Total Weight</p>
                    <p className="font-medium text-blue-800">
                      {selectedLoad.materials.reduce((sum: number, material: any) => sum + material.totalWeight, 0)} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-600 mb-1">Payment Terms</p>
                    <p className="font-medium text-blue-800 uppercase">{selectedLoad.paymentTerms}</p>
                  </div>
                </div>
              </div>

              {/* Compatible Vehicles */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">
                  Compatible Vehicles ({compatibleVehicles.length})
                </h3>
                
                {compatibleVehicles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {compatibleVehicles.map((vehicle) => (
                      <motion.div
                        key={vehicle._id}
                        whileHover={{ scale: 1.02 }}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                          selectedVehicle?._id === vehicle._id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedVehicle(vehicle)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-900">{vehicle.vehicleNumber}</h4>
                          <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                            <span className="text-xs font-medium">Compatible</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Owner:</span>
                            <span className="font-medium">{vehicle.ownerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Type:</span>
                            <span className="font-medium">{vehicle.vehicleType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Size:</span>
                            <span className="font-medium">{vehicle.vehicleSize} ft</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Capacity:</span>
                            <span className="font-medium">{vehicle.passingLimit} Tons</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Location:</span>
                            <span className="font-medium">{vehicle.preferredOperatingArea.place}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <TruckIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No compatible vehicles found for this load</p>
                  </div>
                )}
              </div>

              {/* Match Button */}
              {selectedVehicle && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-emerald-800 mb-1">Ready to Match</h3>
                      <p className="text-emerald-700 text-sm">
                        Assign {selectedLoad.loadingLocation.place} → {selectedLoad.unloadingLocation.place} to {selectedVehicle.vehicleNumber}
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsConfirmModalOpen(true)}
                      variant="secondary"
                      icon={<LinkIcon className="h-4 w-4" />}
                    >
                      Assign Load
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleMatchLoadVehicle}
          title="Confirm Load Assignment"
          message={
            selectedLoad && selectedVehicle
              ? `Are you sure you want to assign load "${selectedLoad.loadingLocation.place} → ${selectedLoad.unloadingLocation.place}" to vehicle "${selectedVehicle.vehicleNumber}"?`
              : ''
          }
          confirmText="Assign Load"
          type="info"
        />
      </div>
    </div>
  );
};