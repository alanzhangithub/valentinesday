'use client';

import React, { useCallback } from 'react';
import TapTheBeedo from '../../../components/games/TapTheBeedo';

export default function TapTheBeedoPage() {
  // todo: fetch actual coin balance from database and update on game end
  const initialCoins = 100;

  const handleGameEnd = useCallback(async (score: number, coinsEarned: number) => {
    // todo: submit score to api and update coin balance
    console.log(`Game ended! Score: ${score}, Coins earned: ${coinsEarned}`);

    try {
      const response = await fetch('/api/games/submit-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game: 'tap-the-beedo',
          score,
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
      <TapTheBeedo
        onGameEnd={handleGameEnd}
        initialCoins={initialCoins}
      />
    </main>
  );
}
