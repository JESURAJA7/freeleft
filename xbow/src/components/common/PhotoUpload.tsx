import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PhotoIcon,
    DocumentIcon,
    CloudArrowUpIcon,
    XMarkIcon,
    EyeIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

interface PhotoUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    preview?: string;
    className?: string;
    multiple?: boolean;
    maxFiles?: number;
    label?: string;
    helperText?: string;
    required?: boolean;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
    onFileSelect,
    accept = 'image/*',
    preview,
    className = '',
    multiple = false,
    maxFiles = 1,
    label,
    helperText,
    required = false
}) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            onFileSelect(file);

            if (multiple) {
                setUploadedFiles(prev => [...prev, ...acceptedFiles.slice(0, maxFiles - prev.length)]);
                const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
                setPreviews(prev => [...prev, ...newPreviews]);
            }
        }
    }, [onFileSelect, multiple, maxFiles]);

    const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
        onDrop,
        accept: accept.split(',').reduce((acc, type) => ({ ...acc, [type.trim()]: [] }), {}),
        multiple,
        maxFiles,
        onDragEnter: () => setIsDragActive(true),
        onDragLeave: () => setIsDragActive(false),
        onDropAccepted: () => setIsDragActive(false),
        onDropRejected: () => setIsDragActive(false)
    });

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const isImage = accept.includes('image');
    const Icon = isImage ? PhotoIcon : DocumentIcon;

    return (
        <div className={`space-y-4 ${className}`}>
            {label && (
                <label className="block text-sm font-semibold text-slate-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Upload Area */}
   <div
    {...getRootProps()}
    className={`
        relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
        ${isDragActive || dropzoneActive
            ? 'border-blue-400 bg-blue-50 scale-105'
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
        }
    `}
>
    <input {...getInputProps()} />

    <AnimatePresence mode="wait">
        {preview || (previews.length > 0 && !multiple) ? (
            <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative"
            >
                {isImage ? (
                    <img
                        src={preview || previews[0]}
                        alt="Preview"
                        className="max-w-full h-48 object-contain mx-auto rounded-lg"
                    />
                ) : (
                    <div className="flex items-center justify-center h-48">
                        <div className="text-center">
                            <DocumentIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-600">Document uploaded</p>
                        </div>
                    </div>
                )}

                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                    <div className="opacity-0 hover:opacity-100 transition-opacity">
                        <div className="bg-white rounded-full p-2 shadow-lg">
                            <EyeIcon className="h-5 w-5 text-slate-600" />
                        </div>
                    </div>
                </div>
            </motion.div>
        ) : (
            <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
            >
                <motion.div
                    animate={{
                        y: isDragActive ? -5 : 0,
                        scale: isDragActive ? 1.1 : 1
                    }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <CloudArrowUpIcon className={`h-16 w-16 mx-auto ${isDragActive ? 'text-blue-500' : 'text-slate-400'}`} />
                </motion.div>

                <div>
                    <p className="text-lg font-semibold text-slate-900 mb-2">
                        {isDragActive ? 'Drop files here' : `Upload ${isImage ? 'Photo' : 'Document'}`}
                    </p>
                    <p className="text-slate-600">
                        Drag and drop {multiple ? 'files' : 'a file'} here, or{' '}
                        <span className="text-blue-600 font-medium">click to browse</span>
                    </p>
                    {helperText && (
                        <p className="text-sm text-slate-500 mt-2">{helperText}</p>
                    )}
                </div>
            </motion.div>
        )}
    </AnimatePresence>
</div>

            {/* Multiple Files Preview */}
            {multiple && uploadedFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <AnimatePresence>
                        {uploadedFiles.map((file, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="relative group"
                            >
                                <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                                    {isImage ? (
                                        <img
                                            src={previews[index]}
                                            alt={`Upload ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <DocumentIcon className="h-8 w-8 text-slate-400" />
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => removeFile(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>

                                <p className="text-xs text-slate-600 mt-2 truncate">{file.name}</p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* File Info */}
            {(preview || uploadedFiles.length > 0) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 rounded-xl p-4"
                >
                    <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        <span className="text-green-800 font-medium">
                            {multiple
                                ? `${uploadedFiles.length} file(s) selected`
                                : 'File selected successfully'
                            }
                        </span>
                    </div>
                </motion.div>
            )}
        </div>
    );
};