# Knowledge Base Architecture Plan

## Vision

Build a cognitive infrastructure that captures the multi-dimensional identity of an actor (Rashid), enabling:
- **Agent Context**: Local knowledge for AI agents during conversations
- **Content Portability**: Structured front-matter for future website migration
- **Actor Integration**: Mentu-aware system with genesis key principles
- **Orchestration Layer**: Multi-dimensional context for agentic understanding

---

## Phase 1: Database Schema

### Enable pgvector Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Core Tables

#### 1. `knowledge_sources` - Track content origins

```sql
CREATE TABLE knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  url TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL, -- 'website', 'document', 'api', 'manual'
  title TEXT,
  last_fetched_at TIMESTAMPTZ,
  content_hash TEXT, -- For change detection
  status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'error', 'stale'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. `knowledge_documents` - Full content with front-matter

```sql
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id),

  -- Front-matter structure (for future website migration)
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL, -- 'blog', 'project', 'about', 'paper', 'skill'
  language TEXT DEFAULT 'en',

  -- Content
  raw_content TEXT, -- Original HTML/markdown
  clean_content TEXT, -- Processed text

  -- Front-matter metadata
  front_matter JSONB DEFAULT '{}', -- Structured metadata
  -- Example: { "tags": [], "category": "", "date": "", "author": "" }

  -- Dimensions
  dimensions JSONB DEFAULT '{}',
  -- Example: { "projects": [], "skills": [], "themes": [], "people": [] }

  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(workspace_id, slug)
);
```

#### 3. `knowledge_chunks` - RAG-ready chunks

```sql
CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id),

  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,

  -- Vector embedding (1536 for OpenAI, 1024 for Anthropic)
  embedding vector(1536),

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(document_id, chunk_index)
);

-- Vector similarity index
CREATE INDEX ON knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

#### 4. `knowledge_entities` - Extracted entities

```sql
CREATE TABLE knowledge_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),

  entity_type TEXT NOT NULL, -- 'project', 'skill', 'person', 'concept', 'organization'
  name TEXT NOT NULL,
  canonical_name TEXT, -- Normalized version
  description TEXT,

  -- Rich metadata
  attributes JSONB DEFAULT '{}',
  -- Example for project: { "status": "active", "url": "", "role": "founder" }

  -- Mentu integration
  linked_actor TEXT, -- e.g., 'user:rashid', 'project:mentu'

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(workspace_id, entity_type, canonical_name)
);
```

#### 5. `knowledge_relationships` - Entity connections

```sql
CREATE TABLE knowledge_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),

  source_entity_id UUID REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  target_entity_id UUID REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'created', 'uses', 'knows', 'related_to'

  -- Evidence: which documents support this relationship
  evidence JSONB DEFAULT '[]', -- Array of document_ids

  strength FLOAT DEFAULT 1.0, -- Confidence/frequency
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(source_entity_id, target_entity_id, relationship_type)
);
```

#### 6. `actor_profiles` - Extended actor identity

```sql
CREATE TABLE actor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),

  actor TEXT NOT NULL, -- e.g., 'user:rashid'

  -- Identity
  display_name TEXT,
  bio TEXT,

  -- Communication guidelines
  communication_style JSONB DEFAULT '{}',
  -- Example: { "tone": "direct", "formality": "casual", "preferences": [] }

  -- Principles (extends genesis key)
  principles JSONB DEFAULT '[]',
  -- Example: [{ "rule": "Always cite sources", "priority": 1 }]

  -- Constraints
  constraints JSONB DEFAULT '{}',
  -- Example: { "no_topics": [], "required_disclaimers": [] }

  -- Linked entities
  linked_entities UUID[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(workspace_id, actor)
);
```

---

## Phase 2: Content Pipeline

### Step 1: Sitemap Parser

Parse `sitemap.xml` to extract all URLs with metadata:

```typescript
interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}
```

### Step 2: Content Fetcher

For each URL:
1. Fetch HTML content
2. Extract title, meta description, open graph data
3. Parse main content (article body)
4. Convert to clean text
5. Detect language
6. Infer content type from URL pattern

### Step 3: Content Chunker

Split content for embeddings:
- Target chunk size: ~500 tokens
- Overlap: 50 tokens
- Preserve paragraph boundaries

### Step 4: Embedding Generator

Generate vector embeddings:
- Primary: OpenAI `text-embedding-3-small` (1536 dims)
- Alternative: Anthropic embeddings (future)

### Step 5: Entity Extractor

Extract entities using LLM:
- Projects mentioned
- Skills/technologies
- People referenced
- Concepts/themes
- Organizations

---

## Phase 3: CLI Integration

Extend `mentu-ai` CLI with sync commands:

### Commands

```bash
# Initialize knowledge base (one-time import)
mentu sync init --source https://rashidazarang.com/sitemap.xml

# Incremental sync (detect changes)
mentu sync

# Sync specific source
mentu sync --url https://rashidazarang.com/blog/some-post

# Force re-sync all
mentu sync --force

# Show sync status
mentu sync status

# List sources
mentu sync sources

# Add manual source
mentu sync add --url <url> --type document
```

### Implementation Location

```
mentu-ai/
  src/
    commands/
      sync/
        init.ts      # Full import from sitemap
        run.ts       # Incremental sync
        status.ts    # Show sync state
        sources.ts   # List/manage sources
```

---

## Phase 4: Edge Function

Deploy Supabase Edge Function for scheduled/on-demand sync:

