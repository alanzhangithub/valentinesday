'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WishingWellProps {
  onWishSubmit: (text: string) => Promise<void>;
  isSubmitting: boolean;
}

export default function WishingWell({ onWishSubmit, isSubmitting }: WishingWellProps) {
  const [wishText, setWishText] = useState('');
  const [showCoin, setShowCoin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishText.trim() || isSubmitting) return;

    // Show coin drop animation
    setShowCoin(true);

    await onWishSubmit(wishText.trim());

    // Reset after animation
    setTimeout(() => {
      setShowCoin(false);
      setWishText('');
    }, 1500);
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* The Well */}
      <div className="relative w-80 h-96">
        {/* Well structure - stone/brick aesthetic */}
        <div className="absolute bottom-0 w-full">
          {/* Well base (circular top) */}
          <div className="relative">
            {/* Well rim */}
            <div className="w-full h-8 bg-gray-700 rounded-t-full border-4 border-black" />

            {/* Well opening (dark hole) */}
            <div className="w-64 h-6 mx-auto bg-black rounded-b-full -mt-2" />

            {/* Well body */}
            <div className="w-full h-40 bg-gradient-to-b from-gray-600 to-gray-800 border-4 border-t-0 border-black rounded-b-3xl">
              {/* Stone texture lines */}
              <div className="h-full flex flex-col justify-evenly px-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-full h-0.5 bg-gray-500 opacity-50"
                    style={{ marginLeft: i % 2 === 0 ? '10px' : '-10px' }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Well roof posts */}
          <div className="absolute -top-48 left-8 w-4 h-48 bg-amber-800 border-2 border-black rounded" />
          <div className="absolute -top-48 right-8 w-4 h-48 bg-amber-800 border-2 border-black rounded" />

          {/* Well roof */}
          <div className="absolute -top-56 left-1/2 -translate-x-1/2 w-72">
            <div className="w-full h-16 bg-amber-700 border-4 border-black"
              style={{
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              }}
            />
          </div>

          {/* Bucket and rope */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2">
            <div className="w-0.5 h-20 bg-amber-900 mx-auto" />
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-10 h-12 bg-amber-600 border-2 border-black rounded-b-lg mx-auto"
            >
              <div className="w-8 h-1 bg-amber-800 mx-auto mt-1 rounded" />
            </motion.div>
          </div>
        </div>

        {/* Animated coin drop */}
        <AnimatePresence>
          {showCoin && (
            <motion.div
              initial={{ y: 0, opacity: 1, scale: 1 }}
              animate={{ y: 200, opacity: 0, scale: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeIn' }}
              className="absolute top-24 left-1/2 -translate-x-1/2 z-10"
            >
              <div className="w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-600 flex items-center justify-center text-yellow-600 font-bold text-xs">
                M
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sparkles around the well */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-yellow-300 text-xl"
            style={{
              top: `${20 + Math.random() * 30}%`,
              left: `${10 + (i * 15)}%`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            *
          </motion.div>
        ))}
      </div>

      {/* Wish input form */}
      <motion.form
        onSubmit={handleSubmit}
        className="mt-8 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-white rounded-2xl border-4 border-black p-6 shadow-lg">
          <label className="block font-carrots text-2xl text-center mb-4">
            Cast Your Wish unto Mod
          </label>
          <textarea
            value={wishText}
            onChange={(e) => setWishText(e.target.value)}
            placeholder="Dear Mod, I wish for..."
            className="w-full h-32 p-4 border-2 border-gray-300 rounded-xl resize-none focus:outline-none focus:border-black transition-colors font-cheeky text-lg"
            maxLength={500}
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-gray-400 text-sm">
              {wishText.length}/500
            </span>
            <motion.button
              type="submit"
              disabled={!wishText.trim() || isSubmitting}
              className="px-6 py-3 bg-black text-white rounded-xl font-carrots text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSubmitting ? 'Casting...' : 'Drop into the Well'}
            </motion.button>
          </div>
        </div>
      </motion.form>

      {/* Flavor text */}
      <p className="mt-4 text-gray-500 font-cheeky text-center italic">
        Mod hears all wishes... but grants them at their divine discretion
      </p>
    </div>
  );
}
