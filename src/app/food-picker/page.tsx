'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Image
            src="/stickers/meedo-default.svg"
            alt="loading"
            width={80}
            height={80}
          />
        </motion.div>
        <p className="font-cheeky text-2xl text-gray-400">loading restaurants...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-cheeky text-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            back home
          </Link>
        </motion.div>

        {/* header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-carrots text-5xl md:text-6xl mb-3">where we eating?</h1>
          <p className="font-cheeky text-xl text-gray-500">
            let the wheel decide so we dont have to argue
          </p>
        </motion.div>

        {/* main content */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* left column - wheel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center lg:justify-end"
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
                className="w-full bg-black text-white font-carrots text-xl py-4 rounded-2xl border-4 border-black shadow-lg flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                add a restaurant
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Footer decoration */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="font-cheeky text-gray-300 text-sm">
            built with love for meedo and beedo
          </p>
        </motion.div>
      </div>
    </div>
  );
}
