'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import WishingWell from '@/components/wishing-well/WishingWell';
import WishList from '@/components/wishing-well/WishList';
import { Wish } from '@/types/wish';

// TODO: Replace with actual auth check
const MOCK_USER: 'meedo' | 'beedo' = 'beedo';
const IS_ADMIN = MOCK_USER === 'meedo'; // meedo is the admin/mod

export default function WishingWellPage() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'well' | 'history'>('well');

  const fetchWishes = useCallback(async () => {
    try {
      const response = await fetch('/api/wishes');
      const data = await response.json();
      if (data.wishes) {
        setWishes(data.wishes);
      }
    } catch (error) {
      console.error('Failed to fetch wishes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishes();
  }, [fetchWishes]);

  const handleWishSubmit = async (text: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, wished_by: MOCK_USER }),
      });

      if (response.ok) {
        const data = await response.json();
        setWishes((prev) => [data.wish, ...prev]);
        // Switch to history to show the new wish
        setTimeout(() => setActiveTab('history'), 1500);
      }
    } catch (error) {
      console.error('Failed to submit wish:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrantWish = async (id: string, status: 'granted' | 'denied', note?: string) => {
    try {
      const response = await fetch('/api/wishes/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, status_note: note }),
      });

      if (response.ok) {
        const data = await response.json();
        setWishes((prev) =>
          prev.map((wish) => (wish.id === id ? data.wish : wish))
        );
      }
    } catch (error) {
      console.error('Failed to grant wish:', error);
    }
  };

  const pendingCount = wishes.filter((w) => w.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-amber-50 py-8 px-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-6"
        >
          <span>&larr;</span>
          <span className="font-cheeky">Back to Meedobeedo</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-carrots text-5xl mb-2">The Wishing Well</h1>
          <p className="font-cheeky text-xl text-gray-600">
            Where dreams float up to Mod
          </p>
        </motion.div>

        {/* Tab navigation */}
        <div className="flex justify-center gap-4 mb-8">
          <motion.button
            onClick={() => setActiveTab('well')}
            className={`px-6 py-3 rounded-xl font-carrots text-lg border-2 transition-all ${
              activeTab === 'well'
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-gray-300 hover:border-black'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Make a Wish
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-xl font-carrots text-lg border-2 transition-all relative ${
              activeTab === 'history'
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-gray-300 hover:border-black'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Wish History
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 text-black text-xs font-bold rounded-full flex items-center justify-center border-2 border-black">
                {pendingCount}
              </span>
            )}
          </motion.button>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'well' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'well' ? (
            <WishingWell onWishSubmit={handleWishSubmit} isSubmitting={isSubmitting} />
          ) : (
            <div className="bg-white rounded-2xl border-4 border-black p-6 shadow-lg">
              <WishList
                wishes={wishes}
                isAdmin={IS_ADMIN}
                onGrantWish={handleGrantWish}
                isLoading={isLoading}
              />
            </div>
          )}
        </motion.div>

        {/* Footer flavor */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-gray-400 font-cheeky text-sm"
        >
          <p>The Wishing Well has been here since the founding of Meedobeedo</p>
          <p>Legend says Mod checks it every day at midnight</p>
        </motion.div>
      </div>
    </div>
  );
}
