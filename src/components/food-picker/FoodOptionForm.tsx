'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FoodOption, PriceRange } from '@/types/food';

interface FoodOptionFormProps {
  onSubmit: (option: Omit<FoodOption, 'id' | 'createdAt'>) => void;
  onCancel?: () => void;
}

const CUISINES = [
  'American',
  'Chinese',
  'Italian',
  'Japanese',
  'Korean',
  'Mexican',
  'Thai',
  'Vietnamese',
  'Indian',
  'Mediterranean',
  'Fast Food',
  'Brunch',
  'Dessert',
  'Other',
];

export default function FoodOptionForm({ onSubmit, onCancel }: FoodOptionFormProps) {
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [priceRange, setPriceRange] = useState<PriceRange | ''>('');
  const [location, setLocation] = useState('');
  const [weight, setWeight] = useState(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      cuisine: cuisine || undefined,
      priceRange: priceRange || undefined,
      location: location || undefined,
      addedBy: 'meedo', // TODO: get from auth
      weight,
    });

    // Reset form
    setName('');
    setCuisine('');
    setPriceRange('');
    setLocation('');
    setWeight(3);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="bg-card rounded-2xl border-4 border-black p-6 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="font-heading text-2xl mb-4">add a new spot</h3>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-lg block mb-1">whats it called? *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="chipotle, olive garden, etc"
            className="w-full px-4 py-3 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-gray-50"
            required
            autoFocus
          />
        </div>

        {/* Cuisine */}
        <div>
          <label className="text-lg block mb-1">type of food</label>
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 appearance-none cursor-pointer"
          >
            <option value="">pick one...</option>
            {CUISINES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="text-lg block mb-2">how expensive</label>
          <div className="flex gap-3">
            {(['$', '$$', '$$$'] as PriceRange[]).map((price) => (
              <motion.button
                key={price}
                type="button"
                onClick={() => setPriceRange(priceRange === price ? '' : price)}
                className={`flex-1 px-4 py-3 rounded-xl border-2 border-black transition-colors font-medium ${
                  priceRange === price
                    ? 'bg-black text-white'
                    : 'bg-card text-black hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {price}
                <span className="block text-xs mt-0.5 opacity-60">
                  {price === '$' ? 'cheap' : price === '$$' ? 'mid' : 'bougie'}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-lg block mb-1">where is it? (optional)</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="downtown, near campus, etc"
            className="w-full px-4 py-3 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-gray-50"
          />
        </div>

        {/* Weight (Preference) */}
        <div>
          <label className="text-lg block mb-2">
            how much do we love it?
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="5"
              value={weight}
              onChange={(e) => setWeight(parseInt(e.target.value))}
              className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
            />
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((w) => (
                <span
                  key={w}
                  className={`transition-colors ${
                    w <= weight ? 'text-pink-400' : 'text-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground/70 mt-1">
            <span>its aight</span>
            <span>obsessed</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-6">
        {onCancel && (
          <motion.button
            type="button"
            onClick={onCancel}
            className="flex-1 font-heading text-xl px-4 py-3 rounded-xl border-2 border-black bg-card hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            nevermind
          </motion.button>
        )}
        <motion.button
          type="submit"
          className="flex-1 font-heading text-xl px-4 py-3 rounded-xl border-2 border-black bg-black text-white"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          add it!
        </motion.button>
      </div>
    </motion.form>
  );
}
