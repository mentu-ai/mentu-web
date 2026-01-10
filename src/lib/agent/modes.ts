/**
 * Agent mode configurations for Agent Chat
 *
 * Defines tool availability and behavior for each mode:
 * - architect: Plan mode (read-only, creates commitments)
 * - executor: Execute mode (requires claimed commitment)
 * - auditor: Review mode (runs tests, approves/rejects)
 */

export type AgentMode = 'architect' | 'executor' | 'auditor';

export interface ModeConfig {
  mode: AgentMode;
  label: string;
  description: string;
  allowed_tools: string[];
  denied_tools: string[];
  system_prompt_addition: string;
  requires_commitment: boolean;
  icon: string;
  color: string;
}

/**
 * Mode configurations
 */
export const MODES: Record<AgentMode, ModeConfig> = {
  architect: {
    mode: 'architect',
    label: 'Architect',
    description: 'Plan and design without executing',
    allowed_tools: ['Read', 'mentu_commit', 'mentu_capture', 'Task', 'Glob', 'Grep'],
    denied_tools: ['Write', 'Edit', 'Bash'],
    system_prompt_addition: `
You are operating in ARCHITECT MODE.
Your role is strategic planning and intent articulation.
You can observe the codebase, articulate what should exist, and create commitments.
You CANNOT write files, edit code, or execute commands directly.
Create commitments for Executors to implement your plans.
`,
    requires_commitment: false,
    icon: 'compass',
    color: 'blue',
  },

  executor: {
    mode: 'executor',
    label: 'Executor',
    description: 'Implement within commitment scope',
    allowed_tools: [
      'Read',
      'Write',
      'Edit',
      'Bash',
      'mentu_capture',
      'Glob',
      'Grep',
      'Task',
    ],
    denied_tools: [],
    system_prompt_addition: `
You are operating in EXECUTOR MODE.
Your role is implementation within the scope of your claimed commitment.
Stay focused on the commitment. Capture evidence of your work.
Do not expand scope beyond what was committed.
`,
    requires_commitment: true,
    icon: 'hammer',
    color: 'green',
  },

  auditor: {
    mode: 'auditor',
    label: 'Auditor',
    description: 'Review and validate work',
    allowed_tools: [
      'Read',
      'Bash',
      'mentu_approve',
      'mentu_reject',
      'mentu_capture',
      'Glob',
      'Grep',
    ],
    denied_tools: ['Write', 'Edit'],
    system_prompt_addition: `
You are operating in AUDITOR MODE.
Your role is review and validation.
You can read code, run tests, and render verdicts.
You CANNOT modify code directly.
Approve good work. Reject or request changes for problems.
`,
    requires_commitment: false,
    icon: 'shield-check',
    color: 'purple',
  },
};

/**
 * Get mode configuration by mode
 */
export function getModeConfig(mode: AgentMode): ModeConfig {
  return MODES[mode];
}

/**
 * Handle mode switch command
 *
 * @param command - The command string (e.g., "/architect")
 * @returns The mode config if valid command, null otherwise
 */
export function handleModeSwitch(command: string): ModeConfig | null {
  const normalized = command.toLowerCase().trim();
  if (normalized === '/architect') return MODES.architect;
  if (normalized === '/executor') return MODES.executor;
  if (normalized === '/auditor') return MODES.auditor;
  return null;
}

/**
 * Check if a tool is allowed in the given mode
 *
 * @param mode - The agent mode
 * @param tool - The tool name
 * @returns true if the tool is allowed
 */
export function isToolAllowed(mode: AgentMode, tool: string): boolean {
  const config = MODES[mode];

  // If explicitly denied, not allowed
  if (config.denied_tools.includes(tool)) return false;

  // If no allowed_tools specified, allow all (except denied)
  if (config.allowed_tools.length === 0) return true;

  // Check if tool matches any allowed pattern
  return config.allowed_tools.some((t) => tool.startsWith(t));
}

/**
 * Get all available modes
 */
export function getAllModes(): ModeConfig[] {
  return Object.values(MODES);
}

/**
 * Validate if mode switch is valid given current state
 *
 * @param targetMode - Mode to switch to
 * @param hasCommitment - Whether user has a claimed commitment
 * @returns Object with valid flag and optional error message
 */
export function validateModeSwitch(
  targetMode: AgentMode,
  hasCommitment: boolean
): { valid: boolean; error?: string } {
  const config = MODES[targetMode];

  if (config.requires_commitment && !hasCommitment) {
    return {
      valid: false,
      error: `${config.label} mode requires a claimed commitment. Claim a commitment first.`,
    };
  }

  return { valid: true };
}

/**
 * Build system prompt with mode-specific additions
 *
 * @param basePrompt - The base system prompt
 * @param mode - The current agent mode
 * @returns Enhanced system prompt
 */
export function buildModePrompt(basePrompt: string, mode: AgentMode): string {
  const config = MODES[mode];
  return `${basePrompt}\n\n${config.system_prompt_addition}`;
}
