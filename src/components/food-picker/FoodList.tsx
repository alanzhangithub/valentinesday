'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FoodOption, RecentPick } from '@/types/food';

interface FoodListProps {
  options: FoodOption[];
  recentPicks: RecentPick[];
  onDelete: (id: string) => void;
  onUpdateWeight: (id: string, weight: number) => void;
}

export default function FoodList({
  options,
  recentPicks,
  onDelete,
  onUpdateWeight,
}: FoodListProps) {
  const [activeTab, setActiveTab] = useState<'restaurants' | 'history'>('restaurants');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-2xl border-4 border-black overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b-4 border-black">
        <button
          onClick={() => setActiveTab('restaurants')}
          className={`flex-1 font-carrots text-xl py-3 transition-colors ${
            activeTab === 'restaurants'
              ? 'bg-black text-white'
              : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          saved spots ({options.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 font-carrots text-xl py-3 transition-colors border-l-4 border-black ${
            activeTab === 'history'
              ? 'bg-black text-white'
              : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          recent picks
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'restaurants' ? (
            <motion.div
              key="restaurants"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {options.length === 0 ? (
                <p className="font-cheeky text-gray-500 text-center py-4">
                  no restaurants added yet~
                </p>
              ) : (
                options.map((option) => (
                  <motion.div
                    key={option.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-3 p-3 rounded-xl border-2 border-black bg-gray-50"
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate">{option.name}</h4>
                      <div className="flex gap-2 text-sm text-gray-600">
                        {option.cuisine && <span>{option.cuisine}</span>}
                        {option.priceRange && (
                          <>
                            {option.cuisine && <span>-</span>}
                            <span>{option.priceRange}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Weight indicator */}
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-500">preference</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((w) => (
                          <button
                            key={w}
                            onClick={() => onUpdateWeight(option.id, w)}
                            className={`w-3 h-3 rounded-full border border-black transition-colors ${
                              w <= option.weight ? 'bg-black' : 'bg-white'
                            }`}
                            title={`Set preference to ${w}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Delete */}
                    {confirmDelete === option.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            onDelete(option.id);
                            setConfirmDelete(null);
                          }}
                          className="px-2 py-1 text-sm bg-red-500 text-white rounded-lg"
                        >
                          yes
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 text-sm bg-gray-200 rounded-lg"
                        >
                          no
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(option.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {recentPicks.length === 0 ? (
                <p className="font-cheeky text-gray-500 text-center py-4">
                  no picks yet! spin the wheel~
                </p>
              ) : (
                recentPicks.map((pick) => (
                  <motion.div
                    key={pick.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-3 rounded-xl border-2 border-black bg-gray-50"
                  >
                    <div>
                      <h4 className="font-bold">{pick.foodOptionName}</h4>
                      <p className="text-sm text-gray-500">
                        {formatDate(pick.pickedAt)}
                      </p>
                    </div>
                    {pick.wasRerolled && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 rounded-full border border-yellow-300">
                        rerolled
                      </span>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
