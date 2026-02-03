'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import CoinDisplay from './games/CoinDisplay';

interface Word {
  original: string;
  mLanguage: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints?: string[];
}

const wordList: Word[] = [
  // Easy Words (5 coins)
  { original: 'cat', mLanguage: 'meedo', difficulty: 'easy' },
  { original: 'sup', mLanguage: 'sum', difficulty: 'easy' },
  { original: 'hi', mLanguage: 'mi', difficulty: 'easy' },
  { original: 'bye', mLanguage: 'meece', difficulty: 'easy' },

  // Medium Words (10 coins)
  { original: 'sleep', mLanguage: 'eep', difficulty: 'medium' },
  { original: 'sandwich', mLanguage: 'sammy', difficulty: 'medium' },
  { original: 'sorry', mLanguage: 'morry', difficulty: 'medium' },
  { original: 'know', mLanguage: 'mo', difficulty: 'medium' },
  { original: 'please', mLanguage: 'mlease', difficulty: 'medium' },

  // Hard Words (20 coins)
  { original: 'dictionary', mLanguage: 'dicshimary', difficulty: 'hard',
    hints: ['dicsh...', 'dicshim...'] },
  { original: 'valentine', mLanguage: 'malentimes', difficulty: 'hard',
    hints: ['mal...', 'malen...'] },
  { original: 'computer / PC', mLanguage: 'meecee', difficulty: 'hard',
    hints: ['mee...', 'meec...'] },
  { original: 'beautiful', mLanguage: 'meautiful', difficulty: 'hard',
    hints: ['meau...', 'meaut...'] },
  { original: 'picture', mLanguage: 'micture', difficulty: 'hard',
    hints: ['mic...', 'mict...'] }
];

const getCoinsForDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): number => {
  switch (difficulty) {
    case 'easy': return 5;
    case 'medium': return 10;
    case 'hard': return 20;
  }
};

const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard'): string => {
  switch (difficulty) {
    case 'easy': return 'bg-green-100 text-green-700 border-green-300';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'hard': return 'bg-red-100 text-red-700 border-red-300';
  }
};

interface BeedoSpellingMeeProps {
  onWordComplete?: (word: string, coinsEarned: number) => void;
  initialCoins?: number;
}

