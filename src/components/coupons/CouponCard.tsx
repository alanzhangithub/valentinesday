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
  const creatorImage = isFromMeedo ? '/meedo.png' : '/beedo.png';
  const recipientImage = isFromMeedo ? '/beedo.png' : '/meedo.png';
  const creatorName = isFromMeedo ? 'Meedo' : 'Beedo';
  const recipientName = isFromMeedo ? 'Beedo' : 'Meedo';

  const getStatusBadge = () => {
    if (isRedeemed) {
      return (
        <span className="absolute top-3 right-3 bg-gray-400 text-white text-xs px-3 py-1 rounded-full font-medium">
          redeemed
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="absolute top-3 right-3 bg-red-400 text-white text-xs px-3 py-1 rounded-full font-medium">
          expired
        </span>
      );
    }
    return (
      <span className="absolute top-3 right-3 bg-pink-400 text-white text-xs px-3 py-1 rounded-full font-medium">
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
      whileHover={canRedeem ? { scale: 1.02, y: -4 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative bg-white rounded-2xl border-4 border-black p-5 shadow-lg ${
        isRedeemed || isExpired ? 'opacity-60' : ''
      }`}
    >
      {/* dashed border effect for coupon look */}
      <div className="absolute inset-2 border-2 border-dashed border-gray-300 rounded-xl pointer-events-none" />

      {/* decorative hearts in corners */}
      {canRedeem && (
        <>
          <span className="absolute top-2 left-2 text-pink-300 text-sm">&#10084;</span>
          <span className="absolute bottom-2 right-2 text-pink-300 text-sm">&#10084;</span>
        </>
      )}

      {getStatusBadge()}

      <div className="flex gap-4">
        {/* character illustration showing from -> to */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="w-14 h-14 relative">
            <Image
              src={creatorImage}
              alt={creatorName}
              fill
              className="object-contain"
            />
          </div>
          <span className="text-gray-400 text-lg">&#8595;</span>
          <div className="w-10 h-10 relative opacity-60">
            <Image
              src={recipientImage}
              alt={recipientName}
              fill
              className="object-contain"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-carrots text-xl truncate pr-20">{coupon.title}</h3>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{coupon.description}</p>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span className="font-medium">{creatorName}</span>
            <span>&#10132;</span>
            <span className="font-medium">{recipientName}</span>
            <span>&#8226;</span>
            <span>{formatDate(coupon.created_at)}</span>
          </div>

          {coupon.expires_at && !isRedeemed && (
            <p className={`text-xs mt-1 ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
              {isExpired ? 'expired' : 'expires'} {formatDate(coupon.expires_at)}
            </p>
          )}

          {isRedeemed && coupon.redeemed_at && (
            <p className="text-xs text-green-600 mt-1">
              redeemed by {coupon.redeemed_by} on {formatDate(coupon.redeemed_at)}
            </p>
          )}
        </div>
      </div>

      {canRedeem && onRedeem && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onRedeem(coupon.id)}
          className="mt-4 w-full bg-black text-white font-carrots py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <span>Redeem This Coupon</span>
          <span>&#10084;</span>
        </motion.button>
      )}
    </motion.div>
  );
};

export default CouponCard;
