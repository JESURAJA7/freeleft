import React from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  TruckIcon,
  MapPinIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from '../common/CustomButton';

interface LoadStatusTrackerProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  canUpdateStatus: boolean;
  loadingDate: string;
  assignedVehicle?: {
    vehicleNumber: string;
    ownerName: string;
  };
}

export const LoadStatusTracker: React.FC<LoadStatusTrackerProps> = ({
  currentStatus,
  onStatusChange,
  canUpdateStatus,
  loadingDate,
  assignedVehicle
}) => {
  const statusSteps = [
    {
      key: 'posted',
      label: 'Posted',
      description: 'Load posted and waiting for applications',
      icon: DocumentTextIcon,
      color: 'blue'
    },
    {
      key: 'assigned',
      label: 'Assigned',
      description: 'Vehicle assigned and confirmed',
      icon: TruckIcon,
      color: 'yellow'
    },
    {
      key: 'enroute',
      label: 'En Route',
      description: 'Vehicle is on the way to pickup/delivery',
      icon: MapPinIcon,
      color: 'orange'
    },
    {
      key: 'delivered',
      label: 'Delivered',
      description: 'Load delivered to destination',
      icon: CheckCircleIcon,
      color: 'green'
    },
    {
      key: 'completed',
      label: 'Completed',
      description: 'Transaction completed and rated',
      icon: CheckCircleIcon,
      color: 'slate'
    }
  ];

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === currentStatus);
  };

  const getNextStatus = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < statusSteps.length - 1) {
      return statusSteps[currentIndex + 1].key;
    }
    return null;
  };

  const canAdvanceToNext = () => {
    const currentIndex = getCurrentStepIndex();
    return canUpdateStatus && currentIndex < statusSteps.length - 1;
  };

  return (
    <div className="space-y-6">
      {/* Status Timeline */}
      <div className="relative">
        {statusSteps.map((step, index) => {
          const isCompleted = index <= getCurrentStepIndex();
          const isCurrent = step.key === currentStatus;
          const Icon = step.icon;
          
          return (
            <div key={step.key} className="relative flex items-center mb-8 last:mb-0">
              {/* Connector Line */}
              {index < statusSteps.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-slate-200">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`w-full bg-${step.color}-500`}
                  />
                </div>
              )}
              
              {/* Step Circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`relative z-10 h-12 w-12 rounded-full border-2 flex items-center justify-center ${
                  isCompleted
                    ? `bg-${step.color}-500 border-${step.color}-500 text-white`
                    : isCurrent
                    ? `bg-white border-${step.color}-500 text-${step.color}-500`
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
              
              {/* Step Content */}
              <div className="ml-6 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold ${
                      isCompleted ? 'text-slate-900' : isCurrent ? 'text-slate-900' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </h3>
                    <p className={`text-sm ${
                      isCompleted ? 'text-slate-600' : isCurrent ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                      {step.description}
                    </p>
                    
                    {/* Additional Info */}
                    {step.key === 'assigned' && assignedVehicle && isCompleted && (
                      <div className="mt-2 text-sm text-slate-600">
                        <p>Vehicle: {assignedVehicle.vehicleNumber}</p>
                        <p>Owner: {assignedVehicle.ownerName}</p>
                      </div>
                    )}
                    
                    {step.key === 'posted' && (
                      <div className="mt-2 text-sm text-slate-600">
                        <p>Loading Date: {new Date(loadingDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  {isCurrent && canAdvanceToNext() && (
                    <Button
                      onClick={() => onStatusChange(getNextStatus()!)}
                      size="sm"
                      className={`bg-${step.color}-600 hover:bg-${step.color}-700`}
                    >
                      Mark as {statusSteps[getCurrentStepIndex() + 1]?.label}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Status Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-2">
          <ClockIcon className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-800">Current Status</span>
        </div>
        <p className="text-blue-700 capitalize font-semibold">{currentStatus}</p>
        <p className="text-blue-600 text-sm mt-1">
          {statusSteps.find(step => step.key === currentStatus)?.description}
        </p>
      </div>
    </div>
  );
};