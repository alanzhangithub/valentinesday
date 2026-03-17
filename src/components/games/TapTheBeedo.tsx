'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CoinDisplay from './CoinDisplay';

interface BeedoPosition {
  id: number;
  row: number;
  col: number;
}

interface TapTheBeedoProps {
  onGameEnd?: (score: number, coinsEarned: number) => void;
  initialCoins?: number;
}

const GRID_SIZE = 3;
const GAME_DURATION = 30; // seconds
const BEEDO_SHOW_TIME = 1200; // ms - how long beedo stays visible
const BEEDO_SPAWN_INTERVAL = 800; // ms - how often new beedo can spawn

const TapTheBeedo: React.FC<TapTheBeedoProps> = ({
  onGameEnd,
  initialCoins = 0,
}) => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [beedos, setBeedos] = useState<BeedoPosition[]>([]);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [hitEffects, setHitEffects] = useState<{ id: number; x: number; y: number }[]>([]);
  const beedoIdRef = useRef(0);
  const hitIdRef = useRef(0);

  const calculateCoins = useCallback((finalScore: number) => {
    // tiered rewards
    if (finalScore >= 30) return 50;
    if (finalScore >= 20) return 30;
    if (finalScore >= 10) return 15;
    if (finalScore >= 5) return 5;
    return 2;
  }, []);

  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setBeedos([]);
    setCoinsEarned(0);
    setHitEffects([]);
  }, []);

  const endGame = useCallback(() => {
    setGameState('ended');
    const earned = calculateCoins(score);
    setCoinsEarned(earned);
    if (onGameEnd) {
      onGameEnd(score, earned);
    }
  }, [score, calculateCoins, onGameEnd]);

  // timer countdown
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // end game when time runs out
  useEffect(() => {
    if (timeLeft === 0 && gameState === 'playing') {
      endGame();
    }
  }, [timeLeft, gameState, endGame]);

  // spawn beedos
  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnBeedo = () => {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      const id = beedoIdRef.current++;

      setBeedos((prev) => [...prev, { id, row, col }]);

      // remove beedo after show time
      setTimeout(() => {
        setBeedos((prev) => prev.filter((b) => b.id !== id));
      }, BEEDO_SHOW_TIME);
    };

    spawnBeedo(); // spawn one immediately
    const interval = setInterval(spawnBeedo, BEEDO_SPAWN_INTERVAL);

    return () => clearInterval(interval);
  }, [gameState]);

  const handleTap = useCallback((beedo: BeedoPosition, event: React.MouseEvent) => {
    setScore((prev) => prev + 1);
    setBeedos((prev) => prev.filter((b) => b.id !== beedo.id));

    // add hit effect
    const rect = event.currentTarget.getBoundingClientRect();
    const hitId = hitIdRef.current++;
    setHitEffects((prev) => [
      ...prev,
      { id: hitId, x: rect.left + rect.width / 2, y: rect.top },
    ]);

    // remove hit effect after animation
    setTimeout(() => {
      setHitEffects((prev) => prev.filter((h) => h.id !== hitId));
    }, 500);
  }, []);

  const renderGrid = () => {
    const cells = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const beedo = beedos.find((b) => b.row === row && b.col === col);
        cells.push(
          <div
            key={`${row}-${col}`}
            className="aspect-square bg-gray-100 rounded-xl border-4 border-border flex items-center justify-center relative overflow-hidden"
          >
            <AnimatePresence>
              {beedo && (
                <motion.button
                  key={beedo.id}
                  initial={{ scale: 0, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, y: -20, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  onClick={(e) => handleTap(beedo, e)}
                  className="absolute inset-2 bg-pink-100 rounded-xl border-4 border-pink-300 flex flex-col items-center justify-center cursor-pointer hover:bg-pink-200 active:scale-95 transition-colors"
                >
                  <span className="text-4xl md:text-5xl">🎀</span>
                  <span className="text-sm text-pink-600">beedo!</span>
                </motion.button>
              )}
            </AnimatePresence>
            {!beedo && (
              <div className="w-12 h-12 rounded-full bg-gray-200 opacity-30" />
            )}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      {/* header */}
      <div className="text-center mb-6">
        <h1 className="font-heading text-5xl md:text-6xl">Tap the Beedo!</h1>
        <p className="text-xl text-gray-600 mt-2">
          catch beedo before she escapes!
        </p>
      </div>

      {/* game stats */}
      <div className="flex justify-between items-center mb-6">
        <CoinDisplay coins={initialCoins + coinsEarned} size="sm" />
        <div className="flex items-center gap-4">
          <div className="bg-card border-2 border-black rounded-xl px-4 py-2">
            <span className="text-sm text-gray-500">score</span>
            <p className="font-heading text-3xl">{score}</p>
          </div>
          <div
            className={`bg-card border-2 rounded-xl px-4 py-2 ${
              timeLeft <= 10 ? 'border-red-500 bg-red-50' : 'border-black'
            }`}
          >
            <span className="text-sm text-gray-500">time</span>
            <p
              className={`font-heading text-3xl ${
                timeLeft <= 10 ? 'text-red-500' : ''
              }`}
            >
              {timeLeft}s
            </p>
          </div>
        </div>
      </div>

      {/* game area */}
      <div className="bg-card rounded-3xl border-4 border-black p-6 relative">
        {gameState === 'idle' && (
          <div className="text-center py-12">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-6xl mb-6"
            >
              🎀
            </motion.div>
            <p className="text-xl text-gray-600 mb-6">
              beedo is hiding... can you find her?
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="bg-pink-500 text-white font-heading text-2xl px-8 py-4 rounded-xl border-4 border-pink-600 hover:bg-pink-600 transition-colors"
            >
              Start Game!
            </motion.button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="grid grid-cols-3 gap-3">{renderGrid()}</div>
        )}

        {gameState === 'ended' && (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <p className="font-heading text-4xl mb-2">Times Up!</p>
              <p className="text-xl text-gray-600 mb-4">
                you caught beedo {score} times!
              </p>

              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mb-6 inline-block">
                <p className="text-lg text-yellow-700">you earned</p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="font-heading text-5xl text-yellow-800"
                >
                  +{coinsEarned}
                </motion.p>
                <p className="text-sm text-yellow-600">meedo coins!</p>
              </div>

              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame}
                  className="bg-pink-500 text-white font-heading text-xl px-6 py-3 rounded-xl border-4 border-pink-600 hover:bg-pink-600 transition-colors"
                >
                  Play Again!
                </motion.button>
                <a
                  href="/games"
                  className="text-lg text-gray-500 hover:text-gray-700 underline"
                >
                  back to games
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* floating hit effects */}
      <AnimatePresence>
        {hitEffects.map((effect) => (
          <motion.div
            key={effect.id}
            initial={{ opacity: 1, y: 0, x: effect.x - 20, position: 'fixed', top: effect.y }}
            animate={{ opacity: 0, y: -50 }}
            exit={{ opacity: 0 }}
            className="font-heading text-2xl text-green-500 pointer-events-none"
            style={{ left: effect.x - 20, position: 'fixed', top: effect.y }}
          >
            +1
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default TapTheBeedo;
