'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CreateCouponRequest, User } from '@/types/coupon';

interface CouponFormProps {
  currentUser: User;
  onSubmit: (data: CreateCouponRequest) => Promise<void>;
  onCancel?: () => void;
}

const CouponForm: React.FC<CouponFormProps> = ({ currentUser, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const characterImage = currentUser === 'meedo' ? '/meedo.png' : '/beedo.png';
  const recipientName = currentUser === 'meedo' ? 'Beedo' : 'Meedo';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        created_by: currentUser,
        expires_at: hasExpiry && expiryDate ? new Date(expiryDate).toISOString() : undefined,
      });
      // reset form on success
      setTitle('');
      setDescription('');
      setHasExpiry(false);
      setExpiryDate('');
    } catch (err) {
      console.error('Failed to create coupon:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // suggested coupon ideas
  const suggestions = [
    { title: 'Movie Night Pick', description: 'You get to pick the movie, no complaints!' },
    { title: 'Backrub Session', description: 'One free 15-minute backrub, redeemable anytime.' },
    { title: 'Breakfast in Bed', description: 'Wake up to breakfast served in bed!' },
    { title: 'No Chores Day', description: 'You get a day off from chores, I got it covered.' },
    { title: 'Date Night Planning', description: 'I plan the whole date, you just show up.' },
    { title: 'Boba Run', description: 'I will go get us boba, your order included!' },
  ];

  const applySuggestion = (suggestion: { title: string; description: string }) => {
    setTitle(suggestion.title);
    setDescription(suggestion.description);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-4 border-black p-6 shadow-lg"
    >
      {/* dashed inner border for coupon feel */}
      <div className="relative">
        <div className="absolute -inset-2 border-2 border-dashed border-gray-200 rounded-xl pointer-events-none" />

        <div className="flex items-center gap-4 mb-6">
          <motion.div
            animate={{ rotate: [-3, 3, -3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 relative"
          >
            <Image
              src={characterImage}
              alt={currentUser}
              fill
              className="object-contain"
            />
          </motion.div>
          <div>
            <h2 className="font-carrots text-2xl">Create a Coupon</h2>
            <p className="text-gray-600 text-sm">
              make something nice for {recipientName}
            </p>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Coupon Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="eg. Movie Night Pick"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none transition-colors"
              maxLength={50}
              required
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/50</p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="what does this coupon get them?"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none resize-none transition-colors"
              maxLength={200}
              required
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/200</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="hasExpiry"
              checked={hasExpiry}
              onChange={(e) => setHasExpiry(e.target.checked)}
              className="w-5 h-5 accent-pink-400"
            />
            <label htmlFor="hasExpiry" className="text-sm text-gray-700">
              Set an expiration date
            </label>
          </div>

          {hasExpiry && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                Expires On
              </label>
              <input
                type="date"
                id="expiryDate"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none transition-colors"
                required={hasExpiry}
              />
            </motion.div>
          )}

          <div className="flex gap-3 pt-4">
            {onCancel && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl border-2 border-black font-carrots hover:bg-gray-100 transition-colors"
              >
                Cancel
              </motion.button>
            )}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="flex-1 py-3 rounded-xl bg-black text-white font-carrots hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block"
                  />
                  Creating...
                </>
              ) : (
                <>
                  Create Coupon
                  <span className="text-pink-400">&#10084;</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>

      {/* suggestions */}
      <div className="mt-6 pt-6 border-t-2 border-gray-100">
        <p className="text-sm text-gray-500 mb-3">need ideas? try one of these:</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => applySuggestion(suggestion)}
              className="px-3 py-1.5 text-sm bg-pink-50 text-pink-600 rounded-full hover:bg-pink-100 transition-colors border border-pink-200"
            >
              {suggestion.title}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CouponForm;
