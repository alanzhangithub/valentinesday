'use client';

import React, { useCallback } from 'react';
import BeedoSpellingMee from '../../components/BeedoSpellingMee';

export default function SpellingMeePage() {
  // todo: fetch actual coin balance from database
  const initialCoins = 100;

  const handleWordComplete = useCallback(async (word: string, coinsEarned: number) => {
    // todo: submit score to api and update coin balance
    console.log(`Word completed! Word: ${word}, Coins earned: ${coinsEarned}`);

    try {
      const response = await fetch('/api/games/submit-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game: 'spelling-mee',
          word,
          coinsEarned,
        }),
      });

      if (!response.ok) {
        console.error('Failed to submit score');
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  }, []);

  return (
    <main className="min-h-screen py-8">
      <BeedoSpellingMee
        onWordComplete={handleWordComplete}
        initialCoins={initialCoins}
      />
    </main>
  );
}
