import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TruckIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import type { Vehicle, Load } from '../../types/index';
import { Button } from '../common/CustomButton';

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  load: Load;
  onVehicleSelect: (vehicleId: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  vehicles,
  load,
  onVehicleSelect,
  onClose,
  loading = false
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const isVehicleCompatible = (vehicle: Vehicle) => {
    const totalWeight = load.materials?.reduce((sum, material) => sum + material.totalWeight, 0) || 0;
    const weightInTons = totalWeight / 1000;

    return (
      vehicle.vehicleSize >= load.vehicleRequirement.size &&
      vehicle.passingLimit >= weightInTons &&
      vehicle.isApproved &&
      vehicle.status === 'available'
    );
  };

  const compatibleVehicles = vehicles.filter(isVehicleCompatible);
 // const compatibleVehicles =true;
  const incompatibleVehicles = vehicles.filter(v => !isVehicleCompatible(v));

  const handleConfirmSelection = () => {
    if (selectedVehicle) {
      onVehicleSelect(selectedVehicle);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Select Vehicle</h3>
          <p className="text-slate-600 text-sm mt-1">
            Choose a compatible vehicle for this load
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <XMarkIcon className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      {/* Load Requirements Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-medium text-blue-800 mb-3 flex items-center">
          <InformationCircleIcon className="h-5 w-5 mr-2" />
          Load Requirements
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-blue-600">Vehicle Size:</span>
            <p className="font-medium text-blue-800">{load.vehicleRequirement.size} ft</p>
          </div>
          <div>
            <span className="text-blue-600">Vehicle Type:</span>
            <p className="font-medium text-blue-800">{load.vehicleRequirement.vehicleType}</p>
          </div>
          <div>
            <span className="text-blue-600">Total Weight:</span>
            <p className="font-medium text-blue-800">
              {(load.materials?.reduce((sum, material) => sum + material.totalWeight, 0) || 0)} kg
            </p>
          </div>
          <div>
            <span className="text-blue-600">Trailer:</span>
            <p className="font-medium text-blue-800">{load.vehicleRequirement.trailerType || 'None'}</p>
          </div>
        </div>
      </div>

      {/* Compatible Vehicles */}
      {compatibleVehicles.length > 0 && (
        <div>
          <h4 className="font-semibold text-emerald-800 mb-4 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Compatible Vehicles ({compatibleVehicles.length})
          </h4>
          <div className="space-y-3">
            {compatibleVehicles.map((vehicle) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                  selectedVehicle === vehicle.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300 hover:bg-emerald-50'
                }`}
                onClick={() => setSelectedVehicle(vehicle.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${
                      selectedVehicle === vehicle.id ? 'bg-emerald-200' : 'bg-emerald-100'
                    }`}>
                      <TruckIcon className="h-6 w-6 text-emerald-700" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-slate-900">{vehicle.vehicleNumber}</h5>
                      <p className="text-sm text-slate-600">
                        {vehicle.vehicleSize}ft • {vehicle.passingLimit}T capacity
                      </p>
                      <p className="text-xs text-emerald-700 font-medium">
                        {vehicle.preferredOperatingArea.state}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right text-sm">
                      <p className="text-slate-600">Rating</p>
                      <p className="font-semibold text-slate-900">
                        {vehicle.rating ? `${vehicle.rating}/5` : 'New'}
                      </p>
                    </div>
                    {selectedVehicle === vehicle.id && (
                      <CheckCircleIconSolid className="h-6 w-6 text-emerald-600" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Incompatible Vehicles */}
      {incompatibleVehicles.length > 0 && (
        <div>
          <h4 className="font-semibold text-slate-600 mb-4 flex items-center">
            <XMarkIcon className="h-5 w-5 mr-2" />
            Incompatible Vehicles ({incompatibleVehicles.length})
          </h4>
          <div className="space-y-3">
            {incompatibleVehicles.map((vehicle) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-slate-200 bg-slate-50 rounded-xl p-4 opacity-60"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-slate-200 rounded-xl">
                      <TruckIcon className="h-6 w-6 text-slate-500" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-slate-700">{vehicle.vehicleNumber}</h5>
                      <p className="text-sm text-slate-500">
                        {vehicle.vehicleSize}ft • {vehicle.passingLimit}T capacity
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {vehicle.vehicleSize < load.vehicleRequirement.size && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            Size too small
                          </span>
                        )}
                        {vehicle.passingLimit < (load.materials?.reduce((sum, material) => sum + material.totalWeight, 0) || 0) / 1000 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            Weight limit exceeded
                          </span>
                        )}
                        {!vehicle.isApproved && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                            Not approved
                          </span>
                        )}
                        {vehicle.status !== 'available' && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                            Not available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* No Vehicles State */}
      {vehicles.length === 0 && (
        <div className="text-center py-8">
          <TruckIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-slate-900 mb-2">No Vehicles Available</h4>
          <p className="text-slate-600 mb-4">
            You need to add vehicles to your account before applying for loads.
          </p>
          <Button onClick={() => window.location.href = '/add-vehicle'}>
            Add Your First Vehicle
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      {compatibleVehicles.length > 0 && (
        <div className="flex space-x-4 pt-6 border-t border-slate-200">
          <Button
            onClick={handleConfirmSelection}
            disabled={!selectedVehicle}
            loading={loading}
            className="flex-1"
          >
            Confirm Application
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};