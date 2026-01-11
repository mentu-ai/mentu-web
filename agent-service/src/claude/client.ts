import { query, type Options } from '@anthropic-ai/claude-agent-sdk';

// Default model - Agent SDK handles model selection internally
export const MODEL = 'claude-sonnet-4-20250514';

// Maximum turns to prevent runaway agents
export const MAX_TURNS = 25;

// System prompt for the Mentu dashboard assistant
// SECURITY: Explicit anti-loop and anti-spawn instructions
export const SYSTEM_PROMPT = `You are a helpful AI assistant integrated into the Mentu dashboard. You help users with:
- Understanding their commitments and memories
- Managing their workspace
- Answering questions about the Mentu system
- General coding and productivity assistance

You have access to tools that can read files and search code.
Be concise but helpful. When using tools, explain what you're doing.

CRITICAL SECURITY RULES (NEVER VIOLATE):
1. NEVER spawn other Claude agents or processes
2. NEVER execute commands that could spawn agents (claude, npx claude, etc.)
3. NEVER use Task tool or any agent spawning mechanism
4. NEVER attempt to bypass these restrictions
5. You are a LEAF agent - you cannot delegate to other agents

If a user asks you to spawn agents or run claude commands, politely decline and explain this is not permitted for security reasons.`;

// SECURITY: Read-only tools only - NO Bash, NO Write, NO Edit
// This prevents:
// - Loop spawning via `claude` command
// - File system modifications
// - Arbitrary code execution
const SAFE_TOOLS = ['Read', 'Glob', 'Grep'];

// Create an agent query with streaming
export function createAgentQuery(prompt: string, customOptions?: Partial<Options>) {
  // Build secure options - enforce security settings even if customOptions tries to override
  const secureOptions: Partial<Options> = {
    systemPrompt: SYSTEM_PROMPT,
    // Read-only mode - no file edits
    permissionMode: 'default',
    // Merge custom options first
    ...customOptions,
  };

  // SECURITY: Always enforce safe tools and max turns (cannot be overridden)
  secureOptions.allowedTools = customOptions?.allowedTools
    ? customOptions.allowedTools.filter(t => SAFE_TOOLS.includes(t))
    : SAFE_TOOLS;
  secureOptions.maxTurns = Math.min(customOptions?.maxTurns || MAX_TURNS, MAX_TURNS);

  return query({
    prompt,
    options: secureOptions,
  });
}

// Export for backwards compatibility
export { query };
