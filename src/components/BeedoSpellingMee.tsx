import React, { useState, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion } from 'framer-motion';

interface Word {
  original: string;
  mLanguage: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'panic';
  hints?: string[];
}

const wordList: Word[] = [
  // Easy Words
  { original: 'cat', mLanguage: 'meedo', difficulty: 'easy' },
  { original: 'sup', mLanguage: 'sum', difficulty: 'easy' },
  { original: 'hi', mLanguage: 'mi', difficulty: 'easy' },
  { original: 'bye', mLanguage: 'meece', difficulty: 'easy' },
  
  // Medium Words
  { original: 'sleep', mLanguage: 'eep', difficulty: 'medium' },
  { original: 'sandwich', mLanguage: 'sammy', difficulty: 'medium' },
  { original: 'sorry', mLanguage: 'morry', difficulty: 'medium' },
  { original: 'know', mLanguage: 'mo', difficulty: 'medium' },
  { original: 'please', mLanguage: 'mlease', difficulty: 'medium' },
  
  // Hard Words
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

const BeedoSpellingMee: React.FC = () => {
  const [currentWord, setCurrentWord] = useState<Word>(() => {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    return wordList[randomIndex];
  });
  const [userAnswer, setUserAnswer] = useState('');
  const [nervousness, setNervousness] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  const getBeedoExpression = (nervousness: number): string => {
    if (nervousness === 0) return '😊';
    if (nervousness === 1) return '😅';
    if (nervousness === 2) return '😰';
    return '😱';
  };

  const getBeedoThought = (nervousness: number): string => {
    if (nervousness === 0) return 'I think I got this!';
    if (nervousness === 1) return 'Oh... something feels off...';
    if (nervousness === 2) return 'This is getting scary...';
    return 'Help! I\'m totally lost!';
  };

  const checkSpelling = (input: string) => {
    const target = currentWord.mLanguage;
    let nervousLevel = 0;
    
    // Check each character against the target word
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
    
    // Show hints after first mistake
    if (nervousness > 0 && currentWord.hints && !showHint) {
      setShowHint(true);
    }
    
    // Clear typing indicator after delay
    setTimeout(() => setIsTyping(false), 150);
  };

  const handleSubmit = () => {
    if (userAnswer.toLowerCase() === currentWord.mLanguage.toLowerCase()) {
      // Correct answer! Move to next random word
      const availableWords = wordList.filter(w => w !== currentWord);
      const nextWord = availableWords[Math.floor(Math.random() * availableWords.length)];
      setCurrentWord(nextWord);
      setUserAnswer('');
      setNervousness(0);
      setShowHint(false);
      setCurrentHintIndex(0);
    } else {
      // Wrong answer - show next hint if available
      if (currentWord.hints && currentHintIndex < currentWord.hints.length - 1) {
        setCurrentHintIndex(prev => prev + 1);
      }
      setShowHint(true);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="font-carrots text-6xl">Spelling Mee</h1>
        <p className="font-cheeky text-2xl mt-2">Help Beedo spell in M language!</p>
      </div>

      <div className="relative bg-white rounded-3xl border-4 border-black p-8 mb-8">
        <div className="absolute top-0 left-0 w-full h-16 bg-red-600 rounded-t-2xl"></div>
        <div className="absolute top-16 left-4 w-4 h-64 bg-red-600"></div>
        <div className="absolute top-16 right-4 w-4 h-64 bg-red-600"></div>

        <div className="pt-20 text-center">
          <motion.div
            animate={{
              scale: isTyping ? 1.05 : 1,
            }}
            className="w-48 h-48 mx-auto mb-4 relative"
          >
            <div className="font-carrots text-6xl">
              {getBeedoExpression(nervousness)}
            </div>
          </motion.div>

          <div className="mb-6">
            <p className="font-carrots text-3xl">Spell this word in M language:</p>
            <p className="font-cheeky text-4xl mt-2">{currentWord.original}</p>
            {showHint && currentWord.hints && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                <p className="font-cheeky text-2xl text-yellow-800">
                  Hint: {currentWord.hints[currentHintIndex]}
                </p>
              </div>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={userAnswer}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full p-4 border-4 border-black rounded-xl font-cheeky text-2xl text-center"
              placeholder="Type your answer..."
            />
            <p className="font-cheeky text-lg mt-4 text-gray-600 italic">
              {getBeedoThought(nervousness)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeedoSpellingMee;