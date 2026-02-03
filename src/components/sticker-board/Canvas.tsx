'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import DraggableSticker from './DraggableSticker';
import type { StickerData, CanvasData } from '@/types/database';

interface CanvasProps {
  canvasData: CanvasData;
  onUpdate: (data: CanvasData) => void;
  onAddSticker: (src: string) => void;
}

export default function Canvas({ canvasData, onUpdate, onAddSticker }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.min(Math.max(z * delta, 0.25), 4));
    }
  }, []);

  // Handle pan start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    } else if (e.target === containerRef.current || e.target === e.currentTarget) {
      setSelectedId(null);
    }
  }, []);

  // Handle pan move
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isPanning]
  );

  // Handle pan end
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Global mouse listeners for panning
  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // Update a single sticker
  const handleStickerUpdate = useCallback(
    (id: string, updates: Partial<StickerData>) => {
      const newStickers = canvasData.stickers.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      );
      onUpdate({ stickers: newStickers });
    },
    [canvasData.stickers, onUpdate]
  );

  // Delete a sticker
  const handleStickerDelete = useCallback(
    (id: string) => {
      const newStickers = canvasData.stickers.filter((s) => s.id !== id);
      onUpdate({ stickers: newStickers });
      setSelectedId(null);
    },
    [canvasData.stickers, onUpdate]
  );

  // Handle drop from sticker library
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const src = e.dataTransfer.getData('sticker-src');
      if (src && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x) / zoom - 50;
        const y = (e.clientY - rect.top - pan.y) / zoom - 50;

        const newSticker: StickerData = {
          id: crypto.randomUUID(),
          src,
          x,
          y,
          scale: 1,
          rotation: 0,
          zIndex: canvasData.stickers.length + 1,
        };

        onUpdate({ stickers: [...canvasData.stickers, newSticker] });
      }
    },
    [canvasData.stickers, onUpdate, pan, zoom]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden bg-gray-50">
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.2, 4))}
          className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z * 0.8, 0.25))}
          className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" />
          </svg>
        </button>
        <button
          onClick={resetView}
          className="px-3 h-8 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors text-sm"
        >
          {Math.round(zoom * 100)}%
        </button>
      </div>

      {/* Help text */}
      <div className="absolute bottom-4 left-4 z-10 text-xs text-gray-400">
        scroll to zoom, alt+drag to pan
      </div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{
          cursor: isPanning ? 'grabbing' : 'default',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Transformed canvas */}
        <div
          className="absolute origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: '4000px',
            height: '4000px',
          }}
        >
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Stickers */}
          {canvasData.stickers.map((sticker) => (
            <DraggableSticker
              key={sticker.id}
              sticker={sticker}
              isSelected={selectedId === sticker.id}
              onSelect={() => setSelectedId(sticker.id)}
              onUpdate={(updates) => handleStickerUpdate(sticker.id, updates)}
              onDelete={() => handleStickerDelete(sticker.id)}
              containerRef={containerRef}
              zoom={zoom}
            />
          ))}
        </div>
      </div>

      {/* Empty state */}
      {canvasData.stickers.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="text-center text-gray-400">
            <p className="text-lg font-medium mb-2">your board is empty</p>
            <p className="text-sm">drag stickers from the sidebar to get started</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
