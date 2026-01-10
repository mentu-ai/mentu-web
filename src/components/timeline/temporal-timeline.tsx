'use client';

import React, { useState, useMemo } from 'react';
import { format, addDays, startOfDay, differenceInMinutes, eachDayOfInterval } from 'date-fns';
import type { Commitment } from '@/lib/mentu/types';
import { cn } from '@/lib/utils';

interface TemporalTimelineProps {
  commitments: Commitment[];
  className?: string;
}

type ZoomLevel = 'day' | 'week' | 'month';

export function TemporalTimeline({ commitments, className }: TemporalTimelineProps) {
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const [startDate, setStartDate] = useState(() => startOfDay(new Date()));

  const endDate = useMemo(() => {
    switch (zoom) {
      case 'day': return addDays(startDate, 1);
      case 'week': return addDays(startDate, 7);
      case 'month': return addDays(startDate, 30);
    }
  }, [zoom, startDate]);

  // Filter commitments that have scheduled times within range
  const visibleCommitments = useMemo(() => {
    return commitments.filter(c => {
      if (!c.scheduled_start_at) return false;
      const start = new Date(c.scheduled_start_at);
      return start >= startDate && start <= endDate;
    });
  }, [commitments, startDate, endDate]);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const hourWidth = zoom === 'day' ? 60 : zoom === 'week' ? 12 : 4;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setStartDate(d => addDays(d, zoom === 'day' ? -1 : zoom === 'week' ? -7 : -30))}
          className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm"
        >
          Prev
        </button>
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as const).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={cn(
                'px-3 py-1 rounded text-sm',
                zoom === z ? 'bg-blue-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600'
              )}
            >
              {z.charAt(0).toUpperCase() + z.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setStartDate(startOfDay(new Date()))}
          className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm"
        >
          Today
        </button>
        <button
          onClick={() => setStartDate(d => addDays(d, zoom === 'day' ? 1 : zoom === 'week' ? 7 : 30))}
          className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm"
        >
          Next
        </button>
      </div>

      {/* Timeline */}
      <div className="relative overflow-x-auto border border-zinc-700 rounded-lg">
        {/* Day headers */}
        <div className="flex border-b border-zinc-700 bg-zinc-800">
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="flex-shrink-0 px-2 py-2 text-sm text-zinc-400 border-r border-zinc-700"
              style={{ width: hourWidth * 24 }}
            >
              {format(day, zoom === 'day' ? 'EEEE, MMM d' : 'EEE d')}
            </div>
          ))}
        </div>

        {/* Hour grid */}
        {zoom === 'day' && (
          <div className="flex border-b border-zinc-800">
            {Array.from({ length: 24 }).map((_, hour) => (
              <div
                key={hour}
                className="flex-shrink-0 text-xs text-zinc-500 border-r border-zinc-800 text-center"
                style={{ width: hourWidth }}
              >
                {hour.toString().padStart(2, '0')}
              </div>
            ))}
          </div>
        )}

        {/* Commitment blocks */}
        <div className="relative min-h-[200px] bg-zinc-900">
          {/* Current time indicator */}
          <CurrentTimeIndicator startDate={startDate} hourWidth={hourWidth} />

          {visibleCommitments.map((commitment, idx) => (
            <CommitmentBlock
              key={commitment.id}
              commitment={commitment}
              startDate={startDate}
              hourWidth={hourWidth}
              row={idx}
            />
          ))}

          {visibleCommitments.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
              No scheduled commitments in this period
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded" />
          <span>Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-zinc-500 rounded opacity-50" />
          <span>Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-600 rounded" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}

function CurrentTimeIndicator({
  startDate,
  hourWidth,
}: {
  startDate: Date;
  hourWidth: number;
}) {
  const now = new Date();
  const offsetMinutes = differenceInMinutes(now, startDate);
  const left = (offsetMinutes / 60) * hourWidth;

  // Only show if within visible range
  if (left < 0 || left > hourWidth * 24 * 7) return null;

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
      style={{ left }}
    >
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
    </div>
  );
}

function CommitmentBlock({
  commitment,
  startDate,
  hourWidth,
  row,
}: {
  commitment: Commitment;
  startDate: Date;
  hourWidth: number;
  row: number;
}) {
  const scheduledStart = new Date(commitment.scheduled_start_at!);
  const duration = commitment.duration_estimate || 60;

  const offsetMinutes = differenceInMinutes(scheduledStart, startDate);
  const left = (offsetMinutes / 60) * hourWidth;
  const width = (duration / 60) * hourWidth;

  const hasActual = commitment.actual_start_at;
  const actualStart = hasActual ? new Date(commitment.actual_start_at!) : null;
  const actualEnd = commitment.actual_end_at ? new Date(commitment.actual_end_at) : null;

  // Calculate actual block position if exists
  let actualLeft = 0;
  let actualWidth = width;
  if (actualStart) {
    actualLeft = ((differenceInMinutes(actualStart, scheduledStart)) / 60) * hourWidth;
    if (actualEnd) {
      actualWidth = ((differenceInMinutes(actualEnd, actualStart)) / 60) * hourWidth;
    }
  }

  // Determine color based on state
  const getBlockColor = () => {
    switch (commitment.state) {
      case 'closed':
        return 'bg-green-600';
      case 'claimed':
        return 'bg-yellow-600';
      case 'in_review':
        return 'bg-purple-600';
      default:
        return 'bg-blue-600';
    }
  };

  return (
    <div
      className="absolute"
      style={{ left: Math.max(left, 0), top: 8 + row * 44, width: Math.max(width, 24) }}
    >
      {/* Actual execution background (shows variance) */}
      {hasActual && (
        <div
          className="absolute h-8 bg-zinc-500 rounded opacity-40"
          style={{
            left: actualLeft,
            width: Math.max(actualWidth, 24),
            top: 0,
          }}
          title={`Actual: ${format(actualStart!, 'HH:mm')}${actualEnd ? ` - ${format(actualEnd, 'HH:mm')}` : ''}`}
        />
      )}

      {/* Planned block (foreground) */}
      <div
        className={cn(
          'h-8 rounded px-2 py-1 text-xs truncate cursor-pointer shadow-sm',
          'border border-zinc-600/50',
          getBlockColor()
        )}
        title={`${commitment.body}\n\nScheduled: ${format(scheduledStart, 'HH:mm')}\nDuration: ${duration}min`}
      >
        <span className="font-medium">{commitment.body.slice(0, 40)}</span>
        {commitment.template_id && (
          <span className="ml-1 opacity-60">[recurring]</span>
        )}
      </div>
    </div>
  );
}
