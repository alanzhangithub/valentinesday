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
      className="bg-white rounded-2xl border-4 border-black p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="font-carrots text-2xl mb-4">add a spot</h3>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="font-cheeky text-lg block mb-1">restaurant name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chipotle"
            className="w-full px-4 py-2 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
        </div>

        {/* Cuisine */}
        <div>
          <label className="font-cheeky text-lg block mb-1">cuisine</label>
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white"
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
          <label className="font-cheeky text-lg block mb-1">price range</label>
          <div className="flex gap-2">
            {(['$', '$$', '$$$'] as PriceRange[]).map((price) => (
              <button
                key={price}
                type="button"
                onClick={() => setPriceRange(priceRange === price ? '' : price)}
                className={`px-4 py-2 rounded-xl border-2 border-black transition-colors ${
                  priceRange === price
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {price}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="font-cheeky text-lg block mb-1">location (optional)</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Downtown, Near campus"
            className="w-full px-4 py-2 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Weight (Preference) */}
        <div>
          <label className="font-cheeky text-lg block mb-1">
            how much do we like it? ({weight}/5)
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={weight}
            onChange={(e) => setWeight(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>meh</span>
            <span>love it!</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-6">
        {onCancel && (
          <motion.button
            type="button"
            onClick={onCancel}
            className="flex-1 font-carrots text-xl px-4 py-2 rounded-xl border-2 border-black bg-white"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            cancel
          </motion.button>
        )}
        <motion.button
          type="submit"
          className="flex-1 font-carrots text-xl px-4 py-2 rounded-xl border-2 border-black bg-black text-white"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          add restaurant
        </motion.button>
      </div>
    </motion.form>
  );
}
