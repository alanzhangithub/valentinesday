'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Slideshow from '@/components/photos/Slideshow';
import type { Photo } from '@/types/database';

export default function SlideshowPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
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
    };

    fetchPhotos();
  }, []);

  const handleClose = () => {
    router.push('/photos');
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-4 animate-pulse">~</div>
          <p>loading memories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200"
          >
            go back
          </button>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-center px-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto mb-4 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-lg mb-2">no photos yet</p>
          <p className="text-gray-500 mb-6">upload some memories first</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              go back
            </button>
            <a
              href="/photos/upload"
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              upload photos
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Slideshow
      photos={photos}
      initialIndex={0}
      autoAdvance={true}
      autoAdvanceInterval={4000}
      onClose={handleClose}
    />
  );
}
