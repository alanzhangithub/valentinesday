'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PhotoUploader from '@/components/photos/PhotoUploader';
import type { UserRole } from '@/types/database';

export default function UploadPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('meedo');
  const [uploadCount, setUploadCount] = useState(0);

  const handleUpload = async (files: File[], caption?: string) => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    if (caption) {
      formData.append('caption', caption);
    }

    formData.append('uploaded_by', userRole);

    const res = await fetch('/api/photos', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'upload failed');
    }

    setUploadCount((prev) => prev + files.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/photos" className="text-sm text-gray-500 hover:text-gray-700">
            ← back to gallery
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">upload memories</h1>
          <p className="text-gray-500 text-sm">add some new pics to your collection</p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            who's uploading?
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setUserRole('meedo')}
              className={`flex-1 py-4 rounded-xl border-2 transition-all ${
                userRole === 'meedo'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="text-3xl block mb-1">M</span>
              <span className="text-sm">meedo</span>
            </button>
            <button
              onClick={() => setUserRole('beedo')}
              className={`flex-1 py-4 rounded-xl border-2 transition-all ${
                userRole === 'beedo'
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="text-3xl block mb-1">B</span>
              <span className="text-sm">beedo</span>
            </button>
          </div>
        </div>

        {/* Uploader */}
        <PhotoUploader
          onUpload={handleUpload}
          userRole={userRole}
          maxFiles={10}
          maxSizeMB={10}
        />

        {/* Success message */}
        {uploadCount > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-700">
              uploaded {uploadCount} photo{uploadCount !== 1 ? 's' : ''}!
            </p>
            <button
              onClick={() => router.push('/photos')}
              className="mt-2 text-green-600 hover:text-green-800 text-sm font-medium"
            >
              view gallery →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
