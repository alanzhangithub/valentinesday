'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import SpinWheel from '@/components/food-picker/SpinWheel';
import FoodList from '@/components/food-picker/FoodList';
import FoodOptionForm from '@/components/food-picker/FoodOptionForm';
import { FoodOption, RecentPick } from '@/types/food';

export default function FoodPickerPage() {
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([]);
  const [recentPicks, setRecentPicks] = useState<RecentPick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // fetch food options and recent picks
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/food-options');
      const data = await res.json();
      setFoodOptions(data.foodOptions);
      setRecentPicks(data.recentPicks);
    } catch (err) {
      console.error('failed to fetch food options:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // add new food option
  const handleAddOption = async (option: Omit<FoodOption, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/food-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(option),
      });
      const newOption = await res.json();
      setFoodOptions((prev) => [...prev, newOption]);
      setShowForm(false);
    } catch (err) {
      console.error('failed to add option:', err);
    }
  };

  // delete food option
  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/food-options?id=${id}`, { method: 'DELETE' });
      setFoodOptions((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error('failed to delete option:', err);
    }
  };

  // update weight
  const handleUpdateWeight = async (id: string, weight: number) => {
    try {
      const res = await fetch('/api/food-options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, weight }),
      });
      const updated = await res.json();
      setFoodOptions((prev) =>
        prev.map((o) => (o.id === id ? updated : o))
      );
    } catch (err) {
      console.error('failed to update weight:', err);
    }
  };

  // record a pick
  const handleResult = async (option: FoodOption, wasReroll: boolean) => {
    try {
      const res = await fetch('/api/food-options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pick',
          foodOptionId: option.id,
          foodOptionName: option.name,
          wasRerolled: wasReroll,
        }),
      });
      const newPick = await res.json();
      setRecentPicks((prev) => [newPick, ...prev.slice(0, 9)]);
    } catch (err) {
      console.error('failed to record pick:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="font-cheeky text-2xl text-gray-500">loading restaurants...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-carrots text-5xl mb-2">where we eating?</h1>
          <p className="font-cheeky text-xl text-gray-600">
            let the wheel decide so we dont have to
          </p>
        </motion.div>

        {/* main content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* left column - wheel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SpinWheel options={foodOptions} onResult={handleResult} />
          </motion.div>

          {/* right column - list + form */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FoodList
              options={foodOptions}
              recentPicks={recentPicks}
              onDelete={handleDelete}
              onUpdateWeight={handleUpdateWeight}
            />

            {showForm ? (
              <FoodOptionForm
                onSubmit={handleAddOption}
                onCancel={() => setShowForm(false)}
              />
            ) : (
              <motion.button
                onClick={() => setShowForm(true)}
                className="w-full bg-black text-white font-carrots text-xl py-3 rounded-xl border-4 border-black"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                + add a restaurant
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
