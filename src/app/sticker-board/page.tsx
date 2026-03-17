'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { Board, ApiResponse } from '@/types/database';

export default function StickerBoardPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch boards on mount
  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const res = await fetch('/api/boards');
      const json: ApiResponse<Board[]> = await res.json();
      if (json.success && json.data) {
        setBoards(json.data);
      }
    } catch (err) {
      console.error('failed to fetch boards:', err);
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async () => {
    if (!newBoardName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBoardName.trim(),
          created_by: 'meedo', // todo: get from auth
        }),
      });

      const json: ApiResponse<Board> = await res.json();
      if (json.success && json.data) {
        setBoards((prev) => [json.data!, ...prev]);
        setNewBoardName('');
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error('failed to create board:', err);
    } finally {
      setCreating(false);
    }
  };

  const deleteBoard = async (id: string) => {
    if (!confirm('delete this board? this cant be undone')) return;

    try {
      const res = await fetch(`/api/boards?id=${id}`, {
        method: 'DELETE',
      });

      const json: ApiResponse<null> = await res.json();
      if (json.success) {
        setBoards((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error('failed to delete board:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-sm text-muted-foreground/70 hover:text-gray-600 transition-colors">
                back to home
              </Link>
              <h1 className="text-2xl font-bold text-foreground mt-1">sticker boards</h1>
              <p className="text-gray-500 mt-1">decorate boards together with meedo and beedo stickers</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              new board
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full" />
          </div>
        ) : boards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-3xl mx-auto mb-6 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/70">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">no boards yet</h2>
            <p className="text-gray-500 mb-6">create your first sticker board to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              create first board
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board, index) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-2xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden group"
              >
                {/* Preview area */}
                <Link href={`/sticker-board/${board.id}`}>
                  <div className="aspect-video bg-gray-50 relative">
                    {board.canvas_data.stickers.length > 0 ? (
                      <div className="absolute inset-0 overflow-hidden">
                        {board.canvas_data.stickers.slice(0, 5).map((sticker, i) => (
                          <div
                            key={sticker.id}
                            className="absolute w-12 h-12"
                            style={{
                              left: `${20 + (i * 15)}%`,
                              top: `${20 + (i * 10)}%`,
                              transform: `rotate(${sticker.rotation}deg) scale(${Math.min(sticker.scale, 1)})`,
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={sticker.src} alt="" className="w-full h-full object-contain" />
                          </div>
                        ))}
                        {board.canvas_data.stickers.length > 5 && (
                          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                            +{board.canvas_data.stickers.length - 5} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Link href={`/sticker-board/${board.id}`}>
                        <h3 className="font-medium text-foreground truncate hover:text-gray-600 transition-colors">
                          {board.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {board.canvas_data.stickers.length} sticker{board.canvas_data.stickers.length !== 1 ? 's' : ''} - updated {formatDate(board.updated_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteBoard(board.id)}
                      className="p-2 text-muted-foreground/70 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-semibold text-foreground mb-4">create new board</h2>
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="board name..."
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && createBoard()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 border rounded-xl hover:bg-gray-50 transition-colors"
              >
                cancel
              </button>
              <button
                onClick={createBoard}
                disabled={!newBoardName.trim() || creating}
                className="flex-1 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'creating...' : 'create'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
