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
      <header className="bg-card border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Top row - back link and actions */}
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              ← back home
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/photos/slideshow"
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <span className="hidden sm:inline">slideshow</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>
              <Link
                href="/photos/upload"
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
              >
                <span className="hidden sm:inline">+ upload</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Title row */}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">our memories</h1>
              <p className="text-gray-500 text-sm">
                {photos.length} photo{photos.length !== 1 ? 's' : ''} of meedo and beedo
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['all', 'meedo', 'beedo'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-gray-600 hover:text-foreground'
                  }`}
                >
                  {f === 'all' ? 'all' : f === 'meedo' ? 'M' : 'B'}
                </button>
              ))}
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
