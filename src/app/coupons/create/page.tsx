'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import CouponForm from '@/components/coupons/CouponForm';
import { CreateCouponRequest, User } from '@/types/coupon';

export default function CreateCouponPage() {
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [lastCreated, setLastCreated] = useState<string | null>(null);

  // TODO: get from auth context when auth worktree is merged
  const currentUser = 'beedo' as User;

  const handleSubmit = async (data: CreateCouponRequest) => {
    const response = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create coupon');
    }

    const result = await response.json();
    setLastCreated(result.coupon.title);
    setShowPreview(true);
  };

  const recipientName = currentUser === 'meedo' ? 'Beedo' : 'Meedo';
  const creatorName = currentUser === 'meedo' ? 'Meedo' : 'Beedo';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* header */}
        <div className="text-center mb-8">
          <Link href="/coupons">
            <motion.span
              whileHover={{ x: -5 }}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer mb-4"
            >
              <span>&#8592;</span> back to coupons
            </motion.span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center items-center gap-3 mt-4"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-12 h-12 relative"
            >
              <Image
                src={currentUser === 'meedo' ? '/meedo.png' : '/beedo.png'}
                alt={creatorName}
                fill
                className="object-contain"
              />
            </motion.div>
            <h1 className="font-heading text-4xl">New Coupon</h1>
            <span className="text-2xl text-pink-400">&#10084;</span>
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              className="w-12 h-12 relative"
            >
              <Image
                src={currentUser === 'meedo' ? '/beedo.png' : '/meedo.png'}
                alt={recipientName}
                fill
                className="object-contain"
              />
            </motion.div>
          </motion.div>
          <p className="text-gray-600 mt-2">
            creating as <span className="font-medium">{creatorName}</span> for{' '}
            <span className="font-medium">{recipientName}</span>
          </p>
        </div>

        {/* success state */}
        {showPreview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl border-4 border-black p-8 text-center shadow-lg"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5 }}
              className="w-24 h-24 relative mx-auto mb-4"
            >
              <Image
                src={currentUser === 'meedo' ? '/meedo.png' : '/beedo.png'}
                alt={creatorName}
                fill
                className="object-contain"
              />
            </motion.div>
            <h2 className="font-heading text-3xl mb-2">Coupon Created!</h2>
            <p className="text-gray-600 mb-2">
              {`"${lastCreated}" is ready for ${recipientName} to redeem`}
            </p>
            <p className="text-pink-400 text-sm mb-6">
              such a sweet gift from {creatorName}
            </p>

            <div className="flex gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowPreview(false);
                  setLastCreated(null);
                }}
                className="px-6 py-2 rounded-xl border-2 border-black font-heading hover:bg-gray-100 transition-colors"
              >
                Create Another
              </motion.button>
              <Link href="/coupons">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 rounded-xl bg-black text-white font-heading hover:bg-gray-800 transition-colors"
                >
                  View All Coupons
                </motion.button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <CouponForm
            currentUser={currentUser}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/coupons')}
          />
        )}

        {/* tips section */}
        {!showPreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 p-6 bg-card rounded-2xl border-2 border-border shadow-sm"
          >
            <h3 className="font-heading text-xl mb-3 flex items-center gap-2">
              <span>&#128161;</span> coupon tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-0.5">&#10084;</span>
                <span>
                  <span className="font-medium">be specific</span> - {`"one 15-min backrub" is better
                  than just "backrub"`}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-0.5">&#10084;</span>
                <span>
                  <span className="font-medium">make it redeemable</span> - don&apos;t promise something
                  you can&apos;t deliver
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-0.5">&#10084;</span>
                <span>
                  <span className="font-medium">expiry is optional</span> - some coupons are better
                  without a deadline
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-0.5">&#10084;</span>
                <span>
                  <span className="font-medium">have fun with it</span> - silly coupons are valid
                  coupons
                </span>
              </li>
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}
