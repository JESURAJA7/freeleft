import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { StarIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { Modal } from '../common/Modal';
import { Button } from '../common/CustomButton';
import { vehicleMatchingAPI } from '../../services/api';
import type { Load, Vehicle } from '../../types/index';
import toast from 'react-hot-toast';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  load: Load | null;
  vehicle: Vehicle | null;
  userType: 'load_provider' | 'vehicle_owner';
  onRatingSubmitted: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  load,
  vehicle,
  userType,
  onRatingSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitRating = async () => {
    if (!load || !vehicle || rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    try {
      setSubmitting(true);
      await vehicleMatchingAPI.submitRating(
        load._id,
        vehicle._id,
        rating,
        comment.trim() || undefined
      );
      
      toast.success('Rating submitted successfully!');
      onRatingSubmitted();
      onClose();
      
      // Reset form
      setRating(0);
      setComment('');
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingText = (stars: number) => {
    switch (stars) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select Rating';
    }
  };

  const getTargetName = () => {
    if (userType === 'load_provider') {
      return vehicle?.ownerName || 'Vehicle Owner';
    }
    return load?.loadProviderName || 'Load Provider';
  };

  if (!load || !vehicle) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <StarIcon className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Rate Your Experience</h2>
          <p className="text-slate-600">
            How was your experience with {getTargetName()}?
          </p>
        </div>

        {/* Load/Vehicle Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Load:</span>
              <p className="font-medium text-slate-900">
                {load.loadingLocation.place} → {load.unloadingLocation.place}
              </p>
            </div>
            <div>
              <span className="text-slate-600">Vehicle:</span>
              <p className="font-medium text-slate-900">{vehicle.vehicleNumber}</p>
            </div>
            <div>
              <span className="text-slate-600">Completed:</span>
              <p className="font-medium text-slate-900">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-slate-600">Partner:</span>
              <p className="font-medium text-slate-900">{getTargetName()}</p>
            </div>
          </div>
        </div>

        {/* Rating Stars */}
        <div className="text-center">
          <h3 className="font-semibold text-slate-900 mb-4">Overall Rating</h3>
          <div className="flex items-center justify-center space-x-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= (hoveredRating || rating);
              const StarComponent = isFilled ? StarSolidIcon : StarIcon;
              
              return (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <StarComponent 
                    className={`h-8 w-8 transition-colors ${
                      isFilled ? 'text-yellow-400' : 'text-slate-300'
                    }`} 
                  />
                </motion.button>
              );
            })}
          </div>
          <p className="text-sm font-medium text-slate-700">
            {getRatingText(hoveredRating || rating)}
          </p>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Comments (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Share your experience with ${getTargetName()}...`}
            rows={4}
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleSubmitRating}
            loading={submitting}
            disabled={rating === 0}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600"
            icon={<StarIcon className="h-4 w-4" />}
          >
            Submit Rating
          </Button>
        </div>
      </div>
    </Modal>
  );
};