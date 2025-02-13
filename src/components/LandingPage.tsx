'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const LandingPage = () => {
  const router = useRouter();

  const handleActivityClick = (route: string) => {
    router.push(route);
  };

  const activities = [
    { name: 'Spelling Mee', route: '/spelling-mee' },
    { name: 'Meedo Memory', route: '/meedo-memory' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="font-carrots grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white rounded-3xl border-4 border-black p-6 transform hover:scale-105 transition-transform duration-300"
        >
          <div className="h-64 bg-gray-50 rounded-2xl mb-4 flex items-center justify-center border-2 border-black relative">
            <Image 
              src="/meedo.png" 
              alt="Meedo" 
              fill
              className="object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">Meedo</h2>
          <p className="text-gray-600">The loving, playful creator of all things mice!</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white rounded-3xl border-4 border-black p-6 transform hover:scale-105 transition-transform duration-300"
        >
          <div className="h-64 bg-gray-50 rounded-2xl mb-4 flex items-center justify-center border-2 border-black relative">
            <Image 
              src="/beedo.png" 
              alt="Beedo" 
              fill
              className="object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">Beedo</h2>
          <p className="text-gray-600">The mischievous Baby Meedo, full of curiosity!</p>
        </motion.div>
      </div>

      <div className="mt-12 flex justify-center gap-6">
        {activities.map((activity) => (
          <motion.button
            key={activity.route}
            onClick={() => handleActivityClick(activity.route)}
            className="bg-white rounded-xl border-4 border-black px-6 py-3 font-carrots text-xl hover:scale-105 transition-transform duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {activity.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;