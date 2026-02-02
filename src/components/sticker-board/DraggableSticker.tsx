'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { StickerData } from '@/types/database';

interface DraggableStickerProps {
  sticker: StickerData;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<StickerData>) => void;
  onDelete: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
}

export default function DraggableSticker({
  sticker,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  containerRef,
  zoom,
}: DraggableStickerProps) {
  const stickerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const initialMousePos = useRef({ x: 0, y: 0 });
  const initialStickerPos = useRef({ x: sticker.x, y: sticker.y });
  const initialScale = useRef(sticker.scale);
  const initialRotation = useRef(sticker.rotation);

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSelected && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        onDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, onDelete]);

  // Mouse move handler for drag/resize/rotate
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const dx = (e.clientX - initialMousePos.current.x) / zoom;
        const dy = (e.clientY - initialMousePos.current.y) / zoom;
        onUpdate({
          x: initialStickerPos.current.x + dx,
          y: initialStickerPos.current.y + dy,
        });
      }

      if (isResizing) {
        const dx = e.clientX - initialMousePos.current.x;
        const dy = e.clientY - initialMousePos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const direction = dx + dy > 0 ? 1 : -1;
        const scaleDelta = (direction * distance) / 200;
        const newScale = Math.max(0.1, Math.min(3, initialScale.current + scaleDelta));
        onUpdate({ scale: newScale });
      }

      if (isRotating && stickerRef.current) {
        const rect = stickerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const degrees = (angle * 180) / Math.PI + 90;
        onUpdate({ rotation: degrees });
      }
    },
    [isDragging, isResizing, isRotating, onUpdate, zoom]
  );

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
  }, []);

  // Add/remove global listeners
  useEffect(() => {
    if (isDragging || isResizing || isRotating) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isRotating, handleMouseMove, handleMouseUp]);

  // Start dragging
  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    initialMousePos.current = { x: e.clientX, y: e.clientY };
    initialStickerPos.current = { x: sticker.x, y: sticker.y };
  };

  // Start resizing
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    initialMousePos.current = { x: e.clientX, y: e.clientY };
    initialScale.current = sticker.scale;
  };

  // Start rotating
  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRotating(true);
    initialRotation.current = sticker.rotation;
  };

  const size = 100 * sticker.scale;

  return (
    <div
      ref={stickerRef}
      className="absolute select-none"
      style={{
        left: sticker.x,
        top: sticker.y,
        zIndex: sticker.zIndex,
        transform: `rotate(${sticker.rotation}deg)`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleDragStart}
    >
      {/* Sticker image */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Image
          src={sticker.src}
          alt="sticker"
          width={size}
          height={size}
          className="pointer-events-none"
          draggable={false}
          style={{ width: size, height: size }}
        />
      </motion.div>

      {/* Selection handles */}
      {isSelected && (
        <>
          {/* Selection border */}
          <div
            className="absolute inset-0 border-2 border-dashed border-blue-500 rounded pointer-events-none"
            style={{ margin: -4 }}
          />

          {/* Resize handle (bottom-right) */}
          <div
            className="absolute -bottom-3 -right-3 w-6 h-6 bg-blue-500 rounded-full cursor-se-resize flex items-center justify-center hover:bg-blue-600 transition-colors"
            onMouseDown={handleResizeStart}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </div>

          {/* Rotate handle (top-right) */}
          <div
            className="absolute -top-3 -right-3 w-6 h-6 bg-green-500 rounded-full cursor-pointer flex items-center justify-center hover:bg-green-600 transition-colors"
            onMouseDown={handleRotateStart}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8V3" />
            </svg>
          </div>

          {/* Delete handle (top-left) */}
          <div
            className="absolute -top-3 -left-3 w-6 h-6 bg-red-500 rounded-full cursor-pointer flex items-center justify-center hover:bg-red-600 transition-colors"
            onMouseDown={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
