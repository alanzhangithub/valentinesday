'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CoinDisplay from './CoinDisplay';

interface SlotMachineProps {
  initialCoins?: number;
  onBalanceChange?: (newBalance: number) => void;
}

const SYMBOLS = ['🐻', '🎀', '❤️', '⭐', '🌸', '💝'];
const SYMBOL_NAMES = ['meedo', 'beedo', 'heart', 'star', 'flower', 'love'];

const SPIN_COST = 5;
const PAYOUTS = {
  threeOfAKind: 50,
  twoMeedo: 15,
  twoBeedo: 15,
  twoHearts: 10,
  oneOfEach: 3,
};

const SlotMachine: React.FC<SlotMachineProps> = ({
  initialCoins = 100,
  onBalanceChange,
}) => {
  const [coins, setCoins] = useState(initialCoins);
  const [reels, setReels] = useState<number[]>([0, 1, 2]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [spinAnimations, setSpinAnimations] = useState<number[]>([0, 0, 0]);

  const calculateWinnings = useCallback((results: number[]) => {
    const symbols = results.map((i) => SYMBOLS[i]);

    // three of a kind
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
      if (symbols[0] === '🐻') {
        return { amount: PAYOUTS.threeOfAKind * 2, message: 'TRIPLE MEEDO! JACKPOT!' };
      }
      if (symbols[0] === '🎀') {
        return { amount: PAYOUTS.threeOfAKind * 2, message: 'TRIPLE BEEDO! JACKPOT!' };
      }
      return { amount: PAYOUTS.threeOfAKind, message: 'THREE OF A KIND!' };
    }

    // two of special symbols
    const meedoCount = symbols.filter((s) => s === '🐻').length;
    const beedoCount = symbols.filter((s) => s === '🎀').length;
    const heartCount = symbols.filter((s) => s === '❤️').length;

    if (meedoCount === 2) {
      return { amount: PAYOUTS.twoMeedo, message: 'two meedos!' };
    }
    if (beedoCount === 2) {
      return { amount: PAYOUTS.twoBeedo, message: 'two beedos!' };
    }
    if (heartCount === 2) {
      return { amount: PAYOUTS.twoHearts, message: 'two hearts!' };
    }

    // meedo and beedo together (one of each)
    if (meedoCount >= 1 && beedoCount >= 1) {
      return { amount: PAYOUTS.oneOfEach, message: 'meedo meets beedo!' };
    }

    return { amount: 0, message: null };
  }, []);

  const spin = useCallback(async () => {
    if (isSpinning || coins < SPIN_COST) return;

    setIsSpinning(true);
    setLastWin(null);
    setWinMessage(null);

    // deduct cost
    const newBalance = coins - SPIN_COST;
    setCoins(newBalance);

    // generate random results
    const results = [
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
    ];

    // animate each reel with delay
    for (let i = 0; i < 3; i++) {
      setSpinAnimations((prev) => {
        const newAnims = [...prev];
        newAnims[i] = 20 + i * 5; // different spin counts for each reel
        return newAnims;
      });
    }

    // simulate spinning animation
    const spinInterval = setInterval(() => {
      setReels((prev) => prev.map(() => Math.floor(Math.random() * SYMBOLS.length)));
    }, 100);

    // stop reels one by one
    await new Promise((resolve) => setTimeout(resolve, 800));
    clearInterval(spinInterval);

    setReels(results);
    setSpinAnimations([0, 0, 0]);
    setIsSpinning(false);

    // calculate winnings
    const { amount, message } = calculateWinnings(results);
    if (amount > 0) {
      setLastWin(amount);
      setWinMessage(message);
      const finalBalance = newBalance + amount;
      setCoins(finalBalance);
      if (onBalanceChange) {
        onBalanceChange(finalBalance);
      }
    } else if (onBalanceChange) {
      onBalanceChange(newBalance);
    }
  }, [isSpinning, coins, calculateWinnings, onBalanceChange]);

  const addFreeCoins = useCallback(() => {
    const newBalance = coins + 50;
    setCoins(newBalance);
    if (onBalanceChange) {
      onBalanceChange(newBalance);
    }
  }, [coins, onBalanceChange]);

  return (
    <div className="max-w-lg mx-auto p-4">
      {/* header */}
      <div className="text-center mb-6">
        <h1 className="font-carrots text-5xl md:text-6xl">Meedo Slots</h1>
        <p className="font-cheeky text-xl text-gray-600 mt-2">
          spin to win meedo coins!
        </p>
      </div>

      {/* balance display */}
      <div className="flex justify-center mb-6">
        <CoinDisplay coins={coins} size="lg" />
      </div>

      {/* slot machine */}
      <div className="bg-gradient-to-b from-purple-600 to-purple-800 rounded-3xl border-4 border-purple-900 p-6 shadow-2xl">
        {/* decorative top */}
        <div className="bg-yellow-400 rounded-t-xl border-4 border-yellow-500 p-2 mb-4 text-center">
          <span className="font-carrots text-2xl text-yellow-900">MEEDO CASINO</span>
        </div>

        {/* reels */}
        <div className="bg-white rounded-xl border-4 border-gray-300 p-4 mb-4">
          <div className="flex justify-center gap-2">
            {reels.map((symbolIndex, i) => (
              <motion.div
                key={i}
                className="w-20 h-24 md:w-24 md:h-28 bg-gray-100 rounded-lg border-4 border-gray-300 flex items-center justify-center overflow-hidden"
                animate={isSpinning ? { y: [0, -10, 0, 10, 0] } : {}}
                transition={
                  isSpinning
                    ? { duration: 0.2, repeat: Infinity, delay: i * 0.1 }
                    : {}
                }
              >
                <motion.span
                  className="text-5xl md:text-6xl"
                  animate={
                    lastWin && !isSpinning
                      ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }
                      : {}
                  }
                  transition={{ duration: 0.5 }}
                >
                  {SYMBOLS[symbolIndex]}
                </motion.span>
              </motion.div>
            ))}
          </div>

          {/* win line indicator */}
          <div className="flex items-center justify-center mt-2">
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-red-500 to-transparent rounded" />
          </div>
        </div>

        {/* win display */}
        <AnimatePresence>
          {lastWin !== null && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="bg-yellow-400 rounded-xl border-4 border-yellow-500 p-4 mb-4 text-center"
            >
              <p className="font-cheeky text-lg text-yellow-800">{winMessage}</p>
              <motion.p
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                className="font-carrots text-4xl text-yellow-900"
              >
                +{lastWin} coins!
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* spin button */}
        <motion.button
          whileHover={{ scale: coins >= SPIN_COST ? 1.05 : 1 }}
          whileTap={{ scale: coins >= SPIN_COST ? 0.95 : 1 }}
          onClick={spin}
          disabled={isSpinning || coins < SPIN_COST}
          className={`w-full py-4 rounded-xl border-4 font-carrots text-2xl transition-colors ${
            coins >= SPIN_COST
              ? 'bg-green-500 border-green-600 text-white hover:bg-green-600'
              : 'bg-gray-400 border-gray-500 text-gray-200 cursor-not-allowed'
          }`}
        >
          {isSpinning ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              🎰
            </motion.span>
          ) : coins >= SPIN_COST ? (
            `SPIN (${SPIN_COST} coins)`
          ) : (
            'need more coins!'
          )}
        </motion.button>

        {/* out of coins helper */}
        {coins < SPIN_COST && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            <p className="font-cheeky text-white mb-2">ran outta coins?</p>
            <button
              onClick={addFreeCoins}
              className="bg-yellow-400 text-yellow-900 font-cheeky text-lg px-6 py-2 rounded-xl border-2 border-yellow-500 hover:bg-yellow-300 transition-colors"
            >
              get 50 free coins! 🎁
            </button>
          </motion.div>
        )}
      </div>

      {/* payout table */}
      <div className="mt-6 bg-white rounded-xl border-2 border-gray-200 p-4">
        <h3 className="font-carrots text-2xl text-center mb-4">payouts</h3>
        <div className="space-y-2 font-cheeky text-lg">
          <div className="flex justify-between">
            <span>🐻🐻🐻 triple meedo</span>
            <span className="text-yellow-600 font-bold">100 coins</span>
          </div>
          <div className="flex justify-between">
            <span>🎀🎀🎀 triple beedo</span>
            <span className="text-yellow-600 font-bold">100 coins</span>
          </div>
          <div className="flex justify-between">
            <span>any three of a kind</span>
            <span className="text-yellow-600 font-bold">50 coins</span>
          </div>
          <div className="flex justify-between">
            <span>🐻🐻 two meedos</span>
            <span className="text-yellow-600 font-bold">15 coins</span>
          </div>
          <div className="flex justify-between">
            <span>🎀🎀 two beedos</span>
            <span className="text-yellow-600 font-bold">15 coins</span>
          </div>
          <div className="flex justify-between">
            <span>❤️❤️ two hearts</span>
            <span className="text-yellow-600 font-bold">10 coins</span>
          </div>
          <div className="flex justify-between">
            <span>🐻+🎀 meedo meets beedo</span>
            <span className="text-yellow-600 font-bold">3 coins</span>
          </div>
        </div>
      </div>

      {/* back link */}
      <div className="mt-6 text-center">
        <a
          href="/games"
          className="font-cheeky text-lg text-gray-500 hover:text-gray-700 underline"
        >
          back to games
        </a>
      </div>
    </div>
  );
};

export default SlotMachine;
