'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { Photo } from '@/types/database';

interface SlideshowProps {
  photos: Photo[];
  initialIndex?: number;
  autoAdvance?: boolean;
  autoAdvanceInterval?: number; // in milliseconds
  onClose?: () => void;
}

export default function Slideshow({
  photos,
  initialIndex = 0,
  autoAdvance = true,
  autoAdvanceInterval = 4000,
  onClose,
}: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(autoAdvance);
  const [direction, setDirection] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const currentPhoto = photos[currentIndex];

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const goToIndex = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  // Auto-advance
  useEffect(() => {
    if (!isPlaying || photos.length <= 1) return;

    const timer = setInterval(goToNext, autoAdvanceInterval);
    return () => clearInterval(timer);
  }, [isPlaying, autoAdvanceInterval, goToNext, photos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          goToNext();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'Escape':
          onClose?.();
          break;
        case 'p':
          setIsPlaying((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    resetTimer();
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, []);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  if (!currentPhoto) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
        <p>no photos to show :(</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Main image area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentPhoto.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            <Image
              src={currentPhoto.url}
              alt={currentPhoto.caption || 'meedo and beedo memory'}
              fill
              className="object-contain"
              priority
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        <AnimatePresence>
          {showControls && photos.length > 1 && (
            <>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={goToPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </motion.button>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </motion.button>
            </>
          )}
        </AnimatePresence>

        {/* Caption */}
        <AnimatePresence>
          {showControls && currentPhoto.caption && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-24 left-0 right-0 text-center"
            >
              <p className="inline-block bg-black/50 text-white px-6 py-3 rounded-full backdrop-blur-sm">
                {currentPhoto.caption}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-gradient-to-t from-black/80 to-transparent pt-8 pb-6 px-6"
          >
            {/* Thumbnail strip */}
            <div className="flex justify-center gap-2 mb-4 overflow-x-auto pb-2">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => goToIndex(index)}
                  className={`
                    relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0
                    transition-all duration-200
                    ${
                      index === currentIndex
                        ? 'ring-2 ring-white scale-110'
                        : 'opacity-50 hover:opacity-100'
                    }
                  `}
                >
                  <Image
                    src={photo.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </button>
              ))}
            </div>

            {/* Control bar */}
            <div className="flex items-center justify-between text-white">
              {/* Close button */}
              <button
                onClick={onClose}
                className="px-4 py-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                close
              </button>

              {/* Play/pause and counter */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  {isPlaying ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 9v6m4-6v6"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 ml-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                    </svg>
                  )}
                </button>

                <span className="text-sm">
                  {currentIndex + 1} / {photos.length}
                </span>
              </div>

              {/* Uploaded by */}
              <div className="px-4 py-2">
                <span className="text-sm text-gray-400">
                  by {currentPhoto.uploaded_by}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      {isPlaying && (
        <motion.div
          key={`progress-${currentIndex}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: autoAdvanceInterval / 1000, ease: 'linear' }}
          className="absolute top-0 left-0 right-0 h-1 bg-white origin-left"
        />
      )}
    </div>
  );
}
