'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FoodOption } from '@/types/food';

interface SpinWheelProps {
  options: FoodOption[];
  onResult: (option: FoodOption, wasReroll: boolean) => void;
}

// Colors for wheel segments - pastel vibes
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

// Generate SVG path for a wheel segment
function getSegmentPath(index: number, total: number, radius: number): string {
  const angle = 360 / total;
  const startAngle = index * angle - 90; // Start from top
  const endAngle = startAngle + angle;

  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = radius + radius * Math.cos(startRad);
  const y1 = radius + radius * Math.sin(startRad);
  const x2 = radius + radius * Math.cos(endRad);
  const y2 = radius + radius * Math.sin(endRad);

  const largeArc = angle > 180 ? 1 : 0;

  return `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

// Get text position for segment label
function getTextPosition(index: number, total: number, radius: number): { x: number; y: number; rotation: number } {
  const angle = 360 / total;
  const midAngle = index * angle + angle / 2 - 90;
  const textRadius = radius * 0.65;

  const rad = (midAngle * Math.PI) / 180;

  return {
    x: radius + textRadius * Math.cos(rad),
    y: radius + textRadius * Math.sin(rad),
    rotation: midAngle + 90,
  };
}

export default function SpinWheel({ options, onResult }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedOption, setSelectedOption] = useState<FoodOption | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [wasReroll, setWasReroll] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    setShowConfetti(false);
    setWasReroll(isReroll);

    // Pick the winner first
    const winner = pickWeightedRandom();
    const winnerIndex = options.findIndex(o => o.id === winner.id);

    // Calculate rotation to land on winner
    const segmentAngle = 360 / options.length;
    const winnerAngle = winnerIndex * segmentAngle;
    // Add extra rotations (6-10 full spins) plus the angle to land on winner
    const extraSpins = (6 + Math.random() * 4) * 360;
    // We want the arrow (at top) to point to the winner
    const finalRotation = rotation + extraSpins + (360 - winnerAngle - segmentAngle / 2);

    setRotation(finalRotation);
    setSelectedOption(winner);

    // Show result after spin completes
    setTimeout(() => {
      setIsSpinning(false);
      setShowResult(true);
      setShowConfetti(true);
      onResult(winner, isReroll);

      // Hide confetti after a bit
      setTimeout(() => setShowConfetti(false), 3000);
    }, 4500);
  }, [isSpinning, options, pickWeightedRandom, rotation, onResult]);

  const handleReroll = () => {
    setShowResult(false);
    spin(true);
  };

  if (options.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-4 border-black p-8 text-center">
        <Image
          src="/stickers/beedo-default.svg"
          alt="beedo"
          width={100}
          height={100}
          className="mx-auto mb-4 opacity-50"
        />
        <p className="font-cheeky text-xl text-gray-500">
          no restaurants yet!
        </p>
        <p className="font-cheeky text-lg text-gray-400 mt-1">
          add some spots below~
        </p>
      </div>
    );
  }

  const radius = 140;
  const size = radius * 2;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Confetti effect */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                }}
                initial={{ y: -20, opacity: 1, rotate: 0 }}
                animate={{
                  y: window.innerHeight + 20,
                  opacity: [1, 1, 0],
                  rotate: Math.random() * 720 - 360,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: 'easeIn',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Wheel Container */}
      <div className="relative bg-white p-4 rounded-3xl border-4 border-black shadow-lg">
        {/* Meedo watching from the side */}
        <motion.div
          className="absolute -left-16 top-1/2 -translate-y-1/2 hidden lg:block"
          animate={isSpinning ? { y: [0, -5, 0], rotate: [-5, 5, -5] } : {}}
          transition={{ duration: 0.3, repeat: isSpinning ? Infinity : 0 }}
        >
          <Image
            src="/stickers/meedo-default.svg"
            alt="meedo watching"
            width={60}
            height={60}
          />
        </motion.div>

        {/* Arrow pointer */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            className="w-0 h-0 border-l-[18px] border-r-[18px] border-t-[30px] border-l-transparent border-r-transparent border-t-black"
            animate={isSpinning ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.2, repeat: isSpinning ? Infinity : 0 }}
          />
        </div>

        {/* The Wheel - SVG based for cleaner segments */}
        <motion.div
          className="relative"
          animate={{ rotate: rotation }}
          transition={{
            duration: 4.5,
            ease: [0.2, 0.8, 0.2, 1], // Custom easing for that satisfying slowdown
          }}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Segments */}
            {options.map((option, index) => {
              const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
              const path = getSegmentPath(index, options.length, radius);
              const textPos = getTextPosition(index, options.length, radius);

              return (
                <g key={option.id}>
                  <path
                    d={path}
                    fill={color}
                    stroke="black"
                    strokeWidth="2"
                  />
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    transform={`rotate(${textPos.rotation}, ${textPos.x}, ${textPos.y})`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-bold fill-black"
                    style={{ fontSize: options.length > 8 ? '10px' : '12px' }}
                  >
                    {option.name.length > 12 ? option.name.slice(0, 10) + '...' : option.name}
                  </text>
                </g>
              );
            })}

            {/* Center circle */}
            <circle
              cx={radius}
              cy={radius}
              r={25}
              fill="white"
              stroke="black"
              strokeWidth="4"
            />

            {/* Center decoration */}
            <text
              x={radius}
              y={radius}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-lg font-carrots fill-black"
              style={{ fontSize: '16px' }}
            >
              yum
            </text>
          </svg>
        </motion.div>

        {/* Beedo on the other side */}
        <motion.div
          className="absolute -right-16 top-1/2 -translate-y-1/2 hidden lg:block"
          animate={isSpinning ? { y: [0, -5, 0], rotate: [5, -5, 5] } : {}}
          transition={{ duration: 0.3, repeat: isSpinning ? Infinity : 0 }}
        >
          <Image
            src="/stickers/beedo-default.svg"
            alt="beedo watching"
            width={60}
            height={60}
          />
        </motion.div>
      </div>

      {/* Spin Button */}
      <motion.button
        onClick={() => spin(false)}
        disabled={isSpinning}
        className="bg-black text-white font-carrots text-2xl px-10 py-4 rounded-2xl border-4 border-black disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        whileHover={{ scale: isSpinning ? 1 : 1.05, y: isSpinning ? 0 : -2 }}
        whileTap={{ scale: isSpinning ? 1 : 0.95 }}
      >
        {isSpinning ? 'spinning...' : 'spin the wheel!'}
      </motion.button>

      {/* Hungry subtext */}
      <p className="font-cheeky text-gray-400 text-sm">
        {isSpinning ? 'where will fate take us...' : 'let the wheel decide our fate'}
      </p>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && selectedOption && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowResult(false)}
          >
            <motion.div
              className="bg-white rounded-3xl border-4 border-black p-8 max-w-sm w-full text-center relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              {/* Decorative background */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 left-4 text-6xl">*</div>
                <div className="absolute top-4 right-4 text-6xl">*</div>
                <div className="absolute bottom-4 left-4 text-6xl">*</div>
                <div className="absolute bottom-4 right-4 text-6xl">*</div>
              </div>

              {/* Content */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="font-carrots text-3xl mb-2">
                  {wasReroll ? 'fine, how about...' : 'the wheel has spoken!'}
                </h2>

                <motion.p
                  className="font-cheeky text-5xl mb-4 text-black"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                >
                  {selectedOption.name}
                </motion.p>

                <div className="space-y-1 mb-6">
                  {selectedOption.cuisine && (
                    <p className="text-gray-600">{selectedOption.cuisine}</p>
                  )}
                  {selectedOption.priceRange && (
                    <p className="text-gray-600">{selectedOption.priceRange}</p>
                  )}
                  {selectedOption.location && (
                    <p className="text-gray-500 text-sm">{selectedOption.location}</p>
                  )}
                </div>

                <div className="flex gap-4 justify-center">
                  <motion.button
                    onClick={handleReroll}
                    className="bg-white font-carrots text-xl px-6 py-3 rounded-xl border-4 border-black"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    nah reroll
                  </motion.button>
                  <motion.button
                    onClick={() => setShowResult(false)}
                    className="bg-black text-white font-carrots text-xl px-6 py-3 rounded-xl border-4 border-black"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    lets go!
                  </motion.button>
                </div>
              </motion.div>

              {/* Little characters in the corner */}
              <div className="absolute -bottom-2 -right-2 opacity-30">
                <Image
                  src="/stickers/meedo-waving.svg"
                  alt=""
                  width={60}
                  height={60}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden audio element for potential sound effects */}
      <audio ref={audioRef} />
    </div>
  );
}
