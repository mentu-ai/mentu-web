---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: HANDOFF-BugReportsInterface-v2.0
path: docs/HANDOFF-BugReportsInterface-v2.0.md
type: handoff
intent: execute
version: "2.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T3
author_type: executor

parent: PRD-BugReportsInterface-v2.0
children:
  - PROMPT-BugReportsInterface-v2.0

mentu:
  commitment: cmt_4ecbba4f
  status: pending

validation:
  required: true
  tier: T2
---

# HANDOFF: Bug Reports Interface v2.0

## For the Coding Agent

Fix the bug reports data pipeline so diagnostic data (console logs, behavior traces, screenshots) flows from WarrantyOS to Mentu display.

**Read the full PRD**: `docs/PRD-BugReportsInterface-v2.0.md`

---

## Your Identity

You are operating as **executor** (from this HANDOFF's `author_type` field).

| Dimension | Source | Value |
|-----------|--------|-------|
| **Actor** | Repository manifest | (auto-resolved) |
| **Author Type** | This HANDOFF | executor |
| **Context** | Working directory | mentu-web (hub at Workspaces) |

**Your domain**: technical

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "BugReportsInterface-v2.0",
  "tier": "T3",
  "required_files": [
    "../mentu-ai/supabase/functions/mentu-api/index.ts",
    "../mentu-proxy/src/handlers/bug-screenshot.ts",
    "src/hooks/useBugReports.ts",
    "src/components/bug-report/bug-report-detail.tsx",
    "src/components/bug-report/screenshot-viewer.tsx"
  ],
  "checks": {
    "tsc": true,
    "build": true,
    "test": false
  },
  "mentu": {
    "enabled": true,
    "commitments": {
      "mode": "dynamic",
      "min_count": 1,
      "require_closed": true,
      "require_evidence": true
    }
  },
  "max_iterations": 100
}
```

---

## Build Order

### Stage 1: NO API CHANGES NEEDED

The Mentu API already stores the `meta` field correctly. The issue is that WarrantyOS sends `diagnostic_data` as a **separate top-level field** instead of nesting it inside `meta`.

**No changes required to mentu-ai** - we just need to restructure how WarrantyOS sends the data.

---

### Stage 2: Add Screenshot Upload Handler (mentu-proxy)

**File**: `/Users/rashid/Desktop/Workspaces/mentu-proxy/src/handlers/bug-screenshot.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  PROXY_TOKEN: string;
}

interface ScreenshotRequest {
  bug_id: string;
  screenshot: string;  // base64
  content_type?: string;
}

