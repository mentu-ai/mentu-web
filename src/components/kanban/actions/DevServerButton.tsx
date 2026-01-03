'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Commitment } from '@/lib/mentu/types';
import { Server, ExternalLink, Square, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DevServerButtonProps {
  commitment: Commitment;
  workspaceId: string;
  hasWorktree?: boolean;
}

export function DevServerButton({
  commitment,
  workspaceId,
  hasWorktree,
}: DevServerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Only show for commitments with worktrees
  if (!hasWorktree) {
    return null;
  }

  const handleStart = async () => {
    setIsStarting(true);
    setLogs([]);

    try {
      const response = await fetch('/api/bridge/dev-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          commitment_id: commitment.id,
          action: 'start',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start dev server');
      }

      const data = await response.json();
      setIsRunning(true);
      setServerUrl(data.url || 'http://localhost:3000');
      setLogs(['Dev server starting...', `URL: ${data.url || 'http://localhost:3000'}`]);
    } catch (error) {
      console.error('Start dev server error:', error);
      setLogs([`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);

    try {
      const response = await fetch('/api/bridge/dev-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          commitment_id: commitment.id,
          action: 'stop',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to stop dev server');
      }

      setIsRunning(false);
      setServerUrl(null);
      setLogs([]);
      setIsOpen(false);
    } catch (error) {
      console.error('Stop dev server error:', error);
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1"
      >
        <Server className="h-3 w-3" />
        Dev Server
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Dev Server</DialogTitle>
            <DialogDescription>
              Run a development server in the worktree for {commitment.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Server URL */}
            {serverUrl && isRunning && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <Server className="h-4 w-4 text-green-600" />
                <a
                  href={serverUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-700 dark:text-green-300 hover:underline flex items-center gap-1"
                >
                  {serverUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* Logs */}
            <div className="bg-zinc-950 rounded-lg p-3 min-h-[150px] max-h-[300px] overflow-auto">
              {logs.length === 0 ? (
                <p className="text-zinc-500 text-xs">
                  {isRunning ? 'Waiting for logs...' : 'Click Start to run the dev server'}
                </p>
              ) : (
                <div className="font-mono text-xs text-zinc-300 space-y-0.5">
                  {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              {isRunning ? (
                <Button
                  variant="destructive"
                  onClick={handleStop}
                  disabled={isStopping}
                >
                  {isStopping ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Stopping...
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Dev
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleStart} disabled={isStarting}>
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Server className="h-4 w-4 mr-2" />
                      Start Dev
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
