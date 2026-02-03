'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wish, WishStatus } from '@/types/wish';

interface WishListProps {
  wishes: Wish[];
  isAdmin?: boolean;
  onGrantWish?: (id: string, status: 'granted' | 'denied', note?: string) => Promise<void>;
  isLoading?: boolean;
}

const statusConfig: Record<WishStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending: {
    label: 'Awaiting Mod',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-300',
    icon: '...',
  },
  granted: {
    label: 'Granted!',
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-300',
    icon: '!',
  },
  denied: {
    label: 'Denied',
    color: 'text-red-500',
    bg: 'bg-red-50 border-red-300',
    icon: 'x',
  },
};

export default function WishList({ wishes, isAdmin = false, onGrantWish, isLoading }: WishListProps) {
  const [expandedWish, setExpandedWish] = useState<string | null>(null);
  const [grantingId, setGrantingId] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState('');

  const handleGrant = async (id: string, status: 'granted' | 'denied') => {
    if (!onGrantWish) return;
    setGrantingId(id);
    await onGrantWish(id, status, statusNote || undefined);
    setGrantingId(null);
    setStatusNote('');
    setExpandedWish(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-black border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (wishes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-cheeky text-xl text-gray-500">
          No wishes have been cast yet...
        </p>
        <p className="font-cheeky text-lg text-gray-400 mt-2">
          The well awaits your dreams
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-carrots text-3xl text-center mb-6">Wish Chronicle</h2>

      <div className="grid gap-4">
        <AnimatePresence>
          {wishes.map((wish, index) => {
            const config = statusConfig[wish.status];
            const isExpanded = expandedWish === wish.id;

            return (
              <motion.div
                key={wish.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-xl border-2 p-4 ${config.bg} transition-all duration-200`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-cheeky text-lg text-gray-800">
                      &quot;{wish.text}&quot;
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <span className="font-medium">
                        - {wish.wished_by === 'meedo' ? 'Meedo' : 'Beedo'}
                      </span>
                      <span>|</span>
                      <span>
                        {new Date(wish.wished_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    {wish.status_note && (
                      <p className="mt-2 text-sm italic text-gray-600">
                        Mod says: &quot;{wish.status_note}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color} border ${config.bg}`}>
                      {config.icon} {config.label}
                    </span>

                    {/* Admin actions for pending wishes */}
                    {isAdmin && wish.status === 'pending' && (
                      <motion.button
                        onClick={() => setExpandedWish(isExpanded ? null : wish.id)}
                        className="text-sm text-gray-500 hover:text-black transition-colors"
                        whileHover={{ scale: 1.05 }}
                      >
                        {isExpanded ? 'Cancel' : 'Judge this wish'}
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Admin grant/deny panel */}
                <AnimatePresence>
                  {isAdmin && isExpanded && wish.status === 'pending' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <textarea
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder="Add a divine message (optional)..."
                          className="w-full p-3 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:border-black text-sm"
                          rows={2}
                        />
                        <div className="flex gap-3 mt-3">
                          <motion.button
                            onClick={() => handleGrant(wish.id, 'granted')}
                            disabled={grantingId === wish.id}
                            className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg font-medium disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Grant Wish
                          </motion.button>
                          <motion.button
                            onClick={() => handleGrant(wish.id, 'denied')}
                            disabled={grantingId === wish.id}
                            className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg font-medium disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Deny Wish
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
