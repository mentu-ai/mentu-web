'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarClock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AutoScheduleButtonProps {
  commitmentId: string;
  earliestStartAt?: string;
  dueAt?: string;
  durationEstimate?: number;
  executionWindow?: {
    start: string;
    end: string;
    days?: number[];
  };
  onScheduled?: (scheduledAt: string, explanation: string) => void;
  disabled?: boolean;
}

interface PlacementResult {
  success: boolean;
  scheduled_start_at?: string;
  scheduling_explanation: string;
}

/**
 * V3.1 Auto-Schedule Button
 * Triggers the placement algorithm to find the best slot for a commitment.
 */
export function AutoScheduleButton({
  commitmentId,
  earliestStartAt,
  dueAt,
  durationEstimate = 60,
  executionWindow,
  onScheduled,
  disabled = false,
}: AutoScheduleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    explanation: string;
  } | null>(null);

  const handleAutoSchedule = async () => {
    setIsLoading(true);
    setLastResult(null);

    try {
      // Call the placement API via our backend
      const response = await fetch('/api/schedule/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitment_id: commitmentId,
          earliest_start_at: earliestStartAt || new Date().toISOString(),
          due_at: dueAt,
          duration_estimate: durationEstimate,
          execution_window: executionWindow,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result: PlacementResult = await response.json();

      setLastResult({
        success: result.success,
        explanation: result.scheduling_explanation,
      });

      if (!result.success) {
        toast({
          title: 'Could not schedule',
          description: result.scheduling_explanation,
          variant: 'destructive',
        });
        return;
      }

      // Update commitment in database
      const updateResponse = await fetch(`/api/commitments/${commitmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_start_at: result.scheduled_start_at,
          scheduling_mode: 'auto',
          scheduled_by: 'scheduler',
          scheduling_explanation: result.scheduling_explanation,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update commitment');
      }

      toast({
        title: 'Scheduled',
        description: result.scheduling_explanation,
      });

      if (onScheduled && result.scheduled_start_at) {
        onScheduled(result.scheduled_start_at, result.scheduling_explanation);
      }
    } catch (error) {
      toast({
        title: 'Scheduling failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoSchedule}
            disabled={disabled || isLoading}
            className={lastResult ? (lastResult.success ? 'border-green-500' : 'border-orange-500') : ''}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : lastResult?.success ? (
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
            ) : lastResult && !lastResult.success ? (
              <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
            ) : (
              <CalendarClock className="h-4 w-4 mr-2" />
            )}
            Auto-schedule
          </Button>
        </TooltipTrigger>
        {lastResult && (
          <TooltipContent>
            <p className="max-w-xs">{lastResult.explanation}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