export async function handleBugScreenshot(
  request: Request,
  env: Env
): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Proxy-Token, X-Workspace-Id',
  };

  try {
    const body: ScreenshotRequest = await request.json();

    if (!body.bug_id || !body.screenshot) {
      return new Response(
        JSON.stringify({ error: 'Missing bug_id or screenshot' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode base64
    const base64Data = body.screenshot.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Check size (max 5MB)
    if (binaryData.length > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Screenshot too large (max 5MB)' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    const fileName = `${body.bug_id}-${Date.now()}.png`;
    const filePath = `bug-screenshots/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('bug-attachments')
      .upload(filePath, binaryData, {
        contentType: body.content_type || 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('[BugScreenshot] Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Upload failed', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('bug-attachments')
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({
        url: urlData.publicUrl,
        path: filePath,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BugScreenshot] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
```

**Add route in**: `/Users/rashid/Desktop/Workspaces/mentu-proxy/src/index.ts`

After the existing bug-webhook handler (around line 77), add:

```typescript
import { handleBugScreenshot } from './handlers/bug-screenshot.js';

// ... in the fetch handler, after bug-webhook:

// Bug screenshot upload endpoint
if (path === '/bug-screenshot' && request.method === 'POST') {
  const proxyToken = request.headers.get('X-Proxy-Token');
  if (proxyToken !== env.PROXY_TOKEN) {
    return errorResponse('unauthorized', 'Invalid or missing X-Proxy-Token', 401);
  }
  return handleBugScreenshot(request, env);
}
```

**Create storage bucket in Supabase**:
```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-attachments', 'bug-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated uploads
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bug-attachments');

-- Allow public reads
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'bug-attachments');
```

**Verification**:
```bash
cd /Users/rashid/Desktop/Workspaces/mentu-proxy
npx wrangler deploy
```

---

### Stage 3: Update WarrantyOS Bug Reporter (projects/inline-substitute)

**File**: `/Users/rashid/Desktop/Workspaces/projects/inline-substitute/vin-to-value-main/src/features/bug-reporter/services/bugReporterService.ts`

**Key Fix**: Move `diagnostic_data` INSIDE `meta` instead of as a separate top-level field.

Add screenshot upload method:

```typescript
/**
 * Upload screenshot to storage and return URL
 */
async uploadScreenshot(bugId: string, screenshot: string): Promise<string | null> {
  if (!screenshot || !MENTU_API_TOKEN) return null;

  try {
    const response = await fetch(`${MENTU_API_URL}/bug-screenshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Token': MENTU_API_TOKEN,
      },
      body: JSON.stringify({
        bug_id: bugId,
        screenshot,
      }),
    });

    if (!response.ok) {
      console.warn('[BugReporter] Screenshot upload failed:', response.status);
      return null;
    }

    const result = await response.json();
    return result.url;
  } catch (error) {
    console.warn('[BugReporter] Screenshot upload error:', error);
    return null;
  }
},
```

Modify the `mentuOperation` structure to nest diagnostic_data inside meta:

```typescript
// BEFORE (broken - diagnostic_data is ignored by API):
const mentuOperation = {
  op: 'capture',
  body,
  kind: 'bug',
  tags: [...],
  priority: 'medium',
  meta: { /* flat strings */ },
  diagnostic_data: {  // ← IGNORED by API!
    console_logs: submission.consoleLogs,
    behavior_trace: submission.behaviorTrace,
    selected_element: submission.element,
  },
};

// AFTER (fixed - diagnostic_data nested in meta):
const mentuOperation = {
  op: 'capture',
  body,
  kind: 'bug',
  meta: {
    // Source information
    source: 'warrantyos',
    source_type: 'bug_reporter',
    session_id: sessionId,
    user_id: userId,
    submitted_at: timestamp,

    // Environment (flat strings)
    page_url: submission.environment?.url || window.location.href,
    browser: submission.environment?.browser?.name || 'unknown',
    browser_version: submission.environment?.browser?.version || 'unknown',
    os: submission.environment?.os?.name || 'unknown',
    os_version: submission.environment?.os?.version || 'unknown',
    viewport: viewportStr,
    screen_resolution: screenResStr,
    timezone: submission.environment?.timezone || 'unknown',
    language: submission.environment?.language || 'unknown',
    user_agent: submission.environment?.userAgent,
    app_url: window.location.origin,

    // Screenshot URL (after upload)
    screenshot_url: screenshotUrl,
    has_screenshot: !!screenshotUrl,

    // DIAGNOSTIC DATA - NOW INSIDE META!
    diagnostic_data: {
      console_logs: submission.consoleLogs,
      behavior_trace: submission.behaviorTrace,
      selected_element: submission.element,
    },
  },
};
```

Also add screenshot upload before capture:

```typescript
async submitReport(submission: BugReportSubmission): Promise<{ id: string }> {
  // ... existing validation code ...

  // Generate temp bug ID for screenshot
  const tempBugId = `bug_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Upload screenshot if exists (before capture)
  let screenshotUrl: string | null = null;
  if (submission.screenshot) {
    screenshotUrl = await this.uploadScreenshot(tempBugId, submission.screenshot);
  }

  // ... build mentuOperation with screenshotUrl in meta ...
}
```

---

### Stage 4: Create Screenshot Viewer (mentu-web)

**File**: `src/components/bug-report/screenshot-viewer.tsx`

```typescript
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Maximize2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ScreenshotViewerProps {
  url: string;
  alt?: string;
}

export function ScreenshotViewer({ url, alt = 'Bug screenshot' }: ScreenshotViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <ImageIcon className="h-4 w-4" />
        <span>Screenshot unavailable</span>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative cursor-pointer group">
          <div className="relative w-full max-w-md aspect-video bg-muted rounded-lg overflow-hidden">
            <Image
              src={url}
              alt={alt}
              fill
              className="object-contain"
              onError={() => setHasError(true)}
              unoptimized
            />
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
            <Maximize2 className="h-6 w-6 text-white" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0">
        <div className="relative w-full min-h-[60vh]">
          <Image
            src={url}
            alt={alt}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Stage 5: Update Bug Report Detail (mentu-web)

**File**: `src/components/bug-report/bug-report-detail.tsx`

Add import and screenshot section:

```typescript
import { ScreenshotViewer } from './screenshot-viewer';

// In the component, after the Description card and before Environment:

{/* Screenshot */}
{bug.environment?.screenshot_url && (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        Screenshot
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ScreenshotViewer
        url={bug.environment.screenshot_url as string}
        alt={`Screenshot for ${bug.title}`}
      />
    </CardContent>
  </Card>
)}
```

Also import `ImageIcon` from lucide-react at the top.

---

### Stage 6: Update useBugReports Hook (mentu-web)

**File**: `src/hooks/useBugReports.ts`

Update the return to extract screenshot_url from meta:

```typescript
return {
  // ... existing fields ...

  // Screenshot URL (from meta)
  screenshot_url: meta?.screenshot_url as string | undefined,

  // ... rest of fields ...
} as BugReport;
```

Add to BugReport interface:

```typescript
export interface BugReport {
  // ... existing fields ...
  screenshot_url?: string;
}
```

---

### Stage 7: Fix RightPanelProvider Error

**Check if any component is using `useRightPanel` outside the provider context.**

The most likely culprit is a component being imported at the module level. Search for:

```bash
grep -r "useRightPanel" src/
```

If the error persists, wrap the problematic component with a provider check:

```typescript
// In the component using useRightPanel
try {
  const { isOpen } = useRightPanel();
} catch {
  // Fallback if not in provider context
  return null;
}
```

Or ensure all routes that use these components go through the `[plane]/layout.tsx`.

---

## Verification Checklist

### Files
- [ ] `mentu-ai/supabase/functions/mentu-api/index.ts` - stores complete payload
- [ ] `mentu-proxy/src/handlers/bug-screenshot.ts` - exists
- [ ] `mentu-proxy/src/index.ts` - has screenshot route
- [ ] `mentu-web/src/components/bug-report/screenshot-viewer.tsx` - exists
- [ ] `mentu-web/src/components/bug-report/bug-report-detail.tsx` - shows screenshot
- [ ] `mentu-web/src/hooks/useBugReports.ts` - extracts screenshot_url

### Checks
- [ ] `npm run build` passes in mentu-web
- [ ] `npx wrangler deploy` succeeds in mentu-proxy
- [ ] `supabase functions deploy mentu-api` succeeds

### Mentu
- [ ] Commitment claimed
- [ ] RESULT document created
- [ ] Evidence captured
- [ ] Commitment submitted

### Functionality
- [ ] Screenshot appears in bug report detail
- [ ] Console logs display with colors
- [ ] Behavior trace shows events
- [ ] RightPanelProvider error is resolved
- [ ] Real-time updates still work

---

## Completion Phase (REQUIRED)

**BEFORE calling `mentu submit`, you MUST create a RESULT document:**

### Step 1: Create RESULT Document

Create: `docs/RESULT-BugReportsInterface-v2.0.md`

### Step 2: Capture RESULT as Evidence

```bash
mentu capture "Created RESULT-BugReportsInterface-v2.0: Fixed bug reports data pipeline with screenshot support" \
  --kind result-document \
  --path docs/RESULT-BugReportsInterface-v2.0.md \
  --refs cmt_XXXXXXXX \
  --author-type executor
```

### Step 3: Update RESULT Front Matter

```yaml
mentu:
  commitment: cmt_XXXXXXXX
  evidence: mem_YYYYYYYY
  status: in_review
```

### Step 4: Submit with Evidence

```bash
mentu submit cmt_XXXXXXXX \
  --summary "Fixed bug reports pipeline: Mentu API stores diagnostic_data, added screenshot upload to mentu-proxy, updated display components" \
  --include-files
```

---

*This HANDOFF enables complete bug report visibility with screenshots and diagnostic data.*
