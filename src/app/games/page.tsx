'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import CoinDisplay from '../../components/games/CoinDisplay';

interface GameCard {
  title: string;
  description: string;
  href: string;
  emoji: string;
  color: string;
  borderColor: string;
  hoverColor: string;
  coinReward: string;
  isNew?: boolean;
}

const games: GameCard[] = [
  {
    title: 'Spelling Mee',
    description: 'help beedo spell words in m language!',
    href: '/spelling-mee',
    emoji: '📝',
    color: 'bg-blue-50',
    borderColor: 'border-blue-300',
    hoverColor: 'hover:bg-blue-100',
    coinReward: '5-20 coins',
  },
  {
    title: 'Meedo Memory',
    description: 'match the cute couples photos!',
    href: '/meedo-memory',
    emoji: '🧠',
    color: 'bg-purple-50',
    borderColor: 'border-purple-300',
    hoverColor: 'hover:bg-purple-100',
    coinReward: '10-30 coins',
  },
  {
    title: 'Tap the Beedo',
    description: 'catch beedo before she escapes!',
    href: '/games/tap-the-beedo',
    emoji: '🎀',
    color: 'bg-pink-50',
    borderColor: 'border-pink-300',
    hoverColor: 'hover:bg-pink-100',
    coinReward: '2-50 coins',
    isNew: true,
  },
  {
    title: 'Meedo Slots',
    description: 'spin to win big meedo coins!',
    href: '/games/slots',
    emoji: '🎰',
    color: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    hoverColor: 'hover:bg-yellow-100',
    coinReward: 'gamble!',
    isNew: true,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function GamesPage() {
  // todo: fetch actual coin balance from database
  const currentCoins = 100;

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* header */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-6xl md:text-7xl"
          >
            Games
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl text-gray-600 mt-2"
          >
            play games, earn meedo coins!
          </motion.p>
        </div>

        {/* coin balance */}
        <div className="flex justify-center mb-8">
          <CoinDisplay coins={currentCoins} size="lg" />
        </div>

        {/* games grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {games.map((game) => (
            <motion.div key={game.title} variants={item}>
              <Link href={game.href}>
                <div
                  className={`relative ${game.color} border-4 ${game.borderColor} rounded-2xl p-6 ${game.hoverColor} transition-all duration-300 cursor-pointer group`}
                >
                  {game.isNew && (
                    <motion.div
                      initial={{ rotate: -12, scale: 0 }}
                      animate={{ rotate: -12, scale: 1 }}
                      className="absolute -top-3 -right-3 bg-red-500 text-white font-heading text-sm px-3 py-1 rounded-full border-2 border-red-600"
                    >
                      NEW!
                    </motion.div>
                  )}

                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                      className="text-5xl"
                    >
                      {game.emoji}
                    </motion.div>
                    <div className="flex-1">
                      <h2 className="font-heading text-3xl group-hover:text-gray-700 transition-colors">
                        {game.title}
                      </h2>
                      <p className="text-lg text-gray-600 mt-1">
                        {game.description}
                      </p>
                      <div className="mt-3 inline-flex items-center gap-2 bg-yellow-100 border-2 border-yellow-300 rounded-full px-3 py-1">
                        <span className="text-sm">🪙</span>
                        <span className="text-sm text-yellow-700">
                          {game.coinReward}
                        </span>
                      </div>
                    </div>
                    <motion.div
                      className="text-2xl text-muted-foreground/70 group-hover:text-gray-600 group-hover:translate-x-1 transition-all"
                      whileHover={{ x: 5 }}
                    >
                      →
                    </motion.div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="bg-gray-50 border-2 border-border rounded-xl p-6 inline-block">
            <h3 className="font-heading text-2xl mb-2">how it works</h3>
            <div className="text-lg text-gray-600 space-y-1">
              <p>🎮 play games to earn meedo coins</p>
              <p>🛍️ spend coins in the shop for rewards</p>
              <p>🎁 redeem for real treats from meedo!</p>
            </div>
          </div>
        </motion.div>

        {/* back to home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-lg text-gray-500 hover:text-gray-700 underline"
          >
            back to meedobeedo world
          </Link>
        </div>
      </div>
    </div>
  );
}
