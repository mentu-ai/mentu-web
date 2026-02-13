# Security Audit: Conversation History Implementation

**Date:** 2026-01-11
**Auditor:** user:dashboard
**Scope:** agent-service conversation history feature

---

## Executive Summary

✅ **No loop risks detected** - Agent cannot spawn itself
⚠️ **Performance issue** - Database query fetches ALL messages
✅ **Error handling is safe** - Failures degrade gracefully
⚠️ **Token waste potential** - No user message deduplication check

---

## 1. Infinite Loop Risk Analysis

### Risk: Agent Spawning Itself

**Status:** ✅ **SAFE - No loop risk**

**Analysis:**
- Agent service uses `SAFE_TOOLS = ['Read', 'Glob', 'Grep']` (agent-service/src/claude/client.ts:34)
- NO `Bash` tool access → Agent CANNOT execute `claude` command
- NO `Task` tool access → Agent CANNOT spawn sub-agents
- System prompt explicitly forbids spawning (lines 20-25)

**Evidence:**
```typescript
const SAFE_TOOLS = ['Read', 'Glob', 'Grep'];  // Line 34

// SECURITY: Always enforce safe tools and max turns (cannot be overridden)
secureOptions.allowedTools = restOptions?.allowedTools
  ? restOptions.allowedTools.filter(t => SAFE_TOOLS.includes(t))
  : SAFE_TOOLS;  // Lines 68-70
```

**Conclusion:** Agent is a **LEAF agent** - it cannot delegate or spawn. No loop risk.

---

## 2. Token Waste Analysis

### Issue 1: Database Query Inefficiency

**Status:** ⚠️ **PERFORMANCE ISSUE**

**Problem:**
- `getConversationMessages()` fetches ALL messages with `SELECT *` (messages.ts:31-35)
- No LIMIT clause in SQL query
- Truncation happens **in memory** after fetching everything
- For a conversation with 1000 messages, we fetch all 1000, then keep only ~40

**Impact:**
- Wasted database bandwidth
- Slower response times for long conversations
- Higher Supabase read costs

**Current Code:**
```typescript
// agent-service/src/db/messages.ts:31-35
const { data, error } = await supabase
  .from('agent_messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true });  // NO LIMIT!
```

**Recommendation:**
```typescript
// Should add LIMIT to only fetch what we need
const { data, error } = await supabase
  .from('agent_messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true })
  .limit(100);  // Fetch max 100 messages (50 pairs worst case)
```

### Issue 2: No User Message Deduplication

**Status:** ⚠️ **MINOR - Potential duplicate context**

**Problem:**
- User message is saved to DB in websocket handler
- Then history is fetched (which includes that user message)
- Then we send the user message AGAIN in the prompt

**Current Flow:**
```
1. User message saved to agent_messages table
2. getConversationHistory() fetches ALL messages (including the new user message)
3. buildPromptWithHistory() includes the user message in history
4. We ALSO append the current user message to the prompt
```

**Impact:**
- Minor: The user's current message might appear twice in context
- Wasted tokens (small amount)

**Recommendation:**
- Exclude the current message from history, OR
- Don't append it separately if it's already in history

---

## 3. Error Handling Analysis

### Scenario: History Fetch Fails

**Status:** ✅ **SAFE**

**Analysis:**
```typescript
// agent-service/src/db/messages.ts:37-40
if (error) {
  console.error('Failed to get messages:', error);
  return [];  // Returns empty array, doesn't throw
}
```

**Flow:**
1. `getConversationMessages()` fails → returns `[]`
2. `getConversationHistory()` receives `[]` → returns `[]`
3. `buildPromptWithHistory()` receives `[]` → returns just the current message
4. Conversation continues **without history**

**Conclusion:** Graceful degradation. No error propagation. ✅ Safe.

---

## 4. Context Injection Analysis

### Risk: Malicious History Injection

**Status:** ✅ **SAFE**

**Analysis:**
- History is wrapped in `<conversation_history>` tags (history.ts:319-328)
- User messages prefixed with "Human:", assistant with "Assistant:"
- No XML/tag injection risk - content is plain text
- Claude understands these tags as context, not instructions

