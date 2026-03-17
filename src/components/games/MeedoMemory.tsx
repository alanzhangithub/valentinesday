'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import CoinDisplay from './CoinDisplay';

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MeedoMemoryProps {
  onGameEnd?: (moves: number, coinsEarned: number) => void;
  initialCoins?: number;
}

const CARD_PAIRS = [
  { emoji: '🐻', name: 'meedo' },
  { emoji: '🎀', name: 'beedo' },
  { emoji: '❤️', name: 'heart' },
  { emoji: '💕', name: 'love' },
  { emoji: '🌸', name: 'flower' },
  { emoji: '⭐', name: 'star' },
  { emoji: '🎁', name: 'gift' },
  { emoji: '💝', name: 'lovebox' },
];

const shuffleCards = (): Card[] => {
  const cards: Card[] = [];
  CARD_PAIRS.forEach((pair, index) => {
    cards.push({ id: index * 2, emoji: pair.emoji, isFlipped: false, isMatched: false });
    cards.push({ id: index * 2 + 1, emoji: pair.emoji, isFlipped: false, isMatched: false });
  });

  // fisher-yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
};

const calculateCoins = (moves: number): number => {
  // fewer moves = more coins
  if (moves <= 10) return 30;
  if (moves <= 14) return 25;
  if (moves <= 18) return 20;
  if (moves <= 22) return 15;
  return 10;
};

const MeedoMemory: React.FC<MeedoMemoryProps> = ({
  onGameEnd,
  initialCoins = 0,
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState(0);

  const startGame = useCallback(() => {
    setCards(shuffleCards());
    setFlippedCards([]);
    setMoves(0);
    setGameState('playing');
    setCoinsEarned(0);
    setMatchedPairs(0);
    setIsChecking(false);
  }, []);

  const handleCardClick = useCallback((cardId: number) => {
    if (isChecking) return;
    if (flippedCards.length >= 2) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    // flip the card
    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));

    setFlippedCards(prev => [...prev, cardId]);
  }, [cards, flippedCards, isChecking]);

  // check for matches
  useEffect(() => {
    if (flippedCards.length !== 2) return;

    setIsChecking(true);
    setMoves(prev => prev + 1);

    const [first, second] = flippedCards;
    const firstCard = cards.find(c => c.id === first);
    const secondCard = cards.find(c => c.id === second);

    if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
      // match found
      setTimeout(() => {
        setCards(prev => prev.map(c =>
          c.id === first || c.id === second ? { ...c, isMatched: true } : c
        ));
        setFlippedCards([]);
        setMatchedPairs(prev => prev + 1);
        setIsChecking(false);
      }, 500);
    } else {
      // no match - flip back
      setTimeout(() => {
        setCards(prev => prev.map(c =>
          c.id === first || c.id === second ? { ...c, isFlipped: false } : c
        ));
        setFlippedCards([]);
        setIsChecking(false);
      }, 1000);
    }
  }, [flippedCards, cards]);

  // check for win
  useEffect(() => {
    if (matchedPairs === CARD_PAIRS.length && gameState === 'playing') {
      const earned = calculateCoins(moves);
      setCoinsEarned(earned);
      setGameState('ended');
      if (onGameEnd) {
        onGameEnd(moves, earned);
      }
    }
  }, [matchedPairs, moves, gameState, onGameEnd]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* header */}
      <div className="text-center mb-6">
        <h1 className="font-heading text-5xl md:text-6xl">Meedo Memory</h1>
        <p className="text-xl text-gray-600 mt-2">
          match the pairs to win coins!
        </p>
      </div>

      {/* game stats */}
      <div className="flex justify-between items-center mb-6">
        <CoinDisplay coins={initialCoins + coinsEarned} size="sm" />
        <div className="flex items-center gap-4">
          <div className="bg-card border-2 border-black rounded-xl px-4 py-2">
            <span className="text-sm text-gray-500">moves</span>
            <p className="font-heading text-3xl">{moves}</p>
          </div>
          <div className="bg-card border-2 border-black rounded-xl px-4 py-2">
            <span className="text-sm text-gray-500">pairs</span>
            <p className="font-heading text-3xl">{matchedPairs}/{CARD_PAIRS.length}</p>
          </div>
        </div>
      </div>

      {/* game area */}
      <div className="bg-card rounded-3xl border-4 border-black p-6">
        {gameState === 'idle' && (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-6"
            >
              🧠
            </motion.div>
            <p className="text-xl text-gray-600 mb-6">
              find all the matching pairs!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="bg-purple-500 text-white font-heading text-2xl px-8 py-4 rounded-xl border-4 border-purple-600 hover:bg-purple-600 transition-colors"
            >
              Start Game!
            </motion.button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="grid grid-cols-4 gap-3">
            {cards.map((card) => (
              <motion.button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`aspect-square rounded-xl border-4 flex items-center justify-center text-4xl md:text-5xl transition-colors ${
                  card.isMatched
                    ? 'bg-green-100 border-green-400'
                    : card.isFlipped
                    ? 'bg-purple-100 border-purple-400'
                    : 'bg-gray-100 border-gray-300 hover:bg-gray-200 cursor-pointer'
                }`}
                whileHover={!card.isFlipped && !card.isMatched ? { scale: 1.05 } : {}}
                whileTap={!card.isFlipped && !card.isMatched ? { scale: 0.95 } : {}}
              >
                <AnimatePresence mode="wait">
                  {(card.isFlipped || card.isMatched) ? (
                    <motion.span
                      key="emoji"
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {card.emoji}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="hidden"
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-muted-foreground/70"
                    >
                      ?
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        )}

        {gameState === 'ended' && (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <p className="font-heading text-4xl mb-2">You Did It!</p>
              <p className="text-xl text-gray-600 mb-4">
                completed in {moves} moves!
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
                  className="bg-purple-500 text-white font-heading text-xl px-6 py-3 rounded-xl border-4 border-purple-600 hover:bg-purple-600 transition-colors"
                >
                  Play Again!
                </motion.button>
                <Link
                  href="/games"
                  className="text-lg text-gray-500 hover:text-gray-700 underline"
                >
                  back to games
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* tip */}
      {gameState === 'playing' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center"
        >
          <p className="text-gray-500">
            tip: fewer moves = more coins!
          </p>
        </motion.div>
      )}

      {/* back link */}
      {gameState !== 'ended' && (
        <div className="mt-6 text-center">
          <Link
            href="/games"
            className="text-lg text-gray-500 hover:text-gray-700 underline"
          >
            back to games
          </Link>
        </div>
      )}
    </div>
  );
};

export default MeedoMemory;
