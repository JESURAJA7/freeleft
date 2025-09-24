import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './CustomButton';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
  fullScreen?: boolean; // Add fullScreen prop
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  fullScreen = false // Default to false
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl'
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  // Full screen styles
  if (fullScreen) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-sm transition-opacity"
              onClick={handleOverlayClick}
            />
            
            {/* Full Screen Modal Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                </div>
                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </motion.button>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  // Regular modal
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 py-8">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-sm transition-opacity"
              onClick={handleOverlayClick}
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className={`
                relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl 
                border border-slate-200 max-h-[90vh] overflow-hidden ${className}
              `}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                </div>
                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </motion.button>
                )}
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};


// Image Gallery Modal Component
interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{ url: string; type: string; id?: string }>;
  currentIndex: number;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onNavigate
}) => {
  const currentImage = images[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          onNavigate('prev');
          break;
        case 'ArrowRight':
          onNavigate('next');
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNavigate, onClose]);

  return (
    <AnimatePresence>
      {isOpen && currentImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => onNavigate('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-3"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={() => onNavigate('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-3"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Image */}
            <motion.img
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              src={currentImage.url}
              alt={currentImage.type}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Image Info */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center bg-black bg-opacity-50 rounded-xl px-4 py-2">
              <p className="font-medium capitalize">{currentImage.type.replace('_', ' ')}</p>
              <p className="text-sm text-gray-300">
                {currentIndex + 1} of {images.length}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Confirmation Modal Component
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info'
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: XMarkIcon,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          confirmButton: 'danger'
        };
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          iconColor: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          confirmButton: 'primary'
        };
      default:
        return {
          icon: InformationCircleIcon,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          confirmButton: 'primary'
        };
    }
  };

  const typeStyles = getTypeStyles();
  const Icon = typeStyles.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
      showCloseButton={false}
      className="text-center"
    >
      <div className="space-y-6">
        <div className={`mx-auto h-16 w-16 ${typeStyles.iconBg} rounded-full flex items-center justify-center`}>
          <Icon className={`h-8 w-8 ${typeStyles.iconColor}`} />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-600">{message}</p>
        </div>
        
        <div className="flex space-x-3 justify-center">
          <Button
            onClick={onClose}
            variant="outline"
          >
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            variant={typeStyles.confirmButton as any}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Loading Modal Component
interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  title = 'Processing...',
  message = 'Please wait while we process your request.'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title=""
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={false}
      className="text-center"
    >
      <div className="space-y-6">
        <div className="mx-auto">
          <LoadingSpinner size="xl" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-600">{message}</p>
        </div>
      </div>
    </Modal>
  );
};