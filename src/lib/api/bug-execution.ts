interface TriggerOptions {
  ticketId: string;
  workspaceId: string;
}

interface TriggerResult {
  commandId: string;
}

export async function triggerBugExecution(options: TriggerOptions): Promise<TriggerResult> {
  const res = await fetch('/api/bridge/spawn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  if (!res.ok) throw new Error(`Failed to trigger execution: ${res.statusText}`);
  return res.json();
}

export async function cancelBugExecution(commandId: string): Promise<void> {
  const res = await fetch('/api/bridge/stop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commandId }),
  });
  if (!res.ok) throw new Error(`Failed to cancel execution: ${res.statusText}`);
}
