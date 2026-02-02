'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PhotoGrid from '@/components/photos/PhotoGrid';
import Slideshow from '@/components/photos/Slideshow';
import type { Photo } from '@/types/database';

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slideshowPhoto, setSlideshowPhoto] = useState<{ photo: Photo; index: number } | null>(null);
  const [filter, setFilter] = useState<'all' | 'meedo' | 'beedo'>('all');

  const fetchPhotos = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/photos');
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'failed to fetch photos');
      }

      setPhotos(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handlePhotoClick = (photo: Photo, index: number) => {
    setSlideshowPhoto({ photo, index });
  };

  const handleDeletePhoto = async (photo: Photo) => {
    if (!confirm('delete this memory? :(')) return;

    try {
      const res = await fetch(`/api/photos?id=${photo.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'failed to delete');
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'delete failed :(');
    }
  };

  const filteredPhotos = photos.filter((photo) => {
    if (filter === 'all') return true;
    return photo.uploaded_by === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                ← back home
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">our memories</h1>
              <p className="text-gray-500 text-sm">
                {photos.length} photo{photos.length !== 1 ? 's' : ''} of meedo and beedo
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter buttons */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['all', 'meedo', 'beedo'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {f === 'all' ? 'all' : f === 'meedo' ? 'M' : 'B'}
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <Link
                href="/photos/slideshow"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                slideshow
              </Link>
              <Link
                href="/photos/upload"
                className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
              >
                + upload
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchPhotos}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              try again
            </button>
          </div>
        ) : (
          <PhotoGrid
            photos={filteredPhotos}
            isLoading={isLoading}
            onPhotoClick={handlePhotoClick}
            onDeletePhoto={handleDeletePhoto}
          />
        )}
      </main>

      {/* Slideshow modal */}
      {slideshowPhoto && (
        <Slideshow
          photos={filteredPhotos}
          initialIndex={slideshowPhoto.index}
          autoAdvance={false}
          onClose={() => setSlideshowPhoto(null)}
        />
      )}
    </div>
  );
}
