'use client';

import type { Stamp } from '@/types/calendar';

interface StampPillProps {
  stamp: Stamp;
  size?: 'sm' | 'md';
  onClick?: () => void;
  onRemove?: () => void;
}

export default function StampPill({ stamp, size = 'md', onClick, onRemove }: StampPillProps) {
  const isSmall = size === 'sm';

  return (
    <div
      onClick={onClick}
      className={`
        group/pill inline-flex items-center gap-1 rounded-full border transition-colors
        ${isSmall ? 'px-1.5 py-0 text-[10px]' : 'px-2.5 py-1 text-xs'}
        ${onClick ? 'cursor-pointer hover:brightness-95' : ''}
      `}
      style={{
        backgroundColor: `${stamp.color}18`,
        borderColor: `${stamp.color}40`,
      }}
    >
      <span className={isSmall ? 'text-[10px]' : 'text-sm'}>{stamp.emoji}</span>
      <span className="font-medium text-gray-700 truncate max-w-[80px]">{stamp.name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover/pill:opacity-100 ml-0.5 rounded-full hover:bg-black/10 transition-opacity"
          aria-label={`Remove ${stamp.name}`}
        >
          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