const BeedoSpellingMee: React.FC<BeedoSpellingMeeProps> = ({
  onWordComplete,
  initialCoins = 100,
}) => {
  const [currentWord, setCurrentWord] = useState<Word>(() => {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    return wordList[randomIndex];
  });
  const [userAnswer, setUserAnswer] = useState('');
  const [nervousness, setNervousness] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [totalCoins, setTotalCoins] = useState(initialCoins);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastEarned, setLastEarned] = useState(0);
  const [streak, setStreak] = useState(0);

  const getBeedoExpression = (nervousness: number): string => {
    if (nervousness === 0) return '(^ . ^)';
    if (nervousness === 1) return '(o _ o)';
    if (nervousness === 2) return '(> _ <)';
    return '(T _ T)';
  };

  const getBeedoThought = (nervousness: number): string => {
    if (nervousness === 0) return 'i think i got this!';
    if (nervousness === 1) return 'oh... something feels off...';
    if (nervousness === 2) return 'this is getting scary...';
    return 'help! im totally lost!';
  };

  const checkSpelling = (input: string) => {
    const target = currentWord.mLanguage;
    let nervousLevel = 0;

    for (let i = 0; i < input.length; i++) {
      if (i >= target.length || input[i] !== target[i]) {
        nervousLevel++;
        if (nervousLevel > 3) nervousLevel = 3;
      }
    }

    setNervousness(nervousLevel);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswer = e.target.value.toLowerCase();
    setUserAnswer(newAnswer);
    setIsTyping(true);
    checkSpelling(newAnswer);

    if (nervousness > 0 && currentWord.hints && !showHint) {
      setShowHint(true);
    }

    setTimeout(() => setIsTyping(false), 150);
  };

  const handleSubmit = useCallback(() => {
    if (userAnswer.toLowerCase() === currentWord.mLanguage.toLowerCase()) {
      // correct answer - award coins!
      const baseCoins = getCoinsForDifficulty(currentWord.difficulty);
      const bonusMultiplier = showHint ? 0.5 : 1; // half coins if hint was used
      const earnedCoins = Math.floor(baseCoins * bonusMultiplier);

      setLastEarned(earnedCoins);
      setTotalCoins(prev => prev + earnedCoins);
      setWordsCompleted(prev => prev + 1);
      setStreak(prev => prev + 1);
      setShowCelebration(true);

      if (onWordComplete) {
        onWordComplete(currentWord.original, earnedCoins);
      }

      // hide celebration and move to next word
      setTimeout(() => {
        setShowCelebration(false);
        const availableWords = wordList.filter(w => w !== currentWord);
        const nextWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        setCurrentWord(nextWord);
        setUserAnswer('');
        setNervousness(0);
        setShowHint(false);
        setCurrentHintIndex(0);
      }, 1500);
    } else {
      // wrong answer
      setStreak(0);
      if (currentWord.hints && currentHintIndex < currentWord.hints.length - 1) {
        setCurrentHintIndex(prev => prev + 1);
      }
      setShowHint(true);
      setNervousness(3);
    }
  }, [userAnswer, currentWord, showHint, currentHintIndex, onWordComplete]);

  const skipWord = useCallback(() => {
    setStreak(0);
    const availableWords = wordList.filter(w => w !== currentWord);
    const nextWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    setCurrentWord(nextWord);
    setUserAnswer('');
    setNervousness(0);
    setShowHint(false);
    setCurrentHintIndex(0);
  }, [currentWord]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="text-center mb-6">
        <h1 className="font-carrots text-5xl md:text-6xl">Spelling Mee</h1>
        <p className="font-cheeky text-xl text-gray-600 mt-2">help beedo spell in m language!</p>
      </div>

      {/* stats bar */}
      <div className="flex justify-between items-center mb-6">
        <CoinDisplay coins={totalCoins} size="sm" />
        <div className="flex items-center gap-3">
          <div className="bg-white border-2 border-black rounded-xl px-3 py-2">
            <span className="font-cheeky text-xs text-gray-500">words</span>
            <p className="font-carrots text-2xl">{wordsCompleted}</p>
          </div>
          {streak > 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-orange-100 border-2 border-orange-400 rounded-xl px-3 py-2"
            >
              <span className="font-cheeky text-xs text-orange-600">streak</span>
              <p className="font-carrots text-2xl text-orange-700">{streak}</p>
            </motion.div>
          )}
        </div>
      </div>

      <div className="relative bg-white rounded-3xl border-4 border-black p-8">
        {/* difficulty badge */}
        <div className="absolute -top-3 left-6">
          <span className={`font-cheeky text-sm px-3 py-1 rounded-full border-2 ${getDifficultyColor(currentWord.difficulty)}`}>
            {currentWord.difficulty} (+{getCoinsForDifficulty(currentWord.difficulty)} coins)
          </span>
        </div>

        <div className="pt-4 text-center">
          {/* beedo character */}
          <motion.div
            animate={{
              scale: isTyping ? 1.05 : 1,
              y: nervousness > 2 ? [0, -5, 0, 5, 0] : 0,
            }}
            transition={nervousness > 2 ? { duration: 0.3, repeat: Infinity } : {}}
            className="mb-4"
          >
            <div className="w-32 h-32 mx-auto bg-pink-50 rounded-full border-4 border-pink-200 flex items-center justify-center">
              <span className="font-mono text-2xl font-bold text-pink-600">
                {getBeedoExpression(nervousness)}
              </span>
            </div>
            <span className="font-cheeky text-lg text-pink-600">beedo</span>
          </motion.div>

          {/* word to translate */}
          <div className="mb-6">
            <p className="font-cheeky text-lg text-gray-500">translate this to m language:</p>
            <p className="font-carrots text-4xl mt-2">"{currentWord.original}"</p>
          </div>

          {/* hint area */}
          <AnimatePresence>
            {showHint && currentWord.hints && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-yellow-50 rounded-xl border-2 border-yellow-200"
              >
                <p className="font-cheeky text-lg text-yellow-800">
                  hint: {currentWord.hints[currentHintIndex]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* input area */}
          <div className="relative mb-4">
            <input
              type="text"
              value={userAnswer}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full p-4 border-4 border-black rounded-xl font-cheeky text-2xl text-center focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="type your answer..."
              disabled={showCelebration}
            />
          </div>

          {/* beedo's thought */}
          <p className="font-cheeky text-lg text-gray-500 italic mb-4">
            "{getBeedoThought(nervousness)}"
          </p>

          {/* buttons */}
          <div className="flex gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={showCelebration || !userAnswer}
              className="bg-blue-500 text-white font-carrots text-xl px-6 py-3 rounded-xl border-4 border-blue-600 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check!
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={skipWord}
              disabled={showCelebration}
              className="bg-gray-200 text-gray-700 font-cheeky text-lg px-4 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              skip
            </motion.button>
          </div>
        </div>

        {/* celebration overlay */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 rounded-3xl flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <p className="font-carrots text-3xl text-green-600">Correct!</p>
                <motion.p
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  className="font-carrots text-4xl text-yellow-600 mt-2"
                >
                  +{lastEarned} coins!
                </motion.p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* back link */}
      <div className="mt-6 text-center">
        <Link
          href="/games"
          className="font-cheeky text-lg text-gray-500 hover:text-gray-700 underline"
        >
          back to games
        </Link>
      </div>
    </div>
  );
};

export default BeedoSpellingMee;
