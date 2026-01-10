'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CapacitySummary {
  date: string;
  budget_minutes: number;
  used_minutes: number;
  reserved_minutes: number;
  available_minutes: number;
  utilization_percent: number;
}

interface CapacityDashboardProps {
  workspaceId: string;
  resourceType?: string;
}

/**
 * V3.2 Capacity Dashboard
 * Shows daily capacity utilization as a calendar heatmap.
 */
export function CapacityDashboard({
  workspaceId,
  resourceType = 'compute',
}: CapacityDashboardProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [data, setData] = useState<CapacitySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const weekEnd = endOfWeek(weekStart);

  useEffect(() => {
    async function fetchCapacity() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/capacity?workspace_id=${workspaceId}&resource_type=${resourceType}&start_date=${format(weekStart, 'yyyy-MM-dd')}&end_date=${format(weekEnd, 'yyyy-MM-dd')}`
        );

        if (response.ok) {
          const result = await response.json();
          setData(result.summaries || []);
        }
      } catch (error) {
        console.error('Failed to fetch capacity:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCapacity();
  }, [workspaceId, resourceType, weekStart, weekEnd]);

  const prevWeek = () => setWeekStart(addDays(weekStart, -7));
  const nextWeek = () => setWeekStart(addDays(weekStart, 7));

  // Generate days of the week
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getCapacityForDate = (date: Date): CapacitySummary | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return data.find((d) => d.date === dateStr) || null;
  };

  const getUtilizationColor = (percent: number): string => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 75) return 'bg-orange-500';
    if (percent >= 50) return 'bg-yellow-500';
    if (percent >= 25) return 'bg-green-500';
    return 'bg-green-300';
  };

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Capacity ({resourceType})
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </span>
          <Button variant="ghost" size="sm" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-24">
          <div className="text-sm text-zinc-500">Loading...</div>
        </div>
      ) : (
        <TooltipProvider>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const capacity = getCapacityForDate(day);
              const utilization = capacity?.utilization_percent || 0;
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

              return (
                <Tooltip key={day.toISOString()}>
                  <TooltipTrigger asChild>
                    <div
                      className={`
                        relative flex flex-col items-center justify-center
                        h-16 rounded-md cursor-default
                        ${isToday ? 'ring-2 ring-blue-500' : ''}
                        ${capacity ? getUtilizationColor(utilization) : 'bg-zinc-200 dark:bg-zinc-800'}
                      `}
                    >
                      <span className="text-xs font-medium text-white">
                        {format(day, 'EEE')}
                      </span>
                      <span className="text-lg font-bold text-white">
                        {format(day, 'd')}
                      </span>
                      {capacity && (
                        <span className="text-xs text-white/80">
                          {Math.round(utilization)}%
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <div className="font-medium">
                        {format(day, 'EEEE, MMM d')}
                      </div>
                      {capacity ? (
                        <>
                          <div className="text-zinc-400">
                            Budget: {formatMinutes(capacity.budget_minutes)}
                          </div>
                          <div className="text-green-400">
                            Available: {formatMinutes(capacity.available_minutes)}
                          </div>
                          <div className="text-blue-400">
                            Used: {formatMinutes(capacity.used_minutes)}
                          </div>
                          <div className="text-yellow-400">
                            Reserved: {formatMinutes(capacity.reserved_minutes)}
                          </div>
                        </>
                      ) : (
                        <div className="text-zinc-400">No data</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-300" />
          <span>&lt;25%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>25-50%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>50-75%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span>75-90%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>&gt;90%</span>
        </div>
      </div>
    </div>
  );
}
