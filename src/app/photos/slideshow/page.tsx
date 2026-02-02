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
        <div className="text-white text-center">
          <div className="text-6xl mb-4">:(</div>
          <p className="text-lg mb-2">no photos yet</p>
          <p className="text-gray-400 mb-6">upload some memories first!</p>
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
