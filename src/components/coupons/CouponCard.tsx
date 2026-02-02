'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Coupon } from '@/types/coupon';

interface CouponCardProps {
  coupon: Coupon;
  onRedeem?: (couponId: string) => void;
  currentUser: 'meedo' | 'beedo';
}

const CouponCard: React.FC<CouponCardProps> = ({ coupon, onRedeem, currentUser }) => {
  const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
  const isRedeemed = coupon.redeemed;
  const canRedeem = !isExpired && !isRedeemed;

  // determine which character to show - creator gives to recipient
  const isFromMeedo = coupon.created_by === 'meedo';
  const characterImage = isFromMeedo ? '/meedo.png' : '/beedo.png';
  const characterName = isFromMeedo ? 'Meedo' : 'Beedo';

  const getStatusBadge = () => {
    if (isRedeemed) {
      return (
        <span className="absolute top-3 right-3 bg-gray-400 text-white text-xs px-2 py-1 rounded-full">
          redeemed
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="absolute top-3 right-3 bg-red-400 text-white text-xs px-2 py-1 rounded-full">
          expired
        </span>
      );
    }
    return (
      <span className="absolute top-3 right-3 bg-green-400 text-white text-xs px-2 py-1 rounded-full">
        available
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={canRedeem ? { scale: 1.02 } : {}}
      className={`relative bg-white rounded-2xl border-4 border-black p-5 ${
        isRedeemed || isExpired ? 'opacity-60' : ''
      }`}
    >
      {/* dashed border effect for coupon look */}
      <div className="absolute inset-2 border-2 border-dashed border-gray-300 rounded-xl pointer-events-none" />

      {getStatusBadge()}

      <div className="flex gap-4">
        {/* character illustration */}
        <div className="flex-shrink-0 w-20 h-20 relative">
          <Image
            src={characterImage}
            alt={characterName}
            fill
            className="object-contain"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-carrots text-xl truncate">{coupon.title}</h3>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{coupon.description}</p>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span>from {characterName}</span>
            <span>•</span>
            <span>{formatDate(coupon.created_at)}</span>
          </div>

          {coupon.expires_at && !isRedeemed && (
            <p className="text-xs text-gray-500 mt-1">
              {isExpired ? 'expired' : 'expires'} {formatDate(coupon.expires_at)}
            </p>
          )}

          {isRedeemed && coupon.redeemed_at && (
            <p className="text-xs text-gray-500 mt-1">
              redeemed by {coupon.redeemed_by} on {formatDate(coupon.redeemed_at)}
            </p>
          )}
        </div>
      </div>

      {canRedeem && onRedeem && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onRedeem(coupon.id)}
          className="mt-4 w-full bg-black text-white font-carrots py-2 rounded-xl hover:bg-gray-800 transition-colors"
        >
          Redeem This Coupon
        </motion.button>
      )}
    </motion.div>
  );
};

export default CouponCard;
