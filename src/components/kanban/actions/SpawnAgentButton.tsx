'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Commitment, BridgeCommand } from '@/lib/mentu/types';
import { Play, Loader2, Square } from 'lucide-react';

interface SpawnAgentButtonProps {
  commitment: Commitment;
  workspaceId: string;
  activeBridgeCommand?: BridgeCommand;
}

export function SpawnAgentButton({
  commitment,
  workspaceId,
  activeBridgeCommand,
}: SpawnAgentButtonProps) {
  const [isSpawning, setIsSpawning] = useState(false);

  // Only show for open or claimed (without active command) commitments
  const canSpawn =
    commitment.state === 'open' ||
    (commitment.state === 'claimed' && !activeBridgeCommand) ||
    commitment.state === 'reopened';

  // Show stop button if there's an active command
  const isRunning = activeBridgeCommand?.status === 'running';
  const isPending = activeBridgeCommand?.status === 'pending';

  if (!canSpawn && !isRunning && !isPending) {
    return null;
  }

  const handleSpawn = async () => {
    setIsSpawning(true);
    try {
      // Call the spawn endpoint via mentu-proxy
      const response = await fetch('/api/bridge/spawn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          commitment_id: commitment.id,
          prompt: commitment.body,
          with_worktree: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to spawn agent');
      }

      // Success - the realtime subscription will update the UI
    } catch (error) {
      console.error('Spawn error:', error);
    } finally {
      setIsSpawning(false);
    }
  };

  const handleStop = async () => {
    if (!activeBridgeCommand) return;

    try {
      const response = await fetch('/api/bridge/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command_id: activeBridgeCommand.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to stop agent');
      }
    } catch (error) {
      console.error('Stop error:', error);
    }
  };

  if (isRunning || isPending) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={handleStop}
        className="gap-1"
      >
        <Square className="h-3 w-3" />
        Stop Agent
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleSpawn}
      disabled={isSpawning}
      className="gap-1"
    >
      {isSpawning ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Spawning...
        </>
      ) : (
        <>
          <Play className="h-3 w-3" />
          Spawn Agent
        </>
      )}
    </Button>
  );
}
