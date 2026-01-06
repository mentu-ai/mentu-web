import Anthropic from '@anthropic-ai/sdk';
import { getTools } from '../tools/registry.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = 'claude-sonnet-4-20250514';

export async function createMessageStream(
  conversationHistory: Anthropic.MessageParam[]
) {
  const tools = getTools();

  return anthropic.messages.stream({
    model: MODEL,
    max_tokens: 8192,
    system: `You are a helpful AI assistant integrated into the Mentu dashboard. You help users with:
- Understanding their commitments and memories
- Managing their workspace
- Answering questions about the Mentu system
- General coding and productivity assistance

You have access to tools that can interact with the Mentu CLI and workspace files.
Be concise but helpful. When using tools, explain what you're doing.`,
    messages: conversationHistory,
    tools: tools.length > 0 ? tools : undefined,
  });
}

export { anthropic };
