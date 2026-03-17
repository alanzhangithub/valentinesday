'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// available stickers - add more as you create them
const STICKER_CATEGORIES = {
  meedo: [
    '/stickers/meedo-happy.svg',
    '/stickers/meedo-love.svg',
    '/stickers/meedo-wink.svg',
    '/stickers/meedo-thinking.svg',
    '/stickers/meedo-excited.svg',
    '/stickers/meedo-sleepy.svg',
  ],
  beedo: [
    '/stickers/beedo-happy.svg',
    '/stickers/beedo-love.svg',
    '/stickers/beedo-mischief.svg',
    '/stickers/beedo-bow.svg',
    '/stickers/beedo-giggle.svg',
    '/stickers/beedo-pout.svg',
  ],
  together: [
    '/stickers/meedo-beedo-hug.svg',
    '/stickers/meedo-beedo-heart.svg',
    '/stickers/meedo-beedo-kiss.svg',
    '/stickers/meedo-beedo-dance.svg',
  ],
  decorations: [
    '/stickers/heart.svg',
    '/stickers/star.svg',
    '/stickers/sparkle.svg',
    '/stickers/arrow.svg',
    '/stickers/cloud.svg',
    '/stickers/flower.svg',
  ],
};

interface StickerLibraryProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function StickerLibrary({ isOpen, onToggle }: StickerLibraryProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof STICKER_CATEGORIES>('meedo');
  const [loadErrors, setLoadErrors] = useState<Set<string>>(new Set());

  const handleDragStart = (e: React.DragEvent, src: string) => {
    e.dataTransfer.setData('sticker-src', src);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleImageError = (src: string) => {
    setLoadErrors((prev) => new Set([...prev, src]));
  };

  const categories = Object.keys(STICKER_CATEGORIES) as Array<keyof typeof STICKER_CATEGORIES>;

  return (
    <>
      {/* Toggle button when closed */}
      {!isOpen && (
        <motion.button
          initial={{ x: -100 }}
          animate={{ x: 0 }}
          onClick={onToggle}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-card shadow-lg rounded-r-xl px-3 py-4 hover:bg-gray-50 transition-colors z-20"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.button>
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute left-0 top-0 bottom-0 w-72 bg-card shadow-xl z-20 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-800">stickers</h2>
              <button
                onClick={onToggle}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 p-2 border-b overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sticker grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-3">
                {STICKER_CATEGORIES[activeCategory].map((src) => (
                  <motion.div
                    key={src}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    draggable
                    onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, src)}
                    className="aspect-square bg-gray-50 rounded-xl p-2 cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors flex items-center justify-center"
                  >
                    {!loadErrors.has(src) ? (
                      <Image
                        src={src}
                        alt="sticker"
                        width={60}
                        height={60}
                        className="pointer-events-none"
                        draggable={false}
                        onError={() => handleImageError(src)}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-muted-foreground/70">?</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Hint */}
              <p className="text-xs text-muted-foreground/70 text-center mt-4">
                drag stickers onto the board
              </p>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                made with love by meedo
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
