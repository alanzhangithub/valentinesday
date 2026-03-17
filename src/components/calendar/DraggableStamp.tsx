'use client';

import { useDraggable } from '@dnd-kit/core';
import type { Stamp } from '@/types/calendar';
import StampPill from './StampPill';

interface DraggableStampProps {
  stamp: Stamp;
}

export default function DraggableStamp({ stamp }: DraggableStampProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `stamp-${stamp.id}`,
    data: { type: 'stamp', stamp },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`touch-none select-none ${isDragging ? 'opacity-40' : 'opacity-100'} transition-opacity`}
    >
      <StampPill stamp={stamp} />
    </div>
  );
}
