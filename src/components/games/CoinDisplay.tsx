'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CoinDisplayProps {
  coins: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
}

const CoinDisplay: React.FC<CoinDisplayProps> = ({
  coins,
  size = 'md',
  showLabel = true,
  animate = true,
}) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const coinSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <motion.div
      className="flex items-center gap-2 bg-yellow-50 border-2 border-yellow-400 rounded-full px-4 py-2"
      initial={animate ? { scale: 0.9, opacity: 0 } : undefined}
      animate={animate ? { scale: 1, opacity: 1 } : undefined}
      whileHover={{ scale: 1.05 }}
    >
      <motion.div
        className={`${coinSizes[size]} relative`}
        animate={animate ? { rotateY: [0, 360] } : undefined}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 border-2 border-yellow-600 flex items-center justify-center shadow-md">
          <span className="text-yellow-800 font-bold text-xs">M</span>
        </div>
      </motion.div>
      <div className="flex flex-col">
        {showLabel && (
          <span className="text-xs text-yellow-700 font-cheeky leading-none">
            Meedo Coins
          </span>
        )}
        <motion.span
          key={coins}
          className={`font-carrots ${sizeClasses[size]} text-yellow-800`}
          initial={animate ? { scale: 1.2, color: '#16a34a' } : undefined}
          animate={animate ? { scale: 1, color: '#854d0e' } : undefined}
          transition={{ duration: 0.3 }}
        >
          {coins.toLocaleString()}
        </motion.span>
      </div>
    </motion.div>
  );
};

export default CoinDisplay;
