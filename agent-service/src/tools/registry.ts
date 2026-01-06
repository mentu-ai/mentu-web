import type Anthropic from '@anthropic-ai/sdk';
import { mentuCapture, mentuStatus, mentuList } from './mentu-tools.js';

export interface ToolResult {
  output: string;
  is_error?: boolean;
}

type ToolHandler = (input: Record<string, unknown>) => Promise<ToolResult>;

const toolHandlers: Map<string, ToolHandler> = new Map();

// Register built-in tools
toolHandlers.set('mentu_capture', mentuCapture);
toolHandlers.set('mentu_status', mentuStatus);
toolHandlers.set('mentu_list', mentuList);

export function getTools(): Anthropic.Tool[] {
  return [
    {
      name: 'mentu_capture',
      description: 'Create a Mentu memory/observation. Use this to record important findings, progress, or evidence.',
      input_schema: {
        type: 'object' as const,
        properties: {
          body: {
            type: 'string',
            description: 'The content of the memory to capture',
          },
          kind: {
            type: 'string',
            description: 'Type of observation (e.g., evidence, progress, bug_report)',
            default: 'observation',
          },
        },
        required: ['body'],
      },
    },
    {
      name: 'mentu_status',
      description: 'Get the status of commitments in the workspace',
      input_schema: {
        type: 'object' as const,
        properties: {
          commitment_id: {
            type: 'string',
            description: 'Optional specific commitment ID to check',
          },
        },
      },
    },
    {
      name: 'mentu_list',
      description: 'List commitments or memories',
      input_schema: {
        type: 'object' as const,
        properties: {
          type: {
            type: 'string',
            enum: ['commitments', 'memories'],
            description: 'What to list',
          },
          state: {
            type: 'string',
            description: 'Filter by state (for commitments: open, claimed, in_review, closed)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of items to return',
            default: 10,
          },
        },
        required: ['type'],
      },
    },
  ];
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<ToolResult> {
  const handler = toolHandlers.get(name);

  if (!handler) {
    return {
      output: `Unknown tool: ${name}`,
      is_error: true,
    };
  }

  try {
    return await handler(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      output: `Tool execution failed: ${message}`,
      is_error: true,
    };
  }
}
