'use client';

import React, { useCallback } from 'react';
import SlotMachine from '../../../components/games/SlotMachine';

export default function SlotsPage() {
  // todo: fetch actual coin balance from database
  const initialCoins = 100;

  const handleBalanceChange = useCallback(async (newBalance: number) => {
    // todo: update coin balance in database
    console.log(`Balance changed to: ${newBalance}`);

    try {
      const response = await fetch('/api/games/submit-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game: 'slots',
          newBalance,
        }),
      });

      if (!response.ok) {
        console.error('Failed to update balance');
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  }, []);

  return (
    <main className="min-h-screen py-8">
      <SlotMachine
        initialCoins={initialCoins}
        onBalanceChange={handleBalanceChange}
      />
    </main>
  );
}
