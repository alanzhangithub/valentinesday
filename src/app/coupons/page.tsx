'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import CouponCard from '@/components/coupons/CouponCard';
import { Coupon, User } from '@/types/coupon';

type FilterType = 'all' | 'available' | 'redeemed' | 'expired';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  // TODO: get from auth context when auth worktree is merged
  const currentUser: User = 'beedo';

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('filter', filter);
      }
      const response = await fetch(`/api/coupons?${params.toString()}`);
      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [filter]);

  const handleRedeem = async (couponId: string) => {
    setRedeemingId(couponId);
    try {
      const response = await fetch('/api/coupons/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_id: couponId,
          redeemed_by: currentUser,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(data.message);
        // refresh the list
        await fetchCoupons();
        // hide success after 3 seconds
        setTimeout(() => setShowSuccess(null), 3000);
      } else {
        alert(data.error || 'Failed to redeem coupon');
      }
    } catch (error) {
      console.error('Failed to redeem:', error);
      alert('Something went wrong');
    } finally {
      setRedeemingId(null);
    }
  };

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'available', label: 'Available' },
    { key: 'redeemed', label: 'Redeemed' },
    { key: 'expired', label: 'Expired' },
  ];

  const getEmptyMessage = () => {
    switch (filter) {
      case 'available':
        return 'no available coupons right now. maybe create one?';
      case 'redeemed':
        return 'no redeemed coupons yet. go use some!';
      case 'expired':
        return 'no expired coupons. nice!';
      default:
        return 'no coupons yet. time to make some!';
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="w-16 h-16 relative">
              <Image src="/meedo.png" alt="Meedo" fill className="object-contain" />
            </div>
            <h1 className="font-carrots text-5xl">Coupon Book</h1>
            <div className="w-16 h-16 relative">
              <Image src="/beedo.png" alt="Beedo" fill className="object-contain" />
            </div>
          </div>
          <p className="text-gray-600">
            little gifts from meedo to beedo (and beedo to meedo)
          </p>
        </div>

        {/* success toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 font-carrots"
            >
              {showSuccess}
            </motion.div>
          )}
        </AnimatePresence>

        {/* actions */}
        <div className="flex justify-between items-center mb-6">
          {/* filter tabs */}
          <div className="flex gap-2">
            {filterTabs.map((tab) => (
              <motion.button
                key={tab.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* create button */}
          <Link href="/coupons/create">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-black text-white rounded-xl font-carrots hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Create Coupon
            </motion.button>
          </Link>
        </div>

        {/* coupons grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-black border-t-transparent rounded-full mx-auto"
            />
            <p className="mt-4 text-gray-500">loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 relative mx-auto mb-4 opacity-50">
              <Image src="/beedo.png" alt="Beedo" fill className="object-contain" />
            </div>
            <p className="text-gray-500">{getEmptyMessage()}</p>
            <Link href="/coupons/create">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4 px-6 py-2 bg-black text-white rounded-xl font-carrots hover:bg-gray-800"
              >
                Create One
              </motion.button>
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 md:grid-cols-2"
          >
            <AnimatePresence mode="popLayout">
              {coupons.map((coupon) => (
                <motion.div
                  key={coupon.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <CouponCard
                    coupon={coupon}
                    currentUser={currentUser}
                    onRedeem={redeemingId === coupon.id ? undefined : handleRedeem}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* back to home */}
        <div className="text-center mt-12">
          <Link href="/">
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              back to home
            </motion.span>
          </Link>
        </div>
      </div>
    </div>
  );
}
