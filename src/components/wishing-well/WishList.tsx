'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wish, WishStatus } from '@/types/wish';

interface WishListProps {
  wishes: Wish[];
  isAdmin?: boolean;
  onGrantWish?: (id: string, status: 'granted' | 'denied', note?: string) => Promise<void>;
  isLoading?: boolean;
  currentUser?: 'meedo' | 'beedo';
}

const statusConfig: Record<WishStatus, { label: string; color: string; bg: string; border: string; icon: string }> = {
  pending: {
    label: 'Awaiting Mod',
    color: 'text-amber-700',
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    border: 'border-amber-300',
    icon: '...',
  },
  granted: {
    label: 'Granted!',
    color: 'text-green-700',
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    border: 'border-green-400',
    icon: '!',
  },
  denied: {
    label: 'Denied',
    color: 'text-red-600',
    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
    border: 'border-red-300',
    icon: 'x',
  },
};

const quickResponses = [
  'It shall be done.',
  'Mod has spoken.',
  'Your wish is my command.',
  'The stars have aligned.',
  'This is the way.',
];

const denyResponses = [
  'Not today, little one.',
  'Perhaps another time.',
  'Mod works in mysterious ways.',
  'The timing is not right.',
];

export default function WishList({ wishes, isAdmin = false, onGrantWish, isLoading, currentUser = 'beedo' }: WishListProps) {
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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-16 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-black border-t-transparent rounded-full"
        />
        <p className="text-gray-500">consulting the ancient scrolls...</p>
      </div>
    );
  }

  if (wishes.length === 0) {
    return (
      <div className="text-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl mx-auto mb-6 opacity-30"
        >
          ✨
        </motion.div>
        <p className="font-heading text-2xl text-muted-foreground/70 mb-2">
          No wishes here yet...
        </p>
        <p className="text-lg text-muted-foreground/70">
          The well awaits your deepest desires
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-3xl text-center mb-6">Wish Chronicle</h2>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {wishes.map((wish, index) => {
            const config = statusConfig[wish.status];
            const isExpanded = expandedWish === wish.id;
            const isOwnWish = wish.wished_by === currentUser;

            return (
              <motion.div
                key={wish.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
                className={`rounded-xl border-2 ${config.border} ${config.bg} p-4 transition-all duration-200 shadow-sm hover:shadow-md`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    {/* Wish text */}
                    <p className="text-lg text-gray-800 leading-relaxed">
                      &quot;{wish.text}&quot;
                    </p>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-gray-500">
                      <span className={`font-medium ${isOwnWish ? 'text-indigo-600' : ''}`}>
                        - {wish.wished_by === 'meedo' ? 'Meedo' : 'Beedo'}
                        {isOwnWish && ' (you)'}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="text-muted-foreground/70">
                        {getTimeAgo(wish.wished_at)}
                      </span>
                    </div>

                    {/* Status note from Mod */}
                    {wish.status_note && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3 bg-card/60 rounded-lg border border-border"
                      >
                        <p className="text-sm text-gray-600">
                          <span className="font-bold text-gray-700">Mod says:</span> &quot;{wish.status_note}&quot;
                        </p>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {/* Status badge */}
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`px-3 py-1.5 rounded-full text-sm font-bold ${config.color} bg-card/80 border ${config.border} shadow-sm`}
                    >
                      <span className="mr-1">{config.icon}</span>
                      {config.label}
                    </motion.span>

                    {/* Admin actions for pending wishes */}
                    {isAdmin && wish.status === 'pending' && (
                      <motion.button
                        onClick={() => setExpandedWish(isExpanded ? null : wish.id)}
                        className="text-sm text-gray-500 hover:text-black transition-colors underline-offset-2 hover:underline"
                        whileHover={{ scale: 1.05 }}
                      >
                        {isExpanded ? 'cancel' : 'judge this wish'}
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
                      <div className="mt-4 pt-4 border-t border-gray-300/50">
                        <p className="text-xs text-gray-500 mb-2">Quick responses:</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {quickResponses.map((response, i) => (
                            <button
                              key={i}
                              onClick={() => setStatusNote(response)}
                              className="text-xs px-2 py-1 bg-card/80 border border-border rounded-full hover:border-black transition-colors"
                            >
                              {response}
                            </button>
                          ))}
                        </div>

                        <textarea
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder="Add a divine message (optional)..."
                          className="w-full p-3 border-2 border-border rounded-lg resize-none focus:outline-none focus:border-black transition-colors text-sm bg-card/80"
                          rows={2}
                        />

                        <div className="flex gap-3 mt-3">
                          <motion.button
                            onClick={() => handleGrant(wish.id, 'granted')}
                            disabled={grantingId === wish.id}
                            className="flex-1 py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-heading disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {grantingId === wish.id ? 'Granting...' : 'Grant Wish'}
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              if (!statusNote) {
                                setStatusNote(denyResponses[Math.floor(Math.random() * denyResponses.length)]);
                              }
                              handleGrant(wish.id, 'denied');
                            }}
                            disabled={grantingId === wish.id}
                            className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-heading disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {grantingId === wish.id ? 'Denying...' : 'Deny Wish'}
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
