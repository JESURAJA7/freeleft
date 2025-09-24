import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  TruckIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';
import type { Load, Vehicle } from '../../src/types/index';
import { VehicleSelector } from './vehicles/VehicleSelector';
import { Button } from './common/CustomButton';

interface LoadApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  load: Load | null;
  vehicles: Vehicle[];
  onApply: (loadId: string, vehicleId: string) => void;
  loading?: boolean;
}

export const LoadApplicationModal: React.FC<LoadApplicationModalProps> = ({
  isOpen,
  onClose,
  load,
  vehicles,
  onApply,
  loading = false
}) => {
  const [step, setStep] = useState<'details' | 'vehicle-selection'>('details');
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  // Early return if modal is not open or load data is not available
  if (!isOpen || !load) return null;

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
    onApply(load._id, vehicleId);
    onClose();
  };

  const calculateDistance = () => {
    // Mock distance calculation
    return Math.floor(Math.random() * 800) + 200;
  };

  const totalWeight = load.materials?.reduce((sum, material) => sum + material.totalWeight, 0) || 0;
  const distance = calculateDistance();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {step === 'details' ? (
            <motion.div
              key="details"
              initial={{ x: 0 }}
              exit={{ x: -100 }}
              className="p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Apply for Load</h3>
                  <p className="text-slate-600">Review load details before applying</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-slate-500" />
                </button>
              </div>

              {/* Load Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Route Card */}
                <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200 rounded-2xl p-6">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Route Information
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{load.loadingLocation.place}</p>
                        <p className="text-sm text-slate-600">{load.loadingLocation.state}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="text-slate-400 text-sm font-medium">
                        {distance} km • ~{Math.ceil(distance / 60)} hours
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="h-3 w-3 bg-emerald-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{load.unloadingLocation.place}</p>
                        <p className="text-sm text-slate-600">{load.unloadingLocation.state}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Load Details Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                    <TruckIcon className="h-5 w-5 mr-2 text-slate-600" />
                    Load Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Vehicle Required:</span>
                      <span className="font-semibold text-slate-900">
                        {load.vehicleRequirement.size}ft {load.vehicleRequirement.vehicleType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Total Weight:</span>
                      <span className="font-semibold text-slate-900">{totalWeight} kg</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Materials:</span>
                      <span className="font-semibold text-slate-900">{load.materials?.length || 0} items</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Loading Date:</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(load.loadingDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Payment Terms:</span>
                      <span className="font-semibold text-slate-900 uppercase">{load.paymentTerms}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Materials Details */}
              <div className="mb-8">
                <h4 className="font-bold text-slate-900 mb-4">Material Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {load.materials?.map((material, index) => (
                    <div key={material.id || index} className="border border-slate-200 rounded-xl p-4">
                      <h5 className="font-semibold text-slate-900 mb-3">{material.name}</h5>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-600">Dimensions:</span>
                          <p className="font-medium text-slate-900">
                            {material.dimensions.length} × {material.dimensions.width} × {material.dimensions.height} ft
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-600">Weight:</span>
                          <p className="font-medium text-slate-900">{material.totalWeight} kg</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Pack Type:</span>
                          <p className="font-medium text-slate-900 capitalize">{material.packType}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Count:</span>
                          <p className="font-medium text-slate-900">{material.totalCount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commission Info */}
              {load.commissionApplicable && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <CurrencyRupeeIcon className="h-6 w-6 text-emerald-600" />
                    <div>
                      <h4 className="font-semibold text-emerald-800">Commission Applicable</h4>
                      <p className="text-emerald-700 text-sm">
                        5% commission (₹{load.commissionAmount?.toLocaleString()}) - XBOW will coordinate this transport
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button
                  onClick={() => setStep('vehicle-selection')}
                  className="flex-1"
                  icon={<TruckIcon className="h-4 w-4" />}
                >
                  Select Vehicle & Apply
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="vehicle-selection"
              initial={{ x: 100 }}
              animate={{ x: 0 }}
              exit={{ x: 100 }}
              className="p-6 max-h-[90vh] overflow-y-auto"
            >
              <VehicleSelector
                vehicles={vehicles}
                load={load}
                onVehicleSelect={handleVehicleSelect}
                onClose={() => setStep('details')}
                loading={loading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};