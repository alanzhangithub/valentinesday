'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserRole } from '@/types/database';

interface PhotoUploaderProps {
  onUpload: (files: File[], caption?: string) => Promise<void>;
  userRole: UserRole;
  maxFiles?: number;
  maxSizeMB?: number;
}

interface PreviewFile {
  file: File;
  preview: string;
  id: string;
}

export default function PhotoUploader({
  onUpload,
  userRole,
  maxFiles = 10,
  maxSizeMB = 10,
}: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFiles = useCallback(
    (fileList: FileList | File[]): File[] => {
      const validFiles: File[] = [];
      const errors: string[] = [];

      Array.from(fileList).forEach((file) => {
        // Check file type
        if (!file.type.startsWith('image/')) {
          errors.push(`${file.name} is not an image`);
          return;
        }

        // Check file size
        if (file.size > maxSizeBytes) {
          errors.push(`${file.name} is too big (max ${maxSizeMB}MB)`);
          return;
        }

        validFiles.push(file);
      });

      // Check total count
      if (files.length + validFiles.length > maxFiles) {
        errors.push(`can only upload ${maxFiles} photos at once`);
        validFiles.splice(maxFiles - files.length);
      }

      if (errors.length > 0) {
        setError(errors.join(', '));
      }

      return validFiles;
    },
    [files.length, maxFiles, maxSizeBytes, maxSizeMB]
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      setError(null);
      const validFiles = validateFiles(newFiles);
      if (validFiles.length === 0) return;

      const newPreviewFiles: PreviewFile[] = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(7),
      }));
      setFiles((prev) => [...prev, ...newPreviewFiles]);
    },
    [validateFiles]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(Array.from(e.target.files));
      }
    },
    [addFiles]
  );

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      await onUpload(
        files.map((f) => f.file),
        caption || undefined
      );

      // Clean up previews
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      setFiles([]);
      setCaption('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'upload failed :(');
    } finally {
      setIsUploading(false);
    }
  };

  const clearAll = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setCaption('');
    setError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        animate={{
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? '#3b82f6' : '#e5e7eb',
        }}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="text-5xl">
            {isDragging ? '!!' : userRole === 'meedo' ? 'M' : 'B'}
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragging ? 'drop it like its hot' : 'drag photos here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse (max {maxFiles} photos, {maxSizeMB}MB each)
            </p>
          </div>
        </div>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview grid */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">
                {files.length} photo{files.length !== 1 ? 's' : ''} ready
              </span>
              <button
                onClick={clearAll}
                className="text-sm text-red-500 hover:text-red-600"
              >
                clear all
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative aspect-square rounded-lg overflow-hidden group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeFile(file.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Caption input */}
            <div className="mt-4">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="add a caption (optional)"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Upload button */}
            <motion.button
              onClick={handleUpload}
              disabled={isUploading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full mt-4 py-4 rounded-xl font-medium text-white
                transition-colors duration-200
                ${
                  isUploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-black hover:bg-gray-800'
                }
              `}
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block"
                  >
                    ~
                  </motion.span>
                  uploading...
                </span>
              ) : (
                `upload ${files.length} photo${files.length !== 1 ? 's' : ''}`
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
