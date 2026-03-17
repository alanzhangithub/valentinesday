'use client';

import { useState } from 'react';
import type { Stamp } from '@/types/calendar';
import DraggableStamp from './DraggableStamp';

interface StampTrayProps {
  stamps: Stamp[];
  onCreateStamp: () => void;
  onDeleteStamp: (stampId: string) => void;
}

export default function StampTray({ stamps, onCreateStamp, onDeleteStamp }: StampTrayProps) {
  const [editMode, setEditMode] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = (stamp: Stamp) => {
    if (confirmId === stamp.id) {
      onDeleteStamp(stamp.id);
      setConfirmId(null);
    } else {
      setConfirmId(stamp.id);
    }
  };

  return (
    <div className="border-t-2 border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <span className="text-xs text-muted-foreground font-body font-semibold shrink-0 mr-1">stamps:</span>

        {stamps.map((stamp) => (
          <div key={stamp.id} className="relative shrink-0">
            {editMode ? (
              <div className="inline-flex items-center gap-1">
                <div
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border"
                  style={{
                    backgroundColor: `${stamp.color}18`,
                    borderColor: `${stamp.color}40`,
                  }}
                >
                  <span>{stamp.emoji}</span>
                  <span className="font-body font-semibold text-foreground/70">{stamp.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(stamp)}
                  className={`shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                    confirmId === stamp.id
                      ? 'bg-red-500 text-white'
                      : 'bg-red-100 text-red-500 hover:bg-red-200'
                  }`}
                  title={confirmId === stamp.id ? 'click again to confirm' : `delete ${stamp.name}`}
                >
                  ×
                </button>
              </div>
            ) : (
              <DraggableStamp stamp={stamp} />
            )}
          </div>
        ))}

        {!editMode && (
          <button
            onClick={onCreateStamp}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-body font-semibold rounded-full border-2 border-dashed border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            new
          </button>
        )}

        <button
          onClick={() => { setEditMode(!editMode); setConfirmId(null); }}
          className={`shrink-0 ml-auto px-2.5 py-1 text-xs font-body font-semibold rounded-full border-2 transition-colors ${
            editMode
              ? 'border-primary text-primary bg-primary/10'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
          }`}
        >
          {editMode ? 'done' : 'edit'}
        </button>
      </div>
    </div>
  );
}
