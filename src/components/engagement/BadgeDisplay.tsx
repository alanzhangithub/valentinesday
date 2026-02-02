'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Badge, UserRole } from '@/types/database';

interface BadgeWithStatus extends Badge {
  earned: boolean;
  earned_at: string | null;
}

interface BadgeDisplayProps {
  userRole: UserRole;
  compact?: boolean;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ userRole, compact = false }) => {
  const [badges, setBadges] = useState<BadgeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStatus | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch(`/api/badges?user_role=${userRole}`);
        const json = await res.json();
        if (json.success && json.data) {
          setBadges(json.data);
        }
      } catch (error) {
        console.error('failed to fetch badges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userRole]);

  const earnedBadges = badges.filter(b => b.earned);
  const unearnedBadges = badges.filter(b => !b.earned);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-black border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {earnedBadges.slice(0, 5).map((badge) => (
          <motion.div
            key={badge.id}
            whileHover={{ scale: 1.1 }}
            className="w-10 h-10 rounded-full bg-white border-2 border-black flex items-center justify-center text-lg cursor-pointer"
            onClick={() => setSelectedBadge(badge)}
            title={badge.name}
          >
            {badge.icon || '🏆'}
          </motion.div>
        ))}
        {earnedBadges.length > 5 && (
          <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-black flex items-center justify-center text-sm font-bold">
            +{earnedBadges.length - 5}
          </div>
        )}
        {earnedBadges.length === 0 && (
          <p className="text-gray-500 text-sm">no badges yet - go earn some!</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-4 border-black p-6">
      <h2 className="font-carrots text-2xl mb-4">
        {userRole === 'meedo' ? "Meedo's" : "Beedo's"} Achievements
      </h2>

      {/* Earned Badges */}
      <div className="mb-6">
        <h3 className="font-cheeky text-lg mb-3 text-gray-600">Earned ({earnedBadges.length})</h3>
        {earnedBadges.length === 0 ? (
          <p className="text-gray-400 text-sm">no badges yet - get out there and do stuff!</p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {earnedBadges.map((badge) => (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="relative cursor-pointer"
                onClick={() => setSelectedBadge(badge)}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200 border-3 border-black flex items-center justify-center text-2xl shadow-md">
                  {badge.icon || '🏆'}
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Locked Badges */}
      <div>
        <h3 className="font-cheeky text-lg mb-3 text-gray-600">Locked ({unearnedBadges.length})</h3>
        {unearnedBadges.length === 0 ? (
          <p className="text-gray-400 text-sm">wow you got em all. absolute legend.</p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {unearnedBadges.map((badge) => (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.05 }}
                className="relative cursor-pointer opacity-50 grayscale"
                onClick={() => setSelectedBadge(badge)}
              >
                <div className="w-14 h-14 rounded-xl bg-gray-200 border-3 border-gray-400 flex items-center justify-center text-2xl">
                  {badge.icon || '🔒'}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-white rounded-2xl border-4 border-black p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className={`w-20 h-20 mx-auto rounded-2xl ${selectedBadge.earned ? 'bg-gradient-to-br from-yellow-100 to-yellow-200' : 'bg-gray-200 grayscale'} border-4 border-black flex items-center justify-center text-4xl mb-4`}>
                  {selectedBadge.icon || (selectedBadge.earned ? '🏆' : '🔒')}
                </div>
                <h3 className="font-carrots text-2xl mb-2">{selectedBadge.name}</h3>
                <p className="text-gray-600 mb-4">{selectedBadge.description || 'a mysterious badge...'}</p>
                {selectedBadge.earned && selectedBadge.earned_at && (
                  <p className="text-sm text-gray-400">
                    earned on {new Date(selectedBadge.earned_at).toLocaleDateString()}
                  </p>
                )}
                {!selectedBadge.earned && (
                  <p className="text-sm text-gray-400 italic">keep grinding to unlock this one</p>
                )}
              </div>
              <button
                onClick={() => setSelectedBadge(null)}
                className="mt-4 w-full py-2 bg-black text-white rounded-xl font-cheeky text-lg hover:bg-gray-800 transition-colors"
              >
                close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BadgeDisplay;
