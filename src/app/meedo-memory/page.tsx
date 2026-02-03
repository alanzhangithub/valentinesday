'use client';

import React, { useCallback } from 'react';
import MeedoMemory from '../../components/games/MeedoMemory';

export default function MemoryPage() {
  // todo: fetch actual coin balance from database
  const initialCoins = 100;

  const handleGameEnd = useCallback(async (moves: number, coinsEarned: number) => {
    // todo: submit score to api and update coin balance
    console.log(`Game ended! Moves: ${moves}, Coins earned: ${coinsEarned}`);

    try {
      const response = await fetch('/api/games/submit-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game: 'meedo-memory',
          moves,
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
      <MeedoMemory
        onGameEnd={handleGameEnd}
        initialCoins={initialCoins}
      />
    </main>
  );
}
