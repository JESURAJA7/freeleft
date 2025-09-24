import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  IndianRupee,
  Calendar,
  MapPin,
  Truck,
  Scale
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/CustomButton';
import { Input } from '../common/CustomInput';
import { biddingAPI } from '../../services/api';
import type { Load } from '../../types';
import toast from 'react-hot-toast';

interface CreateBiddingModalProps {
  isOpen: boolean;
  onClose: () => void;
  load: Load | null;
  onBiddingCreated: () => void;
}

export const CreateBiddingModal: React.FC<CreateBiddingModalProps> = ({
  isOpen,
  onClose,
  load,
  onBiddingCreated
}) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [minBidAmount, setMinBidAmount] = useState('');
  const [maxBidAmount, setMaxBidAmount] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateBidding = async () => {
    if (!load || !startTime || !endTime) {
      toast.error('Please fill all required fields');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < now) {
      toast.error('Start time cannot be in the past');
      return;
    }

    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      setCreating(true);
      await biddingAPI.createBiddingSession(
        load._id,
        start.toISOString(),
        end.toISOString(),
        minBidAmount ? Number(minBidAmount) : undefined,
        maxBidAmount ? Number(maxBidAmount) : undefined
      );

      toast.success('Bidding session created successfully!');
      onBiddingCreated();
      onClose();
      
      // Reset form
      setStartTime('');
      setEndTime('');
      setMinBidAmount('');
      setMaxBidAmount('');
    } catch (error: any) {
      console.error('Error creating bidding session:', error);
      toast.error(error.response?.data?.message || 'Failed to create bidding session');
    } finally {
      setCreating(false);
    }
  };

  if (!load) return null;

  const totalWeight = load.materials?.reduce((sum, material) => sum + material.totalWeight, 0) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 -m-6 mb-6">
          <h2 className="text-2xl font-bold mb-2">Create Bidding Session</h2>
          <p className="text-purple-100">
            {load.loadingLocation.place} → {load.unloadingLocation.place}
          </p>
        </div>

        {/* Load Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Load Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Truck className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800 font-medium">Vehicle</span>
              </div>
              <p className="text-blue-700">{load.vehicleRequirement.size}ft {load.vehicleRequirement.vehicleType}</p>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Scale className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-800 font-medium">Weight</span>
              </div>
              <p className="text-emerald-700">{totalWeight.toLocaleString()} kg</p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-orange-800 font-medium">Loading</span>
              </div>
              <p className="text-orange-700">{new Date(load.loadingDate).toLocaleDateString()}</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <IndianRupee className="h-4 w-4 text-purple-600" />
                <span className="text-purple-800 font-medium">Payment</span>
              </div>
              <p className="text-purple-700 uppercase">{load.paymentTerms}</p>
            </div>
          </div>
        </div>

        {/* Bidding Configuration */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Bidding Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-purple-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Time *
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                min={startTime || new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Minimum Bid Amount (₹) - Optional
              </label>
              <Input
                type="number"
                placeholder="e.g., 10000"
                value={minBidAmount}
                onChange={setMinBidAmount}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Maximum Bid Amount (₹) - Optional
              </label>
              <Input
                type="number"
                placeholder="e.g., 50000"
                value={maxBidAmount}
                onChange={setMaxBidAmount}
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-medium text-blue-800 mb-2">Bidding Rules</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Vehicle owners can place or update bids until the session ends</li>
              <li>• All bids are visible to all participants for transparency</li>
              <li>• You can select the winning bid after the session closes</li>
              <li>• The session will automatically close at the specified end time</li>
            </ul>
          </div>
        </div>

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
            onClick={handleCreateBidding}
            loading={creating}
            disabled={!startTime || !endTime}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            icon={<Clock className="h-4 w-4" />}
          >
            Start Bidding Session
          </Button>
        </div>
      </div>
    </Modal>
  );
};