### Function: `knowledge-sync`

```typescript
// supabase/functions/knowledge-sync/index.ts

Deno.serve(async (req: Request) => {
  const { action, url, force } = await req.json();

  switch (action) {
    case 'init':
      return await initSync(url); // Full sitemap import
    case 'sync':
      return await incrementalSync(force); // Check for changes
    case 'single':
      return await syncSingleUrl(url); // Sync one URL
  }
});
```

### Invocation

```bash
# Via CLI
mentu sync init --source <sitemap>  # Calls edge function

# Via API
curl -X POST https://project.supabase.co/functions/v1/knowledge-sync \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{"action": "init", "url": "https://rashidazarang.com/sitemap.xml"}'

# Via scheduler (pg_cron)
SELECT cron.schedule('sync-knowledge', '0 0 * * *', $$
  SELECT net.http_post(
    'https://project.supabase.co/functions/v1/knowledge-sync',
    '{"action": "sync"}'
  )
$$);
```

---

## Phase 5: Mentu Integration

### Genesis Key Extension

Extend genesis key schema to reference knowledge:

```yaml
# .mentu/genesis.key
governance:
  constitution:
    - All commitments must be evidence-based
    - AI agents should reference knowledge base for context

knowledge:
  primary_actor: user:rashid
  sources:
    - https://rashidazarang.com/sitemap.xml

  principles:
    - Cite sources when using knowledge base content
    - Prefer recent content over older content
    - Cross-reference with entity relationships

  communication:
    style: direct
    formality: casual
    constraints:
      - Never share private contact information
```

### Actor Context Retrieval

Function to build agent context from knowledge base:

```typescript
async function getActorContext(actor: string, query?: string): Promise<Context> {
  // 1. Get actor profile
  const profile = await getActorProfile(actor);

  // 2. Get linked entities
  const entities = await getLinkedEntities(profile.linked_entities);

  // 3. If query provided, semantic search
  const relevantChunks = query
    ? await semanticSearch(query, { limit: 10 })
    : [];

  return {
    identity: profile,
    entities,
    knowledge: relevantChunks,
    principles: profile.principles
  };
}
```

---

## Phase 6: Query Interface

### Semantic Search

```sql
-- Find relevant content
CREATE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  workspace uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.document_id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) as similarity
  FROM knowledge_chunks kc
  WHERE (workspace IS NULL OR kc.workspace_id = workspace)
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Context Builder (for agents)

```typescript
// Called by agents before processing user requests
async function buildAgentContext(
  workspaceId: string,
  userQuery: string
): Promise<AgentContext> {
  // 1. Generate embedding for query
  const embedding = await generateEmbedding(userQuery);

  // 2. Semantic search
  const chunks = await searchKnowledge(embedding, 10, workspaceId);

  // 3. Get associated documents
  const documents = await getDocuments(chunks.map(c => c.document_id));

  // 4. Get relevant entities
  const entities = await extractEntitiesFromDocs(documents);

  // 5. Build context
  return {
    relevant_content: chunks.map(c => c.content),
    sources: documents.map(d => ({ title: d.title, url: d.url })),
    entities,
    timestamp: new Date().toISOString()
  };
}
```

---

## Implementation Order

### Sprint 1: Foundation
1. [ ] Apply migration: Enable pgvector extension
2. [ ] Apply migration: Create knowledge tables (sources, documents, chunks)
3. [ ] Apply migration: Create entity tables (entities, relationships)
4. [ ] Apply migration: Create actor_profiles table
5. [ ] Create RLS policies for all tables

### Sprint 2: Edge Function
6. [ ] Create `knowledge-sync` edge function
7. [ ] Implement sitemap parser
8. [ ] Implement content fetcher (using WebFetch or Deno fetch)
9. [ ] Implement content chunker
10. [ ] Integrate embedding generation

### Sprint 3: CLI Integration
11. [ ] Add `sync` command group to mentu-ai
12. [ ] Implement `mentu sync init`
13. [ ] Implement `mentu sync` (incremental)
14. [ ] Implement `mentu sync status`

### Sprint 4: Query & Context
15. [ ] Create semantic search function
16. [ ] Create context builder function
17. [ ] Add entity extraction pipeline
18. [ ] Build relationship graph

### Sprint 5: Mentu Integration
19. [ ] Extend genesis key schema
20. [ ] Create actor profile management
21. [ ] Integrate with bridge commands for agent context
22. [ ] Add knowledge dimension to commitment context

---

## Content Type Mapping

Based on sitemap analysis:

| URL Pattern | Content Type | Dimensions |
|-------------|--------------|------------|
| `/blog/*` | blog | ideas, themes |
| `/c/*` | project | projects, skills |
| `/about/*` | about | identity |
| `/personal/*` | about | identity, philosophy |
| `/papers/*` | paper | ideas, research |
| `/skills/*` | skill | skills, expertise |
| `/es/*` | (mirror) | language: es |

---

## Security Considerations

1. **RLS Policies**: All knowledge tables scoped to workspace
2. **Embedding API Keys**: Stored in Supabase Vault
3. **Content Filtering**: Option to exclude private/draft content
4. **Rate Limiting**: Edge function rate limited to prevent abuse

---

## Future Extensions

1. **Multi-actor profiles**: Support for team knowledge bases
2. **Real-time sync**: Webhook triggers for content updates
3. **Cross-referencing**: Link knowledge to Mentu commitments
4. **Export**: Generate static site from knowledge documents
5. **Versioning**: Track content changes over time
