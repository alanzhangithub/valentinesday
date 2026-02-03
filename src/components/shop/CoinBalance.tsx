'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CoinBalanceProps {
  coins: number;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function CoinBalance({ coins, loading = false, size = 'md' }: CoinBalanceProps) {
  const sizeClasses = {
    sm: 'text-lg px-3 py-1',
    md: 'text-xl px-4 py-2',
    lg: 'text-2xl px-5 py-3',
  };

  const coinSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <motion.div
      className={`inline-flex items-center gap-2 bg-yellow-50 border-2 border-yellow-400 rounded-full font-carrots ${sizeClasses[size]}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Coin icon */}
      <motion.div
        className={`${coinSizes[size]} rounded-full bg-yellow-400 border-2 border-yellow-500 flex items-center justify-center`}
        animate={loading ? { rotate: 360 } : {}}
        transition={loading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
      >
        <span className="text-yellow-700 font-bold text-xs">M</span>
      </motion.div>

      {/* Balance */}
      <span className="text-yellow-700 font-bold">
        {loading ? '...' : coins.toLocaleString()}
      </span>
    </motion.div>
  );
}
