'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

const LandingPage = () => {
  const router = useRouter();

  const activities = [
    { name: 'Spelling Mee', route: '/spelling-mee' },
    { name: 'Meedo Memory', route: '/meedo-memory' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Decorative patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="grid grid-cols-6 gap-8 opacity-5">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="w-full">
              <Star className="w-full h-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative">
        {/* Main title */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <h1 className="font-carrots text-7xl text-black mb-4 relative z-10">
              Meedo & Beedo World
            </h1>
            <Sparkles className="absolute top-0 right-1/4 text-yellow-400 w-8 h-8" />
            <p className="font-cheeky text-3xl text-gray-600 mb-8">
              Where love and mischief come together 💕
            </p>
          </motion.div>
        </div>

        {/* Character Cards */}
        <div className="font-carrots grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Meedo Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-3xl border-4 border-black p-6 transform hover:scale-105 transition-transform duration-300"
          >
            <div className="h-64 bg-gray-50 rounded-2xl mb-4 flex items-center justify-center border-2 border-black">
              <img src="/meedo.png" alt="Meedo" className="h-full w-full object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">Meedo</h2>
            <p className="text-gray-600">The loving, playful creator of all things mice!</p>
          </motion.div>
          {/* Beedo Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white rounded-3xl border-4 border-black p-6 transform hover:scale-105 transition-transform duration-300"
          >
            <div className="h-64 bg-gray-50 rounded-2xl mb-4 flex items-center justify-center border-2 border-black">
              <img src="/beedo.png" alt="Beedo" className="h-full w-full object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">Beedo</h2>
            <p className="text-gray-600">The mischievous Baby Meedo, full of curiosity!</p>
          </motion.div>
        </div>

        {/* Activity Buttons - Now centered and in a row */}
        <div className="flex justify-center gap-6 mt-16">
          {activities.map((activity, index) => (
            <motion.button
              key={activity.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              onClick={() => router.push(activity.route)}
              className="font-cheeky text-2xl bg-white border-4 border-black rounded-2xl p-6 hover:bg-gray-50 transition-colors duration-300 min-w-[200px]"
            >
              {activity.name}
            </motion.button>
          ))}
        </div>

        {/* Footer Love Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16 border-4 border-black rounded-3xl p-8 max-w-2xl mx-auto"
        >
          <Heart className="inline-block text-black w-12 h-12 mb-4" />
          <p className="font-carrots text-2xl text-black">
            Three years of love, laughter, and creating our own special world together...
            To many more years!
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;