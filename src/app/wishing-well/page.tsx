'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

import WishingWell from '@/components/wishing-well/WishingWell';
import WishList from '@/components/wishing-well/WishList';
import { Wish } from '@/types/wish';

// TODO: Replace with actual auth check
const MOCK_USER = 'beedo' as 'meedo' | 'beedo';
const IS_ADMIN = MOCK_USER === 'meedo'; // meedo is the admin/mod

export default function WishingWellPage() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'well' | 'history'>('well');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'pending' | 'resolved'>('all');

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
  const grantedCount = wishes.filter((w) => w.status === 'granted').length;

  const filteredWishes = wishes.filter((w) => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'pending') return w.status === 'pending';
    return w.status === 'granted' || w.status === 'denied';
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-amber-50 py-8 px-4 relative overflow-hidden">
      {/* Floating stars background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-yellow-300/40 text-2xl select-none"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scale: [0.8, 1.2, 0.8],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            *
          </motion.div>
        ))}
      </div>

      {/* Decorative meedo/beedo stickers */}
      <motion.div
        className="absolute top-20 left-4 w-16 h-16 md:w-24 md:h-24 opacity-20"
        animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity }}
      ></motion.div>

      {/* Header */}
      <div className="max-w-4xl mx-auto relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-6"
        >
          <span>&larr;</span>
          <span className="">Back to Meedobeedo</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-heading text-5xl md:text-6xl mb-2 text-foreground">The Wishing Well</h1>
          <p className="text-xl text-gray-600">
            Where dreams float up to Mod
          </p>

          {/* Stats badges */}
          <div className="flex justify-center gap-4 mt-4">
            <div className="bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-black/10 text-sm">
              <span className="text-amber-600 font-bold">{pendingCount}</span> awaiting judgment
            </div>
            <div className="bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-black/10 text-sm">
              <span className="text-green-600 font-bold">{grantedCount}</span> wishes granted
            </div>
          </div>
        </motion.div>

        {/* Tab navigation */}
        <div className="flex justify-center gap-4 mb-8">
          <motion.button
            onClick={() => setActiveTab('well')}
            className={`px-6 py-3 rounded-xl font-heading text-lg border-2 transition-all shadow-md ${
              activeTab === 'well'
                ? 'bg-black text-white border-black'
                : 'bg-card text-black border-gray-300 hover:border-black hover:shadow-lg'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Make a Wish
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-xl font-heading text-lg border-2 transition-all relative shadow-md ${
              activeTab === 'history'
                ? 'bg-black text-white border-black'
                : 'bg-card text-black border-gray-300 hover:border-black hover:shadow-lg'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Wish Chronicle
            {pendingCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 text-black text-xs font-bold rounded-full flex items-center justify-center border-2 border-black"
              >
                {pendingCount}
              </motion.span>
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
            <WishingWell onWishSubmit={handleWishSubmit} isSubmitting={isSubmitting} currentUser={MOCK_USER} />
          ) : (
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border-4 border-black p-6 shadow-xl">
              {/* Filter tabs for history */}
              <div className="flex justify-center gap-2 mb-6">
                {(['all', 'pending', 'resolved'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setHistoryFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      historyFilter === filter
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter === 'all' && 'All Wishes'}
                    {filter === 'pending' && `Pending (${pendingCount})`}
                    {filter === 'resolved' && 'Resolved'}
                  </button>
                ))}
              </div>

              <WishList
                wishes={filteredWishes}
                isAdmin={IS_ADMIN}
                onGrantWish={handleGrantWish}
                isLoading={isLoading}
                currentUser={MOCK_USER}
              />
            </div>
          )}
        </motion.div>

        {/* Footer flavor */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-muted-foreground/70 text-sm space-y-1"
        >
          <p>The Wishing Well has been here since the founding of Meedobeedo</p>
          <p>Legend says Mod checks it every day at midnight</p>
          <p className="text-xs mt-2 opacity-60">tip: be specific with your wishes... Mod appreciates clarity</p>
        </motion.div>
      </div>
    </div>
  );
}