**Evidence:**
```typescript
contextParts.push('<conversation_history>');
for (const msg of history) {
  const role = msg.role === 'user' ? 'Human' : 'Assistant';
  contextParts.push(`${role}: ${msg.content}`);
}
contextParts.push('</conversation_history>');
```

**Conclusion:** Safe formatting. No injection risk.

---

## 5. Token Usage Estimation

### Current Implementation

**Per message with history:**
- Base system prompt: ~200 tokens
- User message: ~50-500 tokens (variable)
- History (20 pairs, 100k chars): ~25,000 tokens
- **Total input: ~25,500 tokens per message**

**For a 10-message conversation:**
- Message 1: ~500 tokens (no history)
- Messages 2-10: ~25,500 tokens each = 229,500 tokens
- **Total: ~230,000 input tokens**

### With Current Pricing (Sonnet 4)
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens

**Cost for 10-message conversation:**
- Input: 230k tokens × $3/1M = $0.69
- Output (assume 2k per message): 20k × $15/1M = $0.30
- **Total: ~$1 per 10-message conversation**

### Risk Assessment

⚠️ **MODERATE COST** for long conversations

**Mitigations:**
- 20 pair limit prevents runaway context
- 100k char limit caps maximum cost
- Empty history for first message (no waste)

---

## 6. Race Condition Analysis

### Scenario: Concurrent Messages

**Status:** ⚠️ **POTENTIAL ISSUE**

**Problem:**
If user sends two messages rapidly:
1. Message A triggers history fetch (gets messages 1-10)
2. Message B triggers history fetch (gets messages 1-10, possibly 11 if A saved)
3. Both messages process simultaneously

**Impact:**
- Minor: Inconsistent history between concurrent messages
- Could cause confusion if messages reference each other

**Likelihood:** LOW (users typically wait for response)

**Recommendation:** Add in-flight message tracking or conversation locking

---

## Recommendations

### Priority 1: Fix Database Query (Performance)

```typescript
// agent-service/src/db/messages.ts
export async function getConversationMessages(
  conversationId: string,
  limit: number = 100  // Add limit parameter
): Promise<AgentMessage[]> {
  const { data, error } = await supabase
    .from('agent_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })  // DESC to get most recent
    .limit(limit);  // Only fetch what we need

  if (error) {
    console.error('Failed to get messages:', error);
    return [];
  }

  return ((data || []) as AgentMessage[]).reverse();  // Reverse to chronological
}
```

### Priority 2: Add Error Boundary

```typescript
// agent-service/src/claude/streaming.ts
try {
  const history = await getConversationHistory(conversationId, {
    maxPairs: 20,
    maxChars: 100000,
  });
} catch (error) {
  agentLogger.warn('History fetch failed, continuing without context', {
    conversationId,
    error: error instanceof Error ? error.message : String(error),
  });
  history = [];  // Explicit fallback
}
```

### Priority 3: Add Monitoring

```typescript
// Log history metrics for analysis
agentLogger.info('History loaded', {
  conversationId,
  metrics: {
    messageCount: history.length,
    estimatedTokens: Math.floor(history.reduce((sum, m) => sum + m.content.length, 0) / 4),
    dbFetchTime: fetchEndTime - fetchStartTime,
  },
});
```

---

## Security Checklist

- [x] No agent spawning loops
- [x] Read-only tools enforced
- [x] System prompt blocks spawning
- [x] Error handling doesn't break service
- [x] No code injection risks
- [ ] Database query optimized (NEEDS FIX)
- [ ] Message deduplication (MINOR)
- [x] Token limits enforced
- [x] Max turns enforced (25)

---

## Conclusion

**Overall Risk Level:** 🟡 **LOW-MEDIUM**

**Safe to deploy:** YES, with performance fix recommended

**Critical issues:** NONE
**Performance issues:** Database query inefficiency
**Minor issues:** Message deduplication, race conditions

The implementation is **safe from loop risks** but should optimize the database query to avoid fetching unnecessary data.
