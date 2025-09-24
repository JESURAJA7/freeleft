import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TruckIcon,
  CurrencyRupeeIcon,
  ChatBubbleLeftRightIcon,
  HandRaisedIcon,
  MapPinIcon,
  ScaleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Modal } from '../common/Modal';
import { Button } from '../common/CustomButton';
import { Input } from '../common/CustomInput';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { vehicleMatchingAPI } from '../../services/api';
import type { Load, Vehicle } from '../../types/index';
import toast from 'react-hot-toast';

interface VehicleApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  load: Load | null;
  vehicles: Vehicle[];
  onApplicationSent: () => void;
}

export const VehicleApplicationModal: React.FC<VehicleApplicationModalProps> = ({
  isOpen,
  onClose,
  load,
  vehicles,
  onApplicationSent
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [bidPrice, setBidPrice] = useState<string>('');
  const [message, setMessage] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (isOpen && vehicles.length > 0) {
      // Auto-select the first compatible vehicle
      const compatibleVehicle = vehicles.find(vehicle => isVehicleCompatible(vehicle));
      if (compatibleVehicle) {
        setSelectedVehicle(compatibleVehicle);
      }
    }
  }, [isOpen, vehicles]);

  useEffect(() => {
  console.log("VehicleApplicationModal Load:", load);
}, [load]);


  const isVehicleCompatible = (vehicle: Vehicle) => {
    if (!load) return false;
    
    const totalWeight = load.materials?.reduce((sum, material) => sum + material.totalWeight, 0) || 0;
    
    return (
      vehicle.vehicleSize >= load.vehicleRequirement.size &&
      vehicle.passingLimit >= totalWeight / 1000 &&
      vehicle.status === 'available' &&
      vehicle.isApproved &&
      new Date(vehicle.availability) <= new Date(load.loadingDate)
    );
  };

  const handleApply = async () => {
    if (!selectedVehicle || !load) {
      toast.error('Please select a vehicle');
      return;
    }

    if (!bidPrice.trim()) {
      toast.error('Please enter your bid price');
      return;
    }

    try {
      setApplying(true);
      await vehicleMatchingAPI.applyForLoad(
        load._id,
        selectedVehicle._id,
        Number(bidPrice),
        message.trim() || undefined
      );
      
      toast.success('Application sent successfully!');
      onApplicationSent();
      onClose();
      
      // Reset form
      setSelectedVehicle(null);
      setBidPrice('');
      setMessage('');
    } catch (error: any) {
      console.error('Error applying for load:', error);
      toast.error(error.response?.data?.message || 'Failed to send application');
    } finally {
      setApplying(false);
    }
  };

  if (!load) return null;

  const compatibleVehicles = vehicles.filter(isVehicleCompatible);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 -m-6 mb-6">
          <h2 className="text-2xl font-bold mb-2">Apply for Load</h2>
          <p className="text-emerald-100">
            {load.loadingLocation.place} → {load.unloadingLocation.place}
          </p>
        </div>

        {/* Load Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Load Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Vehicle Required:</span>
              <p className="font-medium text-slate-900">{load.vehicleRequirement.size}ft {load.vehicleRequirement.vehicleType}</p>
            </div>
            <div>
              <span className="text-slate-600">Total Weight:</span>
              <p className="font-medium text-slate-900">
                {(load.materials?.reduce((sum, material) => sum + material.totalWeight, 0) || 0).toLocaleString()} kg
              </p>
            </div>
            <div>
              <span className="text-slate-600">Loading Date:</span>
              <p className="font-medium text-slate-900">{new Date(load.loadingDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-slate-600">Payment:</span>
              <p className="font-medium text-slate-900 uppercase">{load.paymentTerms}</p>
            </div>
          </div>
        </div>

        {/* Vehicle Selection */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-4">Select Your Vehicle</h3>
          {compatibleVehicles.length === 0 ? (
            <div className="text-center py-8 bg-red-50 border border-red-200 rounded-xl">
              <TruckIcon className="h-12 w-12 text-red-300 mx-auto mb-3" />
              <h4 className="font-medium text-red-800 mb-2">No Compatible Vehicles</h4>
              <p className="text-sm text-red-600">
                None of your vehicles meet the requirements for this load.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {compatibleVehicles.map((vehicle) => (
                <motion.div
                  key={vehicle._id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedVehicle(vehicle)}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    selectedVehicle?._id === vehicle._id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900">{vehicle.vehicleNumber}</h4>
                    {selectedVehicle?._id === vehicle._id && (
                      <div className="h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-600">Type:</span>
                      <p className="font-medium">{vehicle.vehicleType}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Size:</span>
                      <p className="font-medium">{vehicle.vehicleSize} ft</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Capacity:</span>
                      <p className="font-medium">{vehicle.passingLimit} tons</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Available:</span>
                      <p className="font-medium">{new Date(vehicle.availability).toLocaleDateString()}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Bid Price */}
        {selectedVehicle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Your Bid Price (₹) *
              </label>
              <div className="relative">
                <CurrencyRupeeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  type="number"
                  placeholder="Enter your bid amount"
                  value={bidPrice}
                  onChange={setBidPrice}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enter a competitive price for this transportation service
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Message to Load Provider (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add any additional information or questions..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex space-x-4 pt-4 border-t border-slate-200">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            loading={applying}
            disabled={!selectedVehicle || !bidPrice.trim() || compatibleVehicles.length === 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            icon={<HandRaisedIcon className="h-4 w-4" />}
          >
            Send Application
          </Button>
        </div>
      </div>
    </Modal>
  );
};