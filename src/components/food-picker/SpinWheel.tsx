'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FoodOption } from '@/types/food';

interface SpinWheelProps {
  options: FoodOption[];
  onResult: (option: FoodOption, wasReroll: boolean) => void;
}

// Colors for wheel segments
const SEGMENT_COLORS = [
  '#FFB3BA', // pastel pink
  '#BAFFC9', // pastel green
  '#BAE1FF', // pastel blue
  '#FFFFBA', // pastel yellow
  '#FFD9BA', // pastel orange
  '#E8BAFF', // pastel purple
  '#BAFFED', // pastel teal
  '#FFC8BA', // pastel coral
];

export default function SpinWheel({ options, onResult }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedOption, setSelectedOption] = useState<FoodOption | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [wasReroll, setWasReroll] = useState(false);

  // Weighted random selection
  const pickWeightedRandom = useCallback(() => {
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    let random = Math.random() * totalWeight;

    for (const option of options) {
      random -= option.weight;
      if (random <= 0) {
        return option;
      }
    }
    return options[options.length - 1];
  }, [options]);

  const spin = useCallback((isReroll: boolean = false) => {
    if (isSpinning || options.length === 0) return;

    setIsSpinning(true);
    setShowResult(false);
    setWasReroll(isReroll);

    // Pick the winner first
    const winner = pickWeightedRandom();
    const winnerIndex = options.findIndex(o => o.id === winner.id);

    // Calculate rotation to land on winner
    const segmentAngle = 360 / options.length;
    const winnerAngle = winnerIndex * segmentAngle;
    // Add extra rotations (5-8 full spins) plus the angle to land on winner
    const extraSpins = (5 + Math.random() * 3) * 360;
    // We want the arrow (at top) to point to the winner
    // Wheel rotates clockwise, so we need to offset
    const finalRotation = rotation + extraSpins + (360 - winnerAngle - segmentAngle / 2);

    setRotation(finalRotation);
    setSelectedOption(winner);

    // Show result after spin completes
    setTimeout(() => {
      setIsSpinning(false);
      setShowResult(true);
      onResult(winner, isReroll);
    }, 4000);
  }, [isSpinning, options, pickWeightedRandom, rotation, onResult]);

  const handleReroll = () => {
    setShowResult(false);
    spin(true);
  };

  if (options.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="font-cheeky text-xl text-gray-500">
          no restaurants yet! add some below~
        </p>
      </div>
    );
  }

  const segmentAngle = 360 / options.length;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Wheel Container */}
      <div className="relative">
        {/* Arrow pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-black" />
        </div>

        {/* The Wheel */}
        <motion.div
          className="relative w-72 h-72 rounded-full border-4 border-black overflow-hidden"
          animate={{ rotate: rotation }}
          transition={{
            duration: 4,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          {options.map((option, index) => {
            const startAngle = index * segmentAngle;
            const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];

            return (
              <div
                key={option.id}
                className="absolute w-full h-full"
                style={{
                  transform: `rotate(${startAngle}deg)`,
                }}
              >
                <div
                  className="absolute top-0 left-1/2 origin-bottom h-1/2 flex items-start justify-center pt-4"
                  style={{
                    width: '100px',
                    marginLeft: '-50px',
                    clipPath: `polygon(50% 100%, ${50 - Math.tan((segmentAngle / 2) * Math.PI / 180) * 50}% 0%, ${50 + Math.tan((segmentAngle / 2) * Math.PI / 180) * 50}% 0%)`,
                    backgroundColor: color,
                  }}
                >
                  <span
                    className="text-xs font-bold text-black text-center px-1 max-w-[60px] truncate"
                    style={{
                      transform: `rotate(${segmentAngle / 2}deg)`,
                    }}
                  >
                    {option.name}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white border-4 border-black z-10" />
        </motion.div>
      </div>

      {/* Spin Button */}
      <motion.button
        onClick={() => spin(false)}
        disabled={isSpinning}
        className="bg-black text-white font-carrots text-2xl px-8 py-3 rounded-xl border-4 border-black disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: isSpinning ? 1 : 1.05 }}
        whileTap={{ scale: isSpinning ? 1 : 0.95 }}
      >
        {isSpinning ? 'spinning...' : 'spin the wheel!'}
      </motion.button>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && selectedOption && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowResult(false)}
          >
            <motion.div
              className="bg-white rounded-3xl border-4 border-black p-8 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 50 }}
              animate={{ y: 0 }}
            >
              <h2 className="font-carrots text-3xl mb-2">
                {wasReroll ? 'fine, how about...' : 'the wheel has spoken!'}
              </h2>
              <p className="font-cheeky text-4xl mb-4 text-black">
                {selectedOption.name}
              </p>
              {selectedOption.cuisine && (
                <p className="text-gray-600 mb-1">{selectedOption.cuisine}</p>
              )}
              {selectedOption.priceRange && (
                <p className="text-gray-600 mb-4">{selectedOption.priceRange}</p>
              )}

              <div className="flex gap-4 justify-center">
                <motion.button
                  onClick={handleReroll}
                  className="bg-white font-carrots text-xl px-6 py-2 rounded-xl border-4 border-black"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  not that
                </motion.button>
                <motion.button
                  onClick={() => setShowResult(false)}
                  className="bg-black text-white font-carrots text-xl px-6 py-2 rounded-xl border-4 border-black"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  yum!
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
