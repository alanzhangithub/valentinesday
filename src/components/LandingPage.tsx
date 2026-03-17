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
    { name: 'Spelling Mee', route: '/spelling-mee', emoji: '📝' },
    { name: 'Meedo Memory', route: '/meedo-memory', emoji: '🧠' },
    { name: 'Shop', route: '/shop', emoji: '🛍️' }
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="font-heading text-5xl md:text-6xl font-semibold mb-4 text-foreground">meedo & beedo world</h1>
        <p className="text-xl md:text-2xl mb-8 font-body text-muted-foreground">where love and mischief come together! 💕</p>
        <div className="max-w-4xl mx-auto text-lg text-muted-foreground font-body">
          <p>welcome to our little corner of the internet! this is where meedo and beedo share their adventures,
          precious memories, and all the fun they have together. stay a while and explore our world!</p>
        </div>
      </div>

      {/* Character Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white rounded-[24px] border-4 border-candy-pink p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          <div className="h-64 bg-candy-pink/10 rounded-2xl mb-4 flex items-center justify-center relative">
            <Image
              src="/meedo.png"
              alt="Meedo"
              fill
              className="object-contain"
            />
          </div>
          <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">meedo</h2>
          <p className="text-muted-foreground font-body">the loving, playful creator of all things mice!</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white rounded-[24px] border-4 border-candy-lavender p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          <div className="h-64 bg-candy-lavender/10 rounded-2xl mb-4 flex items-center justify-center relative">
            <Image
              src="/beedo.png"
              alt="Beedo"
              fill
              className="object-contain"
            />
          </div>
          <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">beedo</h2>
          <p className="text-muted-foreground font-body">the mischievous baby meedo, full of curiosity!</p>
        </motion.div>
      </div>

      {/* Activities Section */}
      <div className="text-center mb-8">
        <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-4 text-foreground">fun activities 🎉</h2>
        <p className="text-xl mb-6 font-body text-muted-foreground">pick an adventure!</p>
      </div>

      {/* Activity Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        {activities.map((activity) => (
          <motion.button
            key={activity.route}
            onClick={() => handleActivityClick(activity.route)}
            className="bg-white rounded-2xl border-3 border-candy-sky px-6 py-3 font-heading text-lg font-semibold shadow-md hover:shadow-lg transition-shadow duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="mr-2">{activity.emoji}</span>
            {activity.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
