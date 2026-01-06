import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolResult } from './registry.js';

const execAsync = promisify(exec);

const MENTU_PATH = '/Users/rashid/Desktop/Workspaces/mentu-ai';

async function runMentuCommand(cmd: string): Promise<ToolResult> {
  try {
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: MENTU_PATH,
      timeout: 30000,
    });

    return {
      output: stdout || stderr || 'Command completed successfully',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      output: `Command failed: ${message}`,
      is_error: true,
    };
  }
}

export async function mentuCapture(input: Record<string, unknown>): Promise<ToolResult> {
  const body = input.body as string;
  const kind = (input.kind as string) || 'observation';

  const cmd = `mentu capture "${body.replace(/"/g, '\\"')}" --kind ${kind}`;
  return runMentuCommand(cmd);
}

export async function mentuStatus(input: Record<string, unknown>): Promise<ToolResult> {
  const commitmentId = input.commitment_id as string | undefined;

  const cmd = commitmentId
    ? `mentu show ${commitmentId}`
    : `mentu status`;

  return runMentuCommand(cmd);
}

export async function mentuList(input: Record<string, unknown>): Promise<ToolResult> {
  const type = input.type as 'commitments' | 'memories';
  const state = input.state as string | undefined;
  const limit = (input.limit as number) || 10;

  let cmd = `mentu list ${type} --limit ${limit}`;
  if (state) {
    cmd += ` --state ${state}`;
  }

  return runMentuCommand(cmd);
}
