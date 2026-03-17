'use client';

import { useDroppable } from '@dnd-kit/core';
import type { DayStamp } from '@/types/calendar';
import { formatDateKey } from '@/types/calendar';

interface DroppableDayProps {
  date: Date;
  dayStamps: DayStamp[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onDayClick: (date: Date) => void;
}

const MAX_VISIBLE = 3;

export default function DroppableDay({
  date,
  dayStamps,
  isCurrentMonth,
  isToday,
  onDayClick,
}: DroppableDayProps) {
  const dateKey = formatDateKey(date);

  const { isOver, setNodeRef } = useDroppable({
    id: `day-${dateKey}`,
    data: { type: 'day', date: dateKey },
  });

  const visibleStamps = dayStamps.slice(0, MAX_VISIBLE);
  const overflowCount = dayStamps.length - MAX_VISIBLE;

  return (
    <div
      ref={setNodeRef}
      onClick={() => onDayClick(date)}
      className={`
        group border-b border-r border-border/50 p-1 h-[100px] overflow-hidden
        cursor-pointer transition-all
        ${!isCurrentMonth ? 'bg-muted/30' : 'bg-card'}
        ${isToday ? 'bg-candy-sky/10' : ''}
        ${isOver ? 'ring-2 ring-primary ring-inset bg-primary/5' : ''}
        hover:bg-muted/40
      `}
    >
      <div className="flex items-start justify-between mb-0.5">
        <span
          className={`
            inline-flex items-center justify-center w-6 h-6 text-xs font-body rounded-full
            ${isToday
              ? 'bg-primary text-white font-bold'
              : !isCurrentMonth
                ? 'text-muted-foreground/50'
                : 'text-foreground/70'
            }
          `}
        >
          {date.getDate()}
        </span>
      </div>

      <div className="flex flex-wrap gap-0.5">
        {visibleStamps.map((ds) => (
          <span
            key={ds.id}
            className="inline-flex items-center gap-0.5 px-1 py-0 rounded-full text-[9px] leading-tight font-body font-semibold truncate max-w-full"
            style={{
              backgroundColor: `${ds.stamp.color}20`,
              borderColor: `${ds.stamp.color}40`,
              border: '1px solid',
            }}
            title={ds.stamp.name}
          >
            <span className="text-[10px]">{ds.stamp.emoji}</span>
            <span className="text-foreground/60 truncate hidden sm:inline">{ds.stamp.name}</span>
          </span>
        ))}
        {overflowCount > 0 && (
          <span className="text-[9px] text-muted-foreground font-body px-1">
            +{overflowCount}
          </span>
        )}
      </div>
    </div>
  );
}
