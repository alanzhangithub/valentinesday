'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmojiProps {
  emoji: string;
  initialX: number;
  initialY: number;
  duration: number;
  delay: number;
}

const BirthdayEmoji: React.FC<EmojiProps> = ({ emoji, initialX, initialY, duration, delay }) => {
  return (
    <motion.div
      className="absolute text-4xl"
      initial={{ x: initialX, y: initialY, opacity: 0, scale: 0 }}
      animate={{ 
        x: [initialX, initialX + (Math.random() * 200 - 100)],
        y: [initialY, window.innerHeight],
        opacity: [0, 1, 0],
        scale: [0, 1.2, 1, 0.8]
      }}
      transition={{ 
        duration: duration, 
        delay: delay,
        y: { type: "spring", stiffness: 50 },
        opacity: { duration: duration * 0.8 }
      }}
    >
      {emoji}
    </motion.div>
  );
};

const birthdayEmojis = ['🎂', '🎁', '🎈', '🎉', '🎊', '🥳', '🧁', '🍰', '🍭', '🎀', '🎵', '✨'];

const BirthdayOverlay: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(true);
  const [emojis, setEmojis] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    // Create falling emojis
    const emojiElements = [];
    for (let i = 0; i < 40; i++) {
      const emoji = birthdayEmojis[Math.floor(Math.random() * birthdayEmojis.length)];
      const initialX = Math.random() * window.innerWidth;
      const initialY = -100 - Math.random() * 500; // Start above the screen
      const duration = 2 + Math.random() * 3;
      const delay = Math.random() * 5;
      
      emojiElements.push(
        <BirthdayEmoji 
          key={i}
          emoji={emoji}
          initialX={initialX}
          initialY={initialY}
          duration={duration}
          delay={delay}
        />
      );
    }
    setEmojis(emojiElements);

    // Hide overlay after 5 seconds
    const timer = setTimeout(() => {
      setShowOverlay(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div 
          className="fixed inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 z-50 flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-center px-4"
          >
            <h1 className="font-carrots text-7xl md:text-9xl text-white drop-shadow-lg mb-4">
              Happy Birthday Beedo!
            </h1>
            <p className="font-cheeky text-3xl md:text-4xl text-white drop-shadow">
              Time to celebrate your special day! 🎉
            </p>
          </motion.div>
          {emojis}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BirthdayOverlay;