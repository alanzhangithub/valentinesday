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

  // Get time ago string
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  return (
    <div className="bg-card rounded-2xl border-4 border-black overflow-hidden shadow-lg">
      {/* Tabs */}
      <div className="flex border-b-4 border-black">
        <button
          onClick={() => setActiveTab('restaurants')}
          className={`flex-1 font-heading text-lg py-3 transition-colors ${
            activeTab === 'restaurants'
              ? 'bg-black text-white'
              : 'bg-card text-black hover:bg-gray-100'
          }`}
        >
          our spots ({options.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 font-heading text-lg py-3 transition-colors border-l-4 border-black ${
            activeTab === 'history'
              ? 'bg-black text-white'
              : 'bg-card text-black hover:bg-gray-100'
          }`}
        >
          history ({recentPicks.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
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
                <div className="text-center py-8">
                  <p className="text-xl text-muted-foreground/70">
                    no restaurants added yet~
                  </p>
                  <p className="text-gray-300 mt-1">
                    add some spots below!
                  </p>
                </div>
              ) : (
                options.map((option, index) => (
                  <motion.div
                    key={option.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl border-2 border-black bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate text-lg">{option.name}</h4>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                        {option.cuisine && (
                          <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">
                            {option.cuisine}
                          </span>
                        )}
                        {option.priceRange && (
                          <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">
                            {option.priceRange}
                          </span>
                        )}
                        {option.location && (
                          <span className="text-xs text-muted-foreground/70">
                            {option.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Weight indicator - hearts instead of dots */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">vibe</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((w) => (
                          <button
                            key={w}
                            onClick={() => onUpdateWeight(option.id, w)}
                            className={`transition-all hover:scale-110 ${
                              w <= option.weight ? 'text-pink-400' : 'text-gray-200'
                            }`}
                            title={`Set preference to ${w}`}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Delete */}
                    {confirmDelete === option.id ? (
                      <div className="flex gap-1">
                        <motion.button
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          onClick={() => {
                            onDelete(option.id);
                            setConfirmDelete(null);
                          }}
                          className="px-2 py-1 text-sm bg-red-500 text-white rounded-lg font-medium"
                        >
                          yep
                        </motion.button>
                        <motion.button
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 text-sm bg-gray-200 rounded-lg font-medium"
                        >
                          nah
                        </motion.button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(option.id)}
                        className="p-2 text-gray-300 hover:text-red-400 transition-colors"
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
                <div className="text-center py-8">
                  <p className="text-xl text-muted-foreground/70">
                    no picks yet!
                  </p>
                  <p className="text-gray-300 mt-1">
                    spin the wheel to decide~
                  </p>
                </div>
              ) : (
                recentPicks.map((pick, index) => (
                  <motion.div
                    key={pick.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl border-2 border-border bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold">{pick.foodOptionName}</h4>
                        <p className="text-sm text-muted-foreground/70">
                          {getTimeAgo(pick.pickedAt)}
                        </p>
                      </div>
                    </div>
                    {pick.wasRerolled && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full border border-yellow-200 font-medium">
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

      {/* Fun footer message */}
      <div className="border-t-2 border-border/50 px-4 py-2">
        <p className="text-xs text-gray-300 text-center">
          {activeTab === 'restaurants'
            ? 'higher vibe = more likely to be picked'
            : 'we really be eating out a lot huh'}
        </p>
      </div>
    </div>
  );
}
