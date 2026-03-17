'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShopItem as ShopItemType } from '@/types/shop';

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
    small: 'bg-gradient-to-br from-green-50 to-green-100 border-green-300',
    medium: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300',
    large: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300',
  };

  const tierAccents = {
    small: 'text-green-600',
    medium: 'text-blue-600',
    large: 'text-purple-600',
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

  const cardBg = item.tier ? tierColors[item.tier] : (item.type === 'coupon' ? 'bg-gradient-to-br from-pink-50 to-pink-100 border-pink-300' : 'bg-card border-border');

  return (
    <>
      <motion.div
        className={`relative rounded-2xl border-2 p-5 shadow-sm hover:shadow-md transition-shadow ${cardBg} ${
          !canAfford ? 'opacity-50 grayscale-[30%]' : ''
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={canAfford && !disabled ? { y: -4 } : {}}
        transition={{ duration: 0.2 }}
      >
        {/* Type badge */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
              item.type === 'coupon'
                ? 'bg-pink-200/80 text-pink-700'
                : 'bg-amber-200/80 text-amber-700'
            }`}
          >
            {item.type === 'coupon' ? 'Coupon' : 'Reward'}
          </span>
          {item.tier && (
            <span className={`text-xs font-medium ${tierAccents[item.tier]}`}>
              {item.tier === 'small' && 'starter'}
              {item.tier === 'medium' && 'popular'}
              {item.tier === 'large' && 'premium'}
            </span>
          )}
        </div>

        {/* Item name */}
        <h3 className="font-heading text-xl mb-2 text-foreground">{item.name}</h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 min-h-[48px] leading-relaxed">{item.description}</p>

        {/* Price and purchase button */}
        <div className="flex items-center justify-between pt-2 border-t border-black/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 border-2 border-yellow-600 flex items-center justify-center shadow-sm">
              <span className="text-yellow-800 font-bold text-xs">M</span>
            </div>
            <span className="font-bold text-lg text-foreground">{item.price.toLocaleString()}</span>
          </div>

          <motion.button
            onClick={handlePurchaseClick}
            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
              canAfford && !disabled
                ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                : 'bg-gray-200 text-muted-foreground/70 cursor-not-allowed'
            }`}
            whileHover={canAfford && !disabled ? { scale: 1.02 } : {}}
            whileTap={canAfford && !disabled ? { scale: 0.98 } : {}}
            disabled={!canAfford || disabled || isPurchasing}
          >
            {canAfford ? 'Buy' : 'Need more'}
          </motion.button>
        </div>

        {/* Insufficient funds hint */}
        {!canAfford && (
          <p className="text-gray-500 text-xs mt-2 text-right">
            {item.price - userBalance} more coins needed
          </p>
        )}
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleCancel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal */}
            <motion.div
              className="relative bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl border-2 border-border/50"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <h3 className="font-heading text-2xl mb-2 text-center">confirm purchase?</h3>
              <p className="text-gray-600 text-center mb-4">
                you&apos;re about to buy <span className="font-bold">{item.name}</span>
              </p>

              <div className="flex items-center justify-center gap-2 mb-6 py-3 bg-gray-50 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 border-2 border-yellow-600 flex items-center justify-center">
                  <span className="text-yellow-800 font-bold text-xs">M</span>
                </div>
                <span className="font-bold text-xl">{item.price}</span>
                <span className="text-muted-foreground/70">coins</span>
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                  whileTap={{ scale: 0.98 }}
                  disabled={isPurchasing}
                >
                  nah
                </motion.button>
                <motion.button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                  whileTap={{ scale: 0.98 }}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? 'buying...' : 'yep, buy it'}
                </motion.button>
              </div>

              <p className="text-muted-foreground/70 text-xs text-center mt-4">
                balance after: {(userBalance - item.price).toLocaleString()} coins
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
