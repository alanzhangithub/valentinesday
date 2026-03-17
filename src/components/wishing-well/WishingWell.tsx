'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WishingWellProps {
  onWishSubmit: (text: string) => Promise<void>;
  isSubmitting: boolean;
  currentUser?: 'meedo' | 'beedo';
}

export default function WishingWell({ onWishSubmit, isSubmitting, currentUser = 'beedo' }: WishingWellProps) {
  const [wishText, setWishText] = useState('');
  const [showCoin, setShowCoin] = useState(false);
  const [showMagic, setShowMagic] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishText.trim() || isSubmitting) return;

    // Show coin drop animation
    setShowCoin(true);

    // Show magic effect after coin drops
    setTimeout(() => setShowMagic(true), 800);

    await onWishSubmit(wishText.trim());

    // Reset after animation
    setTimeout(() => {
      setShowCoin(false);
      setShowMagic(false);
      setWishText('');
    }, 2000);
  };

  const wishTemplates = [
    'a date night at...',
    'more cuddle time...',
    'a surprise adventure...',
    'breakfast in bed...',
    'a movie marathon...',
  ];

  const randomTemplate = wishTemplates[Math.floor(Math.random() * wishTemplates.length)];

  return (
    <div className="relative flex flex-col items-center">
      {/* The Well */}
      <div className="relative w-80 h-96">
        {/* Magical glow behind the well */}
        <motion.div
          className="absolute inset-0 bg-gradient-radial from-purple-300/30 via-transparent to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        {/* Well structure - stone/brick aesthetic */}
        <div className="absolute bottom-0 w-full">
          {/* Well base (circular top) */}
          <div className="relative">
            {/* Well rim with gradient */}
            <div className="w-full h-8 bg-gradient-to-b from-gray-600 to-gray-700 rounded-t-full border-4 border-black shadow-inner" />

            {/* Well opening (dark hole with glow) */}
            <div className="w-64 h-6 mx-auto bg-gradient-to-b from-indigo-950 to-black rounded-b-full -mt-2 relative">
              {/* Inner glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent rounded-b-full"
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>

            {/* Well body */}
            <div className="w-full h-40 bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800 border-4 border-t-0 border-black rounded-b-3xl shadow-lg relative overflow-hidden">
              {/* Stone texture lines */}
              <div className="h-full flex flex-col justify-evenly px-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-full h-0.5 bg-gray-500 opacity-40"
                    style={{ marginLeft: i % 2 === 0 ? '10px' : '-10px' }}
                  />
                ))}
              </div>
              {/* Moss/age effect */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-green-900/20 to-transparent" />
            </div>
          </div>

          {/* Well roof posts */}
          <div className="absolute -top-48 left-8 w-4 h-48 bg-gradient-to-b from-amber-700 to-amber-900 border-2 border-black rounded shadow-md" />
          <div className="absolute -top-48 right-8 w-4 h-48 bg-gradient-to-b from-amber-700 to-amber-900 border-2 border-black rounded shadow-md" />

          {/* Well roof */}
          <div className="absolute -top-56 left-1/2 -translate-x-1/2 w-72">
            <div
              className="w-full h-16 bg-gradient-to-b from-amber-600 to-amber-800 border-4 border-black shadow-lg"
              style={{
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              }}
            />
            {/* Roof shingles effect */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                background: 'repeating-linear-gradient(180deg, transparent, transparent 4px, rgba(0,0,0,0.2) 4px, rgba(0,0,0,0.2) 8px)',
              }}
            />
          </div>

          {/* Bucket and rope */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2">
            {/* Rope */}
            <div className="w-1 h-20 bg-gradient-to-b from-amber-800 to-amber-900 mx-auto rounded" />
            {/* Bucket */}
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-10 h-12 bg-gradient-to-b from-amber-500 to-amber-700 border-2 border-black rounded-b-lg mx-auto shadow-md"
            >
              <div className="w-8 h-1 bg-amber-800 mx-auto mt-1 rounded" />
              {/* Bucket shine */}
              <div className="absolute top-2 left-1 w-1 h-4 bg-amber-400/30 rounded" />
            </motion.div>
          </div>
        </div>

        {/* Animated coin drop */}
        <AnimatePresence>
          {showCoin && (
            <motion.div
              initial={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
              animate={{ y: 200, opacity: 0, scale: 0.5, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeIn' }}
              className="absolute top-24 left-1/2 -translate-x-1/2 z-10"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full border-2 border-yellow-600 flex items-center justify-center text-yellow-700 font-bold text-sm shadow-lg">
                M
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Magic burst when wish is cast */}
        <AnimatePresence>
          {showMagic && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 180, x: 0, opacity: 1, scale: 0 }}
                  animate={{
                    y: 100 - Math.random() * 100,
                    x: (Math.random() - 0.5) * 150,
                    opacity: 0,
                    scale: 1,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: 'easeOut', delay: i * 0.05 }}
                  className="absolute left-1/2 text-2xl z-20"
                >
                  {['*', '+', '.'][i % 3]}
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Sparkles around the well */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-yellow-400/70 text-xl select-none"
            style={{
              top: `${15 + (i % 4) * 15}%`,
              left: `${5 + (i * 12)}%`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2 + (i % 3),
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
        <div className="bg-card/95 backdrop-blur-sm rounded-2xl border-4 border-black p-6 shadow-xl relative overflow-hidden">
          {/* Decorative corner flourishes */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-border rounded-tl" />
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-border rounded-tr" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-border rounded-bl" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-border rounded-br" />

          <label className="block font-heading text-2xl text-center mb-2">
            Cast Your Wish unto Mod
          </label>
          <p className="text-center text-muted-foreground/70 text-sm mb-4">
            wishing as {currentUser === 'meedo' ? 'Meedo' : 'Beedo'}
          </p>
          <textarea
            value={wishText}
            onChange={(e) => setWishText(e.target.value)}
            placeholder={`Dear Mod, I wish for ${randomTemplate}`}
            className="w-full h-32 p-4 border-2 border-border rounded-xl resize-none focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all text-lg bg-gray-50/50"
            maxLength={500}
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-4">
            <span className={`text-sm ${wishText.length > 400 ? 'text-amber-500' : 'text-muted-foreground/70'}`}>
              {wishText.length}/500
            </span>
            <motion.button
              type="submit"
              disabled={!wishText.trim() || isSubmitting}
              className="px-6 py-3 bg-black text-white rounded-xl font-heading text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block"
                  >
                    *
                  </motion.span>
                  Casting...
                </span>
              ) : (
                'Drop into the Well'
              )}
            </motion.button>
          </div>
        </div>
      </motion.form>

      {/* Flavor text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-gray-500 text-center italic max-w-sm"
      >
        Mod hears all wishes... but grants them at their divine discretion
      </motion.p>
    </div>
  );
}
