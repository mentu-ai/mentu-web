/**
 * Denial Resilience Prompt Module
 *
 * Provides prompts and utilities for making agents resilient to permission denials.
 * When an operation is denied by genesis enforcement, agents should try alternatives
 * instead of failing immediately.
 */

/**
 * System prompt addition for denial resilience
 */
export const RESILIENCE_PROMPT = `
## On Permission Denials

When a tool or operation is denied by genesis enforcement:

1. **Note the reason** - The denial message explains why. Read it carefully.

2. **Consider alternatives** - Think about other ways to accomplish the goal:
   - Different command that achieves same result
   - Decompose into smaller steps that are allowed
   - Use a different tool that has permission

3. **Try the alternative** - If you identified a valid alternative, try it.

4. **Request clarification** - If no alternative exists:
   - Explain what you're trying to accomplish
   - Explain why the denied approach seemed necessary
   - Ask the human how they'd like to proceed

5. **Never just fail** - A denial is feedback, not a dead end.

Example:
- Denied: "git push" (Executors can't push directly)
- Alternative: Create a PR for human review
- Or: Ask human to push after reviewing changes
`;

/**
 * Structured denial feedback
 */
export interface DenialFeedback {
  /** The tool that was denied */
  tool: string;
  /** Reason for denial */
  reason: string;
  /** Suggested alternatives */
  suggestions: string[];
  /** Whether a retry might succeed */
  can_retry: boolean;
}

/**
 * Known alternatives for common denied operations
 */
const KNOWN_ALTERNATIVES: Record<string, string[]> = {
  'git push': [
    'Create a PR using `gh pr create`',
    'Ask the human to push after reviewing',
    'Use `git format-patch` to share changes',
  ],
  Write: [
    'Ask the human to create the file',
    'Use `mentu capture` to record what should be written',
    'Describe the changes in detail for manual application',
  ],
  Edit: [
    'Ask the human to make the edit',
    'Use `mentu annotate` to describe needed changes',
    'Provide a diff that can be manually applied',
  ],
  Bash: [
    'Use a more specific, allowed command',
    'Ask the human to run the command',
    'Break down into smaller allowed operations',
  ],
  rm: [
    'Ask the human to delete the file',
    'Mark the file for deletion in a commit message',
    'Use `mentu annotate` to flag for cleanup',
  ],
  'rm -rf': [
    'This operation is intentionally restricted',
    'Ask the human to perform the deletion manually',
    'Explain what needs to be removed and why',
  ],
  chmod: [
    'Ask the human to change permissions',
    'Document the required permissions for later',
  ],
  sudo: [
    'This operation requires elevated privileges',
    'Ask the human to run with appropriate permissions',
    'Explain what you\'re trying to accomplish',
  ],
};

/**
 * Default alternatives when no specific match found
 */
const DEFAULT_ALTERNATIVES: string[] = [
  'Ask the human for guidance',
  "Try a different approach that stays within permissions",
  "Use `mentu capture` to record what you're trying to accomplish",
];

/**
 * Generate alternatives for a denied tool
 *
 * @param tool - The denied tool name
 * @param reason - Denial reason from enforcement
 * @returns Structured denial feedback with suggestions
 */
export function generateDenialAlternatives(
  tool: string,
  reason: string
): DenialFeedback {
  // Find matching alternatives
  const matchingKey = Object.keys(KNOWN_ALTERNATIVES).find(
    (key) => tool.includes(key) || key.includes(tool)
  );

  const suggestions = matchingKey
    ? KNOWN_ALTERNATIVES[matchingKey]
    : DEFAULT_ALTERNATIVES;

  return {
    tool,
    reason,
    suggestions,
    can_retry: false,
  };
}

/**
 * Inject resilience prompt into system prompt
 *
 * @param systemPrompt - Base system prompt
 * @returns Enhanced system prompt with resilience guidance
 */
export function injectResiliencePrompt(systemPrompt: string): string {
  if (systemPrompt.includes('On Permission Denials')) {
    return systemPrompt; // Already includes resilience prompt
  }

  return `${systemPrompt}\n\n${RESILIENCE_PROMPT}`;
}

/**
 * Format denial feedback for display
 *
 * @param feedback - The denial feedback to format
 * @returns Formatted string for display
 */
export function formatDenialFeedback(feedback: DenialFeedback): string {
  const lines = [
    `## Permission Denied`,
    ``,
    `**Tool:** ${feedback.tool}`,
    `**Reason:** ${feedback.reason}`,
    ``,
    `### Suggested Alternatives:`,
    ...feedback.suggestions.map((s, i) => `${i + 1}. ${s}`),
    ``,
    feedback.can_retry
      ? '> This operation might succeed if you try again.'
      : "> Consider one of the alternatives above, or ask for human guidance.",
  ];

  return lines.join('\n');
}

/**
 * Check if a denial reason indicates a temporary issue
 *
 * @param reason - The denial reason
 * @returns true if the issue might be temporary
 */
export function isTemporaryDenial(reason: string): boolean {
  const temporaryPatterns = [
    /rate limit/i,
    /timeout/i,
    /temporary/i,
    /try again/i,
    /busy/i,
    /unavailable/i,
  ];

  return temporaryPatterns.some((pattern) => pattern.test(reason));
}

/**
 * Build denial response for agent
 *
 * @param tool - Denied tool
 * @param reason - Denial reason
 * @returns Formatted response for agent
 */
export function buildDenialResponse(tool: string, reason: string): string {
  const feedback = generateDenialAlternatives(tool, reason);
  const isTemporary = isTemporaryDenial(reason);

  if (isTemporary) {
    feedback.can_retry = true;
    feedback.suggestions.unshift('Wait a moment and try again');
  }

  return formatDenialFeedback(feedback);
}
