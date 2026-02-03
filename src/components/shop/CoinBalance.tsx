'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CoinBalanceProps {
  coins: number;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function CoinBalance({ coins, loading = false, size = 'md', showLabel = false }: CoinBalanceProps) {
  const sizeClasses = {
    sm: 'text-base px-3 py-1.5 gap-2',
    md: 'text-lg px-4 py-2 gap-2',
    lg: 'text-xl px-5 py-2.5 gap-3',
  };

  const coinSizes = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm',
  };

  return (
    <motion.div
      className={`inline-flex items-center bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-full font-bold shadow-sm ${sizeClasses[size]}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Coin icon */}
      <motion.div
        className={`${coinSizes[size]} rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 border-2 border-yellow-600 flex items-center justify-center shadow-inner`}
        animate={loading ? { rotate: 360 } : {}}
        transition={loading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
      >
        <span className="text-yellow-800 font-bold">M</span>
      </motion.div>

      {/* Balance */}
      <span className="text-yellow-800">
        {loading ? '...' : coins.toLocaleString()}
      </span>

      {/* Optional label */}
      {showLabel && (
        <span className="text-yellow-600 font-normal text-sm">coins</span>
      )}
    </motion.div>
  );
}
