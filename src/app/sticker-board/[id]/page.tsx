'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Canvas from '@/components/sticker-board/Canvas';
import StickerLibrary from '@/components/sticker-board/StickerLibrary';
import type { Board, CanvasData, ApiResponse, StickerData } from '@/types/database';

interface BoardPageProps {
  params: Promise<{ id: string }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const { id } = use(params);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch board on mount
  useEffect(() => {
    fetchBoard();
  }, [id]);

  const fetchBoard = async () => {
    try {
      const res = await fetch(`/api/boards?id=${id}`);
      const json: ApiResponse<Board> = await res.json();

      if (json.success && json.data) {
        setBoard(json.data);
      } else {
        setError(json.error || 'board not found');
      }
    } catch (err) {
      console.error('failed to fetch board:', err);
      setError('failed to load board');
    } finally {
      setLoading(false);
    }
  };

  // Save board
  const saveBoard = useCallback(async (canvasData: CanvasData) => {
    if (!board) return;

    setSaving(true);
    try {
      const res = await fetch('/api/boards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: board.id,
          canvas_data: canvasData,
        }),
      });

      const json: ApiResponse<Board> = await res.json();
      if (json.success) {
        setLastSaved(new Date());
        setHasChanges(false);
      }
    } catch (err) {
      console.error('failed to save board:', err);
    } finally {
      setSaving(false);
    }
  }, [board]);

  // Debounced save on canvas update
  const handleCanvasUpdate = useCallback((canvasData: CanvasData) => {
    setBoard((prev) => prev ? { ...prev, canvas_data: canvasData } : null);
    setHasChanges(true);
  }, []);

  // Auto-save when changes detected (debounced)
  useEffect(() => {
    if (!hasChanges || !board) return;

    const timeout = setTimeout(() => {
      saveBoard(board.canvas_data);
    }, 1500); // save 1.5s after last change

    return () => clearTimeout(timeout);
  }, [hasChanges, board, saveBoard]);

  // Add sticker programmatically
  const handleAddSticker = useCallback((src: string) => {
    if (!board) return;

    const newSticker: StickerData = {
      id: crypto.randomUUID(),
      src,
      x: 400 + Math.random() * 200,
      y: 300 + Math.random() * 200,
      scale: 1,
      rotation: Math.random() * 30 - 15,
      zIndex: board.canvas_data.stickers.length + 1,
    };

    const newCanvasData = {
      stickers: [...board.canvas_data.stickers, newSticker],
    };

    handleCanvasUpdate(newCanvasData);
  }, [board, handleCanvasUpdate]);

  // Format save time
  const formatSaveTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full" />
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{error || 'board not found'}</h2>
          <Link href="/sticker-board" className="text-blue-500 hover:text-blue-600 transition-colors">
            back to boards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3 flex items-center justify-between z-30 relative">
        <div className="flex items-center gap-4">
          <Link
            href="/sticker-board"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <h1 className="font-semibold text-foreground">{board.name}</h1>
            <p className="text-xs text-gray-500">
              {board.canvas_data.stickers.length} sticker{board.canvas_data.stickers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Save status */}
          <div className="text-sm text-gray-500">
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin w-3 h-3 border border-gray-400 border-t-gray-600 rounded-full" />
                saving...
              </span>
            ) : lastSaved ? (
              <span>saved {formatSaveTime(lastSaved)}</span>
            ) : hasChanges ? (
              <span className="text-orange-500">unsaved changes</span>
            ) : (
              <span>all changes saved</span>
            )}
          </div>

          {/* Manual save button */}
          <button
            onClick={() => saveBoard(board.canvas_data)}
            disabled={saving || !hasChanges}
            className="px-3 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            save
          </button>
        </div>
      </header>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden">
        <StickerLibrary isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <motion.div
          className="absolute inset-0"
          animate={{ marginLeft: sidebarOpen ? 288 : 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <Canvas
            canvasData={board.canvas_data}
            onUpdate={handleCanvasUpdate}
            onAddSticker={handleAddSticker}
          />
        </motion.div>
      </div>
    </div>
  );
}
