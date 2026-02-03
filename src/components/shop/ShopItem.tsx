'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShopItem as ShopItemType, User } from '@/types/shop';

interface ShopItemProps {
  item: ShopItemType;
  userBalance: number;
  onPurchase: (itemId: string) => Promise<void>;
  disabled?: boolean;
}

export default function ShopItem({ item, userBalance, onPurchase, disabled = false }: ShopItemProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const canAfford = userBalance >= item.price;

  const tierColors = {
    small: 'border-green-400 bg-green-50',
    medium: 'border-blue-400 bg-blue-50',
    large: 'border-purple-400 bg-purple-50',
  };

  const tierLabels = {
    small: 'Small Treat',
    medium: 'Medium Treat',
    large: 'Big Treat',
  };

  const handlePurchaseClick = () => {
    if (!canAfford || disabled) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setIsPurchasing(true);
    try {
      await onPurchase(item.id);
    } finally {
      setIsPurchasing(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <motion.div
      className={`relative bg-white rounded-2xl border-4 border-black p-5 ${
        !canAfford ? 'opacity-60' : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={canAfford && !disabled ? { scale: 1.02 } : {}}
      transition={{ duration: 0.2 }}
    >
      {/* Tier badge for rewards */}
      {item.tier && (
        <div
          className={`absolute -top-3 -right-3 px-3 py-1 rounded-full border-2 border-black text-xs font-bold ${tierColors[item.tier]}`}
        >
          {tierLabels[item.tier]}
        </div>
      )}

      {/* Type badge */}
      <div className="mb-3">
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-bold ${
            item.type === 'coupon'
              ? 'bg-pink-100 text-pink-700 border border-pink-300'
              : 'bg-amber-100 text-amber-700 border border-amber-300'
          }`}
        >
          {item.type === 'coupon' ? 'Coupon' : 'Reward'}
        </span>
      </div>

      {/* Item name */}
      <h3 className="font-carrots text-xl mb-2">{item.name}</h3>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 min-h-[40px]">{item.description}</p>

      {/* Price and purchase button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-yellow-400 border-2 border-yellow-500 flex items-center justify-center">
            <span className="text-yellow-700 font-bold text-xs">M</span>
          </div>
          <span className="font-bold text-lg">{item.price}</span>
        </div>

        {showConfirm ? (
          <div className="flex gap-2">
            <motion.button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-200 rounded-lg text-sm font-bold hover:bg-gray-300"
              whileTap={{ scale: 0.95 }}
              disabled={isPurchasing}
            >
              Nah
            </motion.button>
            <motion.button
              onClick={handleConfirm}
              className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600"
              whileTap={{ scale: 0.95 }}
              disabled={isPurchasing}
            >
              {isPurchasing ? 'Buying...' : 'Yep!'}
            </motion.button>
          </div>
        ) : (
          <motion.button
            onClick={handlePurchaseClick}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
              canAfford && !disabled
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={canAfford && !disabled ? { scale: 1.05 } : {}}
            whileTap={canAfford && !disabled ? { scale: 0.95 } : {}}
            disabled={!canAfford || disabled}
          >
            {canAfford ? 'Buy' : 'Too broke'}
          </motion.button>
        )}
      </div>

      {/* Insufficient funds message */}
      {!canAfford && (
        <p className="text-red-500 text-xs mt-2">
          Need {item.price - userBalance} more coins
        </p>
      )}
    </motion.div>
  );
}
